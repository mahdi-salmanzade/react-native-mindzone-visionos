// `openWindow` and `dismissWindow` are iOS 17 / visionOS 1 APIs and this
// scene only exists on visionOS, so the whole file compiles out elsewhere.
#if os(visionOS)

import SwiftUI

/**
 This SwiftUI struct returns the main React Native scene. It should be used only once because it installs window notification handlers.

 Example:
 ```swift
 @main
 struct YourApp: App {
   @UIApplicationDelegateAdaptor var delegate: AppDelegate

   var body: some Scene {
     RCTMainWindow(moduleName: "YourApp")
   }
 }
 ```

 The app delegate must subclass `RCTAppDelegate` and set
 `automaticallyLoadReactNativeWindow` to `false` before calling the superclass
 launch method. The delegate's shared root view factory hosts every React scene.

 To create additional windows, declare `RCTWindow()` scenes and set
 `UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes` to `true` in
 Info.plist. Pass the same `reactContext` environment to the main window and
 additional scenes. Use `onOpenURL(perform:)` to forward URLs to
 `RCTLinkingManager.onOpenURL` when the app supports React Native links.
 */
public struct RCTMainWindow: Scene {
  var moduleName: String
  var initialProps: RCTRootViewRepresentable.InitialPropsType
  var onOpenURLCallback: ((URL) -> ())?
  var devMenuSceneAnchor: UnitPoint?
  var contentView: AnyView?

  var rootView: RCTRootViewRepresentable {
    RCTRootViewRepresentable(moduleName: moduleName, initialProps: initialProps, devMenuSceneAnchor: devMenuSceneAnchor)
  }

  /// Creates a new RCTMainWindow.
  ///
  /// - Parameters:
  ///   - moduleName: Name of the module registered using `AppRegistry.registerComponent()`
  ///   - initialProps: Initial properties for this view.
  ///   - devMenuSceneAnchor: Placement of the additional controls for triggering reload and the dev menu.
  public init(
    moduleName: String,
    initialProps: RCTRootViewRepresentable.InitialPropsType = nil,
    devMenuSceneAnchor: UnitPoint? = .bottom
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.devMenuSceneAnchor = devMenuSceneAnchor
    self.contentView = AnyView(rootView)
  }

  /// Creates a new RCTMainWindow.
  ///
  /// - Parameters:
  ///   - moduleName: Name of the module registered using `AppRegistry.registerComponent()`
  ///   - initialProps: Initial properties for this view.
  ///   - devMenuSceneAnchor: Placement of the additional controls for triggering reload and the dev menu.
  ///   - contentView: Closure which accepts rootView, allows to apply additional modifiers to React Native rootView.
  public init<Content: View>(
    moduleName: String,
    initialProps: RCTRootViewRepresentable.InitialPropsType = nil,
    devMenuSceneAnchor: UnitPoint? = .bottom,
    @ViewBuilder contentView: @escaping (_ view: RCTRootViewRepresentable) -> Content
  ) {
    self.moduleName = moduleName
    self.initialProps = initialProps
    self.devMenuSceneAnchor = devMenuSceneAnchor
    self.contentView = AnyView(contentView(rootView))
  }

  public var body: some Scene {
    WindowGroup {
      contentView
        .modifier(WindowHandlingModifier())
        .onOpenURL(perform: { url in
          onOpenURLCallback?(url)
        })
    }
  }
}

extension RCTMainWindow {
  public func onOpenURL(perform action: @escaping (URL) -> ()) -> Self {
    var scene = self
    scene.onOpenURLCallback = action
    return scene
  }
}

/**
 Handles data sharing between React Native and SwiftUI views.
 */
public struct WindowHandlingModifier: ViewModifier {
  typealias UserInfoType = Dictionary<String, AnyHashable>

  @Environment(\.reactContext) private var reactContext
  @Environment(\.openWindow) private var openWindow
  @Environment(\.dismissWindow) private var dismissWindow
  @Environment(\.supportsMultipleWindows) private var supportsMultipleWindows

  public init() {}

  public func body(content: Content) -> some View {
    // Attach listeners only if app supports multiple windows
    if supportsMultipleWindows {
      content
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RCTOpenWindow"))) { data in
          guard let id = data.userInfo?["id"] as? String else { return }
          reactContext.scenes.updateValue(RCTSceneData(id: id, props: data.userInfo?["userInfo"] as? UserInfoType), forKey: id)
          openWindow(id: id)
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RCTUpdateWindow"))) { data in
          guard
            let id = data.userInfo?["id"] as? String,
            let userInfo = data.userInfo?["userInfo"] as? UserInfoType else { return }
          reactContext.scenes[id]?.props = userInfo
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RCTDismissWindow"))) { data in
          guard let id = data.userInfo?["id"] as? String else { return }
          dismissWindow(id: id)
          reactContext.scenes.removeValue(forKey: id)
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RCTOpenImmersiveSpace"))) { data in
          guard let id = data.userInfo?["id"] as? String else { return }
          reactContext.scenes.updateValue(
            RCTSceneData(id: id, props: data.userInfo?["userInfo"] as? UserInfoType),
            forKey: id
          )
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RCTDismissImmersiveSpace"))) { data in
          guard let id = data.userInfo?["id"] as? String else { return }
          reactContext.scenes.removeValue(forKey: id)
        }
    } else {
      content
    }
  }
}

#endif // os(visionOS)
