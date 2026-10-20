// Copyright (c) Meta Platforms, Inc. and affiliates.
// Licensed under the MIT license in the root directory of this source tree.

#if os(visionOS)
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.dependencyProvider = RCTAppDependencyProvider()
    self.automaticallyLoadReactNativeWindow = false

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "js/RNTesterApp.ios")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
#endif
