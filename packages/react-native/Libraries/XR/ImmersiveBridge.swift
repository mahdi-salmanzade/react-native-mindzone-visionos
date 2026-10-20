#if canImport(UIKit)
import Foundation
import SwiftUI
import UIKit

@objc public enum ImmersiveSpaceResult: Int {
  case opened
  case userCancelled
  case error
}

public typealias CompletionHandlerType = (_ result: ImmersiveSpaceResult) -> Void

#if os(visionOS)
@MainActor
private final class ImmersiveBridgeLifecycle: NSObject {
  private enum State {
    case idle, opening, opened, dismissing, closed
  }

  private let spaceId: String
  private let completionHandler: CompletionHandlerType
  private let dismissalHandler: () -> Void
  private var state = State.idle
  private var dismissalRequested = false
  private var dismissalReported = false
  private var dismissalHandlers: [() -> Void] = []
  private var dismissAction: DismissImmersiveSpaceAction?
  private weak var immersiveScene: UIScene?
  private var sceneDisconnected = false

  init(
    spaceId: String,
    completionHandler: @escaping CompletionHandlerType,
    dismissalHandler: @escaping () -> Void
  ) {
    self.spaceId = spaceId
    self.completionHandler = completionHandler
    self.dismissalHandler = dismissalHandler
    super.init()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  func appear(open: OpenImmersiveSpaceAction, dismiss: DismissImmersiveSpaceAction) {
    guard state == .idle else { return }
    state = .opening
    dismissAction = dismiss
    NotificationCenter.default.addObserver(
      self, selector: #selector(sceneWillConnect(_:)), name: UIScene.willConnectNotification, object: nil
    )
    NotificationCenter.default.addObserver(
      self, selector: #selector(sceneDidDisconnect(_:)), name: UIScene.didDisconnectNotification, object: nil
    )
    Task {
      let result = await open(id: spaceId)
      switch result {
      case .opened:
        if immersiveScene == nil && !sceneDisconnected {
          immersiveScene = UIApplication.shared.connectedScenes.first {
            $0.session.role == .immersiveSpaceApplication
          }
        }
        state = sceneDisconnected ? .closed : .opened
        completionHandler(sceneDisconnected ? .error : .opened)
      case .userCancelled:
        state = .closed
        completionHandler(.userCancelled)
      case .error:
        state = .closed
        completionHandler(.error)
      @unknown default:
        state = .closed
        completionHandler(.error)
      }
      if dismissalRequested || sceneDisconnected {
        dismissIfNeeded()
      }
    }
  }

  @objc private func sceneWillConnect(_ notification: Notification) {
    guard state == .opening,
      let scene = notification.object as? UIScene,
      scene.session.role == .immersiveSpaceApplication else { return }
    immersiveScene = scene
  }

  @objc private func sceneDidDisconnect(_ notification: Notification) {
    guard let scene = notification.object as? UIScene,
      scene === immersiveScene else { return }
    sceneDisconnected = true
    if state == .opened {
      // Also runs when the user leaves with the Digital Crown, without endSession().
      state = .closed
      finishDismissal()
    }
  }

  func requestDismissal(completion: (() -> Void)? = nil) {
    if let completion {
      dismissalHandlers.append(completion)
    }
    dismissalRequested = true
    dismissIfNeeded()
  }

  private func dismissIfNeeded() {
    switch state {
    case .opening, .dismissing:
      // An opening request cannot be cancelled. Dismiss it as soon as it finishes.
      return
    case .opened:
      state = .dismissing
      Task {
        await dismissAction?()
        state = .closed
        finishDismissal()
      }
    case .idle, .closed:
      state = .closed
      finishDismissal()
    }
  }

  private func finishDismissal() {
    let handlers = dismissalHandlers
    dismissalHandlers.removeAll()
    if !dismissalReported {
      dismissalReported = true
      NotificationCenter.default.removeObserver(self)
      dismissalHandler()
    }
    for handler in handlers {
      handler()
    }
  }
}

/**
 * Utility view used to bridge the gap between SwiftUI environment and UIKit.
 *
 * Calls `openImmersiveSpace` when the view appears in the UIKit hierarchy and
 * `dismissImmersiveSpace` when removed. Explicit dismissal waits for any pending
 * open request, so a subsequent session cannot race the previous dismissal.
 * Both removal and the immersive scene disconnecting report dismissal exactly
 * once, including a user leaving the space with the Digital Crown.
 */
private struct ImmersiveBridgeView: View {
  @Environment(\.openImmersiveSpace) private var openImmersiveSpace
  @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace

  let lifecycle: ImmersiveBridgeLifecycle

  var body: some View {
    EmptyView()
      .onAppear {
        lifecycle.appear(open: openImmersiveSpace, dismiss: dismissImmersiveSpace)
      }
      .onDisappear {
        lifecycle.requestDismissal()
      }
  }
}
#endif

@MainActor
@objc public class SwiftUIBridgeFactory: NSObject {
  @objc public static func makeImmersiveBridgeView(
    spaceId: String,
    completionHandler: @escaping CompletionHandlerType
  ) -> UIViewController {
#if os(visionOS)
    return makeImmersiveBridgeView(spaceId: spaceId, completionHandler: completionHandler, dismissalHandler: {})
#else
    return UIViewController()
#endif
  }

#if os(visionOS)
  @objc public static func makeImmersiveBridgeView(
    spaceId: String,
    completionHandler: @escaping CompletionHandlerType,
    dismissalHandler: @escaping () -> Void
  ) -> UIViewController {
    let lifecycle = ImmersiveBridgeLifecycle(
      spaceId: spaceId, completionHandler: completionHandler, dismissalHandler: dismissalHandler
    )
    return UIHostingController(rootView: ImmersiveBridgeView(lifecycle: lifecycle))
  }
#endif

  @objc public static func dismissImmersiveBridgeView(
    _ viewController: UIViewController,
    completionHandler: @escaping () -> Void
  ) {
#if os(visionOS)
    guard let host = viewController as? UIHostingController<ImmersiveBridgeView> else {
      completionHandler()
      return
    }
    host.rootView.lifecycle.requestDismissal(completion: completionHandler)
#else
    completionHandler()
#endif
  }
}
#endif
