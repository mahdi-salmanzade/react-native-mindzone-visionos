// `openWindow` and `dismissWindow` are iOS 17 / visionOS 1 APIs and this
// scene only exists on visionOS, so the whole file compiles out elsewhere.
#if os(visionOS)

import SwiftUI

/**
 This SwiftUI struct returns the main React Native scene. Declare it once for the app's main window.

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
 Handles data sharing between React Native and SwiftUI views. Each React scene
 may install this modifier; one mounted host handles notifications at a time.
 Closing that host transfers routing to another mounted scene.
 */
public struct WindowHandlingModifier: ViewModifier {
  typealias UserInfoType = Dictionary<String, AnyHashable>

  @State private var handlerID: UUID?

  @Environment(\.reactContext) private var reactContext
  @Environment(\.openWindow) private var openWindow
  @Environment(\.dismissWindow) private var dismissWindow

  public init() {}

  public func body(content: Content) -> some View {
    // WindowManager checks multi-window support before posting. Immersive
    // scene data must be handled even in apps without multiple windows.
    content
      .onAppear {
        if handlerID == nil {
          handlerID = RCTWindowRouter.shared.register(handle)
        }
      }
      .onDisappear {
        if let handlerID {
          RCTWindowRouter.shared.unregister(handlerID)
        }
        handlerID = nil
      }
  }

  private func handle(_ data: Notification) {
    guard let id = data.userInfo?["id"] as? String else { return }
    switch data.name.rawValue {
      case "RCTOpenWindow":
        guard RCTWindowRouter.claim(data) else { return }
        let props = data.userInfo?["userInfo"] as? UserInfoType ?? [:]
        if let sceneData = reactContext.scenes[id] {
          sceneData.props = (sceneData.props ?? [:]).merging(props) { _, incoming in incoming }
        } else {
          reactContext.scenes[id] = RCTSceneData(id: id, props: props)
        }
        // The value identifies a single instance, even while it is opening.
        // An id-only WindowGroup action creates another window on every call.
        openWindow(id: id, value: id)
      case "RCTUpdateWindow":
        guard
          let userInfo = data.userInfo?["userInfo"] as? UserInfoType,
          let sceneData = reactContext.scenes[id],
          RCTWindowRouter.claim(data) else { return }
        // Merge every delta before SwiftUI can coalesce renders. Null object
        // values are omitted by the JS wrapper / default TurboModule conversion.
        sceneData.props = (sceneData.props ?? [:]).merging(userInfo) { _, incoming in incoming }
      case "RCTDismissWindow":
        guard RCTWindowRouter.claim(data) else { return }
        dismissWindow(id: id)
        reactContext.scenes.removeValue(forKey: id)
      case "RCTOpenImmersiveSpace":
        reactContext.scenes.updateValue(
          RCTSceneData(id: id, props: data.userInfo?["userInfo"] as? UserInfoType),
          forKey: id
        )
      case "RCTDismissImmersiveSpace":
        reactContext.scenes.removeValue(forKey: id)
      default:
        break
    }
  }
}

#endif // os(visionOS)
