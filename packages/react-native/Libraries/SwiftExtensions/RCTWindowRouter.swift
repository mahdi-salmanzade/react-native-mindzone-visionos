#if os(visionOS)

import Foundation

/// One synchronous notification subscription per event, regardless of how many
/// SwiftUI scenes are mounted. The first live host supplies the window actions.
@MainActor
final class RCTWindowRouter {
  static let shared = RCTWindowRouter()

  private var handlers: [(id: UUID, receive: (Notification) -> Void)] = []
  private var observers: [NSObjectProtocol] = []

  init(notificationCenter: NotificationCenter = .default) {
    for name in ["RCTOpenWindow", "RCTUpdateWindow", "RCTDismissWindow",
                 "RCTOpenImmersiveSpace", "RCTDismissImmersiveSpace"] {
      observers.append(notificationCenter.addObserver(
        forName: Notification.Name(name), object: nil, queue: nil
      ) { [weak self] notification in
        // The native modules post synchronously on the main queue. Do not hop
        // into a Task: WindowManager reads the claim before posting returns.
        nonisolated(unsafe) let notification = notification
        MainActor.assumeIsolated {
          self?.handlers.first?.receive(notification)
        }
      })
    }
  }

  func register(_ receive: @escaping (Notification) -> Void) -> UUID {
    // Allocate on mount, not in a View value's initial state: WindowGroup can
    // copy that initial state into more than one scene instance.
    let id = UUID()
    handlers.append((id, receive))
    return id
  }

  func unregister(_ id: UUID) {
    handlers.removeAll { $0.id == id }
  }

  static func claim(_ notification: Notification) -> Bool {
    guard let request = notification.object as? NSMutableDictionary,
      !(request["handled"] as? Bool ?? false) else { return false }
    // Consume before any scene mutation/action, including synchronous host
    // removal or reentrant delivery. Native code uses this as its acceptance ACK.
    request["handled"] = true
    return true
  }
}

#endif // os(visionOS)
