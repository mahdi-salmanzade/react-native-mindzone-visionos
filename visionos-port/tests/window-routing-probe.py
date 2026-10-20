#!/usr/bin/env python3
"""Run the production window router on macOS with real Foundation notifications.

Only the source's outer visionOS guard is removed. SwiftUI integration checks
below inspect source; they do not prove window identity or lifecycle at runtime.
Run from any directory: python3 visionos-port/tests/window-routing-probe.py
"""

from pathlib import Path
import re
import shlex
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[2]
SWIFT = ROOT / "packages/react-native/Libraries/SwiftExtensions"

HARNESS = r'''
@MainActor
func checkWindowRouting() {
  let center = NotificationCenter()
  let router = RCTWindowRouter(notificationCenter: center)
  var ids: [UUID] = []
  var deliveries: [Int] = []
  var actions: [Int] = []
  var reenter = false
  var handover = false

  // Model separately mounted copies of the same modifier. Identity must be
  // allocated at registration, not inherited from a copied initial View value.
  for index in 0..<64 {
    ids.append(router.register { notification in
      deliveries.append(index)
      guard RCTWindowRouter.claim(notification) else { return }
      precondition((notification.object as! NSMutableDictionary)["handled"] as? Bool == true)
      actions.append(index)
      if handover {
        handover = false
        router.unregister(ids[index])
        center.post(notification)
      } else if reenter {
        reenter = false
        center.post(notification)
      }
    })
  }
  precondition(Set(ids).count == 64, "Every mounted host needs a unique identity")

  for name in ["RCTOpenWindow", "RCTUpdateWindow", "RCTDismissWindow"] {
    deliveries = []
    actions = []
    let request = NSMutableDictionary(dictionary: ["handled": false])
    center.post(name: Notification.Name(name), object: request, userInfo: ["id": "SecondWindow"])
    precondition(deliveries == [0], "Only the elected host may receive a request")
    precondition(actions == [0], "Exactly one action per fresh request")
    precondition(request["handled"] as? Bool == true, "ACK must be synchronous")
    center.post(name: Notification.Name(name), object: request, userInfo: ["id": "SecondWindow"])
    precondition(actions == [0], "Reposting a consumed request must not act again")
  }
  print("PASS: 64 distinct mount registrations; open/update/close delivered once and claimed synchronously")

  deliveries = []
  actions = []
  reenter = true
  center.post(name: Notification.Name("RCTOpenWindow"),
              object: NSMutableDictionary(dictionary: ["handled": false]),
              userInfo: ["id": "SecondWindow"])
  precondition(deliveries == [0, 0])
  precondition(actions == [0], "Consume the shared request before reentrant action delivery")
  print("PASS: reentrant delivery consumes the same request only once")

  deliveries = []
  actions = []
  handover = true
  center.post(name: Notification.Name("RCTOpenWindow"),
              object: NSMutableDictionary(dictionary: ["handled": false]),
              userInfo: ["id": "SecondWindow"])
  precondition(deliveries == [0, 1], "Synchronous host removal must elect the survivor")
  precondition(actions == [0], "Handover must not replay the claimed action")
  center.post(name: Notification.Name("RCTOpenWindow"),
              object: NSMutableDictionary(dictionary: ["handled": false]),
              userInfo: ["id": "SecondWindow"])
  precondition(deliveries == [0, 1, 1])
  precondition(actions == [0, 1], "The next independent request must reach the survivor")
  print("PASS: host removal during action preserves one action and hands the next request to the survivor")

  // Removing a non-elected host must not disturb the elected one.
  router.unregister(ids[32])
  actions = []
  center.post(name: Notification.Name("RCTUpdateWindow"),
              object: NSMutableDictionary(dictionary: ["handled": false]),
              userInfo: ["id": "SecondWindow"])
  precondition(actions == [1])

  for id in ids { router.unregister(id) }
  deliveries = []
  actions = []
  let unclaimed = NSMutableDictionary(dictionary: ["handled": false])
  center.post(name: Notification.Name("RCTOpenWindow"), object: unclaimed,
              userInfo: ["id": "SecondWindow"])
  precondition(deliveries.isEmpty && actions.isEmpty)
  precondition(unclaimed["handled"] as? Bool == false, "No live host must leave the request unclaimed")
  let remount = router.register { notification in
    if RCTWindowRouter.claim(notification) { actions.append(64) }
  }
  precondition(!ids.contains(remount))
  center.post(name: Notification.Name("RCTOpenWindow"), object: unclaimed,
              userInfo: ["id": "SecondWindow"])
  precondition(actions == [64] && unclaimed["handled"] as? Bool == true)
  router.unregister(remount)
  precondition(!RCTWindowRouter.claim(Notification(name: Notification.Name("RCTOpenWindow"))))
  print("PASS: absent hosts leave requests unclaimed; remount resumes delivery; missing claim object rejected")
}

@MainActor
func checkImmersiveRouting() {
  let center = NotificationCenter()
  let router = RCTWindowRouter(notificationCenter: center)
  var deliveries: [String] = []
  var ids: [UUID] = []
  for index in 0..<64 {
    ids.append(router.register { notification in
      deliveries.append("\(index):\(notification.name.rawValue)")
    })
  }
  // XR posts scene-data notifications without WindowManager's claim dictionary.
  for name in ["RCTOpenImmersiveSpace", "RCTDismissImmersiveSpace"] {
    center.post(name: Notification.Name(name), object: nil, userInfo: ["id": "TestImmersiveSpace"])
  }
  precondition(deliveries == ["0:RCTOpenImmersiveSpace", "0:RCTDismissImmersiveSpace"])
  router.unregister(ids[0])
  for name in ["RCTOpenImmersiveSpace", "RCTDismissImmersiveSpace"] {
    center.post(name: Notification.Name(name), object: nil, userInfo: ["id": "TestImmersiveSpace"])
  }
  precondition(deliveries == ["0:RCTOpenImmersiveSpace", "0:RCTDismissImmersiveSpace",
                              "1:RCTOpenImmersiveSpace", "1:RCTDismissImmersiveSpace"])
  for id in ids { router.unregister(id) }
  center.post(name: Notification.Name("RCTOpenImmersiveSpace"), object: nil)
  precondition(deliveries.count == 4)
  print("PASS: XR scene-data notifications reach one host and survive elected-host removal")
}

MainActor.assumeIsolated {
  checkWindowRouting()
  checkImmersiveRouting()
}
'''


