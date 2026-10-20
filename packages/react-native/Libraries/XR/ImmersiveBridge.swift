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
private final class ImmersiveBridgeLifecycle {
  private enum State {
    case idle, opening, opened, dismissing, closed
  }

  private let spaceId: String
  private let completionHandler: CompletionHandlerType
  private var state = State.idle
  private var dismissalRequested = false
  private var dismissalHandlers: [() -> Void] = []
  private var dismissAction: DismissImmersiveSpaceAction?

  init(spaceId: String, completionHandler: @escaping CompletionHandlerType) {
    self.spaceId = spaceId
    self.completionHandler = completionHandler
  }

  func appear(open: OpenImmersiveSpaceAction, dismiss: DismissImmersiveSpaceAction) {
    guard state == .idle else { return }
    state = .opening
    dismissAction = dismiss
    Task {
      let result = await open(id: spaceId)
      switch result {
      case .opened:
        state = .opened
        completionHandler(.opened)
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
      if dismissalRequested {
        dismissIfNeeded()
      }
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
    let lifecycle = ImmersiveBridgeLifecycle(spaceId: spaceId, completionHandler: completionHandler)
    return UIHostingController(rootView: ImmersiveBridgeView(lifecycle: lifecycle))
#else
    return UIViewController()
#endif
  }

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
