// `WindowGroup(id:)` needs iOS 16 and additional scenes only exist on
// visionOS, so the whole file compiles out elsewhere.
#if os(visionOS)

import SwiftUI

/**
 `RCTWindow` is a SwiftUI struct that returns additional scenes.

 When visionOS restores a window after relaunch, its in-memory scene data may
 be absent. The window still renders its registered module, and recreates the
 shared scene data with nil props. Props from the previous process are not
 persisted; subsequent WindowManager updates merge into this new scene data.

 Example usage:
 ```
 RCTWindow(id: "SecondWindow", sceneData: reactContext.getSceneData(id: "SecondWindow"))
 ```
 */
public struct RCTWindow: Scene {
  var id: String
  var sceneData: RCTSceneData?
  var moduleName: String
  var contentView: AnyView?

  func getRootView(sceneData: RCTSceneData?) -> RCTRootViewRepresentable {
    return RCTRootViewRepresentable(moduleName: moduleName, initialProps: sceneData?.props ?? [:], devMenuSceneAnchor: nil)
  }

  public var body: some Scene {
    WindowGroup(id: id, for: String.self) { _ in
      RCTWindowContent(id: id, sceneData: sceneData, contentView: contentView)
    } defaultValue: {
      id
    }
  }
}

private struct RCTWindowContent: View {
  @Environment(\.reactContext) private var reactContext
  let id: String
  let sceneData: RCTSceneData?
  let contentView: AnyView?

  var body: some View {
    contentView
      .modifier(WindowHandlingModifier())
      .onAppear {
        if reactContext.scenes[id] == nil {
          reactContext.scenes[id] = sceneData ?? RCTSceneData(id: id, props: nil)
        }
      }
  }
}

extension RCTWindow {
  /// Creates new RCTWindow.
  ///
  /// - Parameters:
  ///   - id: Unique identifier of the window.
  ///   - moduleName: Name of the module registered using `AppRegistry.registerComponent()`
  ///   - sceneData: Data of the scene. Used to sync JS state between windows.
  public init(id: String, moduleName: String, sceneData: RCTSceneData?) {
    self.id = id
    self.moduleName = moduleName
    self.sceneData = sceneData
    self.contentView = AnyView(getRootView(sceneData: sceneData))
  }

  /// Creates new RCTWindow with additional closure to allow applying modifiers to rootView.
  ///
  /// - Parameters:
  ///   - id: Unique identifier of the window.
  ///   - moduleName: Name of the module registered using `AppRegistry.registerComponent()`
  ///   - sceneData: Data of the scene. Used to sync JS state between windows.
  ///   - contentView: Closure which accepts rootView, allows to apply additional modifiers to React Native rootView.
  public init<Content: View>(
    id: String,
    moduleName: String,
    sceneData: RCTSceneData?,
    @ViewBuilder contentView: @escaping (_ view: RCTRootViewRepresentable) -> Content
  ) {
    self.id = id
    self.moduleName = moduleName
    self.sceneData = sceneData
    self.contentView = AnyView(contentView(getRootView(sceneData: sceneData)))
  }

  /// Creates new RCTWindow with additional closure to allow applying modifiers to rootView.
  ///
  /// - Parameters:
  ///   - id: Unique identifier of the window. Same id will be used for moduleName.
  ///   - sceneData: Data of the scene. Used to sync JS state between windows.
  ///   - contentView: Closure which accepts rootView, allows to apply additional modifiers to React Native rootView.
  public init<Content: View>(
    id: String,
    sceneData: RCTSceneData?,
    @ViewBuilder contentView: @escaping (_ view: RCTRootViewRepresentable) -> Content
  ) {
    self.id = id
    self.moduleName = id
    self.sceneData = sceneData
    self.contentView = AnyView(contentView(getRootView(sceneData: sceneData)))
  }

  /// Creates new RCTWindow.
  ///
  /// - Parameters:
  ///   - id: Unique identifier of the window. Same id will be used for moduleName.
  ///   - sceneData: Data of the scene. Used to sync JS state between windows.
  public init(id: String, sceneData: RCTSceneData?) {
    self.id = id
    self.moduleName = id
    self.sceneData = sceneData
    self.contentView = AnyView(getRootView(sceneData: sceneData))
  }
}

#endif // os(visionOS)
