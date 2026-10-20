#if os(visionOS)
import SwiftUI
import React
import React_RCTSwiftExtensions

@main
struct HelloWorldApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  @Environment(\.reactContext) private var reactContext

  var body: some Scene {
    RCTMainWindow(moduleName: "HelloWorld")
      .onOpenURL { url in
        RCTLinkingManager.onOpenURL(url: url)
      }
      .environment(\.reactContext, reactContext)
  }
}
#endif