def check_swiftui_integration():
    window = (SWIFT / "RCTWindow.swift").read_text()
    main = (SWIFT / "RCTMainWindow.swift").read_text()
    assert re.search(r"WindowGroup\(id:\s*id,\s*for:\s*String\.self\)", window)
    assert re.search(r"defaultValue:\s*\{\s*id\s*\}", window)
    assert re.search(r"openWindow\(id:\s*id,\s*value:\s*id\)", main)
    assert not re.search(r"openWindow\(id:\s*id\)", main)
    assert ".modifier(WindowHandlingModifier())" in window
    assert ".modifier(WindowHandlingModifier())" in main
    assert "RCTWindowRouter.shared.register(handle)" in main
    assert "RCTWindowRouter.shared.unregister(handlerID)" in main
    assert ".onReceive(" not in main, "Per-view notification subscriptions reintroduce fanout"
    for name, end in [("RCTOpenWindow", "RCTUpdateWindow"),
                      ("RCTUpdateWindow", "RCTDismissWindow"),
                      ("RCTDismissWindow", "RCTOpenImmersiveSpace")]:
        branch = main.split(f'case "{name}":', 1)[1].split(f'case "{end}":', 1)[0]
        claim = branch.index("RCTWindowRouter.claim(data)")
        mutations = [branch.find(token) for token in
                     ["sceneData.props =", "reactContext.scenes[id] =", "dismissWindow("]]
        assert all(claim < position for position in mutations if position >= 0), name
    print("PASS: source integration uses shared router, claim-before-mutation, and matching String window values", flush=True)
    print("LIMIT: SwiftUI value identity and scene lifecycle require the simulator probe; not executed here", flush=True)


def main():
    check_swiftui_integration()
    source = (SWIFT / "RCTWindowRouter.swift").read_text()
    match = re.fullmatch(r"#if os\(visionOS\)\n(.*)\n#endif // os\(visionOS\)\s*", source, re.S)
    assert match, "Expected the production router's outer visionOS guard"
    with tempfile.TemporaryDirectory(prefix="T8-window-routing-") as folder:
        folder = Path(folder)
        swift_file = folder / "main.swift"
        swift_file.write_text(match.group(1) + "\n" + HARNESS)
        executable = folder / "window-routing-probe"
        command = ["xcrun", "--sdk", "macosx", "swiftc", "-swift-version", "5",
                   "-module-cache-path", str(folder / "module-cache"),
                   str(swift_file), "-o", str(executable)]
        print("+ " + shlex.join(command), flush=True)
        subprocess.run(command, check=True)
        print("+ " + str(executable), flush=True)
        subprocess.run([str(executable)], check=True)


if __name__ == "__main__":
    main()
