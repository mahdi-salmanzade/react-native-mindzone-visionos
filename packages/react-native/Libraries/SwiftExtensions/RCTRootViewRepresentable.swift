// `UIHostingOrnament`, `UIViewController.ornaments` and
// `glassBackgroundEffect()` are visionOS-only.
#if os(visionOS)

import SwiftUI
import React
#if SWIFT_PACKAGE
import RCTSwiftExtensionsObjC
#endif

/**
 SwiftUI view enclosing `RCTReactViewController`. Its main purpose is to display React Native views inside of SwiftUI lifecycle.

 When hosting this view directly in a custom WindowGroup or ImmersiveSpace,
 apply WindowHandlingModifier so that scene can route WindowManager operations
 after other windows close. RCTMainWindow and RCTWindow do this automatically.

 Use it create new windows in your app:
 Example:
 ```swift
  WindowGroup {
    RCTRootViewRepresentable(moduleName: "YourAppName")
      .modifier(WindowHandlingModifier())
  }
 ```
 */
public struct RCTRootViewRepresentable: UIViewControllerRepresentable {
  public typealias InitialPropsType = [AnyHashable: Any]?

  var moduleName: String
  var initialProps: InitialPropsType
  var devMenuSceneAnchor: UnitPoint?

  public init(
    moduleName: String,
    initialProps: InitialPropsType = nil,
    devMenuSceneAnchor: UnitPoint? = .bottom
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.devMenuSceneAnchor = devMenuSceneAnchor
  }

  public func makeUIViewController(context: Context) -> RCTReactViewController {
    let viewController = RCTReactViewController(moduleName: moduleName, initProps: initialProps)
#if DEBUG
    if let devMenuSceneAnchor {
      let ornament = UIHostingOrnament(sceneAnchor: devMenuSceneAnchor) {
        DevMenuView()
      }
      viewController.ornaments.append(ornament)
    }
#endif
    return viewController
  }

  public func updateUIViewController(_ uiViewController: RCTReactViewController, context: Context) {
    uiViewController.updateProps(initialProps)
  }
}

/**
 Toolbar which displays additional controls to easily open dev menu and trigger reload command.
 */
struct DevMenuView: View {
  var body: some View {
    HStack {
      Button(action: {
        RCTTriggerReloadCommandListeners("User Reload")
      }, label: {
        Image(systemName: "arrow.clockwise")
      })
      Button(action: {
        NotificationCenter.default.post(
          Notification(name: Notification.Name("RCTShowDevMenuNotification"), object: nil)
        )
      }, label: {
        Image(systemName: "filemenu.and.selection")
      })
    }
    .padding()
    .glassBackgroundEffect()
  }
}

#endif // os(visionOS)
