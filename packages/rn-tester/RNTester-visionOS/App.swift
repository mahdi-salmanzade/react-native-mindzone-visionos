// Copyright (c) Meta Platforms, Inc. and affiliates.
// Licensed under the MIT license in the root directory of this source tree.

#if os(visionOS)
import SwiftUI
import React
import React_RCTSwiftExtensions

@main
struct RNTesterApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  @Environment(\.reactContext) private var reactContext

  @State private var immersionLevel: ImmersionStyle = .full

  var body: some Scene {
    RCTMainWindow(moduleName: "RNTesterApp")
      .onOpenURL(perform: { url in
        RCTLinkingManager.onOpenURL(url: url)
      })
      .environment(\.reactContext, reactContext)

    RCTWindow(id: "SecondWindow", sceneData: reactContext.getSceneData(id: "SecondWindow")) { rootView in
      rootView.ornament(attachmentAnchor: .scene(.bottom)) {
        VStack {
          Button("Hey!") {}
        }
        .glassBackgroundEffect()
      }
    }
      .defaultSize(CGSize(width: 400, height: 700))
      .environment(\.reactContext, reactContext)

    ImmersiveSpace(id: "TestImmersiveSpace") {
      EmptyView()
        .environment(\.reactContext, reactContext)
    }
      .immersionStyle(selection: $immersionLevel, in: .mixed, .progressive, .full)
  }
}
#endif
