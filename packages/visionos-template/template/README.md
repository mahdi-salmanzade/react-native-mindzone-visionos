# HelloWorld

A bare React Native 0.88.0 app for visionOS, with iOS and Android projects included. Derived from the ReactVision 0.86.4 and Callstack 0.79.6 templates; their MIT attribution is retained in LICENSE.

## Create an app

Once the fork and template version are published:

```sh
npx @react-native-community/cli init MyApp --template react-native-mindzone-visionos-template
cd MyApp
```

The template pins React Native tooling to 0.88.0, React and its test renderer to 19.3.0, and Community CLI packages (including `cli-platform-apple`) to 20.2.0. Use Node 22.13+, 24.3+, or 26+. For an unpublished local release, supply the packed template archive to `--template` and make its pinned fork/tooling dependencies available to your package manager.

## Run in the visionOS simulator

Install Xcode with the visionOS SDK and an Apple Vision Pro simulator runtime. The shared minimum deployment version is visionOS 1.0. The port's local validation environment uses Xcode 27.1 and the visionOS 27.0 simulator. Ruby dependencies require CocoaPods 1.16.2+ and Xcodeproj 1.27+.

From the generated app root:

```sh
bundle install
cd visionos
RCT_USE_PREBUILT_RNCORE=0 bundle exec pod install
cd ..
npm start
```

In another terminal at the app root:

```sh
npm run visionos -- --simulator "Apple Vision Pro"
```

Alternatively open `visionos/MyApp.xcworkspace`, select the `MyApp` scheme and a visionOS simulator, then run. The native smoke test is in the same scheme; keep Metro running for Debug tests. Release builds bundle `index.js` as `main.jsbundle`.

The visionOS Podfile sets `RCT_USE_PREBUILT_RNCORE=0` before configuring React because the upstream React core archive has no xros slice. Leave `RCT_USE_RN_DEP` and Hermes source-build settings unset: their supported prebuilt artifacts are retained. `USE_FRAMEWORKS=static` or `USE_FRAMEWORKS=dynamic` is optional. `.xcode.env` locates Node; set an absolute `NODE_BINARY` in `.xcode.env.local` if Xcode cannot find it. No signing team is preselected.

## Package and Metro resolution

The app depends directly on `react-native-mindzone-visionos@0.88.0`. Its `react-native` dependency is an npm alias of that same version, so third-party peer dependencies never request the upstream runtime. Package managers may materialize both names. Metro and Jest deliberately resolve both names to the direct fork, and Metro resolves React from the app root. The CLI, CocoaPods and Android Gradle use the same direct fork path. Keep these configurations together when changing versions.

`Platform.OS` remains `ios` on visionOS; use `Platform.isVision` to detect it. The debug bundle URL and release bundler pass `resolver.platformExtension=visionos`, and the included Metro resolver selects `.visionos.js`/`.visionos.tsx` before iOS/native fallbacks. Ordinary iOS bundles omit that resolver option.

The starter declares one `RCTMainWindow` with the shared React context and forwards incoming URLs to `RCTLinkingManager`. Its scene manifest permits multiple scenes. To use `WindowManager` or `XR`, first declare matching `RCTWindow` or `ImmersiveSpace` IDs in `visionos/MyApp/App.swift` and register each additional React component; enabling the scene manifest alone does not create them.

## iOS, Android and checks

The iOS app uses the 0.88 scene delegate and `RCTReactNativeFactory`. Install its pods separately with `cd ios && bundle exec pod install`, then run `npm run ios` from the app root. It retains the normal iOS prebuilt-core default.

The Android project uses the 0.88 HelloWorld configuration: Gradle 9.4.1, build tools/compile SDK 37, target SDK 35, minimum SDK 24, NDK 27.1.12297006 and Kotlin 2.1.20. Install those SDK components before `npm run android`.

```sh
npm test -- --runInBand
npm run typecheck
npm run lint
```

The starter's Jest and native smoke tests assert the visible `Hello, World!` heading. Full CocoaPods installation, native compilation, simulator launch and packed-template installation are release verification steps; source and project validation alone do not establish those outcomes.
