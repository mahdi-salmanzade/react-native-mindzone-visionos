#if os(visionOS)
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

// SwiftExtensions uses this delegate's shared RCTReactNativeFactory and
// RCTRootViewFactory to create Fabric roots inside SwiftUI windows.
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    dependencyProvider = RCTAppDependencyProvider()
    automaticallyLoadReactNativeWindow = false
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
#endif
