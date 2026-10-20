# Requests from T2-native

## T2-apis: SwiftUI window focus and dimensions (N-01/N-11/N-16)

Target: `packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m`.

- After updating `appDelegate.lastFocusedWindow` in `tapGesture:`, post `RCTWindowFrameDidChangeNotification` on the main thread. Set the notification object to the target window (the runtime does not filter on object).
- Post the same notification after the controller's view attaches to its window (`viewDidAppear:` is sufficient for initial presentation), and after a size transition completes, when the window bounds reflect the new size. The reference's notification at the start of `viewWillTransitionToSize:withTransitionCoordinator:` alone can report the previous bounds. Use the transition coordinator's completion callback and handle a transition that is not enqueued.
- Clear `lastFocusedWindow` when its window closes, if it is still that window. The native lookup now rejects disconnected, background and immersive scenes, but clearing the weak hint avoids stale focus when another window becomes active.

Why: visionOS DeviceInfo now observes the actual focused window, reattaches its KVO observer on focus/window notifications, and emits changed dimensions. SwiftUI can create the first window after DeviceInfo initializes, and SecondWindow needs to update the shared dimension source when focus changes. `RCTAppDelegate.lastFocusedWindow` is weak/nullable and visionOS-only.

## T2-apis: explicit visionOS hover view prop (NEW-1): WITHDRAWN by the orchestrator

> **Withdrawn.** The orchestrator's T2-native prompt named `visionos_hoverEffect` by mistake. Neither reference fork has it, and upstream 0.88 already drives visionOS hover from `cursor: 'pointer'`. Do not implement this prop. A cleanup task removes the parts already added, on both the native and the JS/types side.

Targets: `packages/react-native/Libraries/Components/View/ViewPropTypes.js`, `packages/react-native/Libraries/NativeComponent/BaseViewConfig.ios.js`, `packages/react-native/types_DEPRECATED/Libraries/Components/View/ViewPropTypes.d.ts`, and regenerated public types/API snapshots owned by T2-apis.

Neither local reference fork defines `visionos_hoverEffect`; existing hover support uses `cursor: 'pointer'`. The user explicitly requested the named prop. Native code adds the following contract (optional clarification was offered; absent a reply, this is the chosen default):

```js
visionos_hoverEffect?: 'auto' | 'highlight' | 'lift' | 'none',
```

Add this optional view prop to `ViewPropsIOS` with a visionOS-only doc comment. Add `visionos_hoverEffect: true` to native view valid attributes **only when `Platform.isVision`** (conditional object spread/import is sufficient). Add the corresponding optional deprecated TypeScript view prop and regenerate public types/API snapshots; do not hand-edit generated output. If another codegen schema duplicates base View props, add the same optional string enum there as well.

Native behavior: omission/null resets to the existing cursor behavior; `auto`, `highlight`, and `lift` explicitly enable their UIKit effects; `none` disables hover even with `cursor: 'pointer'`. Unknown strings fall back to existing cursor behavior. C++ parsing, native view-manager metadata and rendering are guarded by `TARGET_OS_VISION`; other platforms retain upstream behavior.

## T2-build / T3-apps: Metro platform extension (N-08)

Targets: the Metro resolver setup in the visionOS template and RNTester (`packages/visionos-template/template/metro.config.js`, `packages/rn-tester/metro.config.js`) and CLI/build integration owned by T2-build/T3-apps.

Preserve `platform=ios` and ensure the selected resolver understands the custom `resolver.platformExtension=visionos` query emitted by `RCTBundleURLProvider` on visionOS. Apply the same resolver option to release bundling. This is an integration request corresponding to B-04/B-17/P-17; no JS platform identity change is requested.

## T3-apps: multiple-window scene declaration

Targets: RNTester and template visionOS `Info.plist` and SwiftUI app entry points.

Set `UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes` to true, register the `SecondWindow` window group with the same identifier used by WindowManager, and forward `.onOpenURL` to `RCTLinkingManager.onOpenURL(url:)`. This is the native integration dependency of the existing P-05/P-06/P-10/P-19/P-20 work.

## T2-build: B-21 status-bar request completed (NEW-6)

Implemented the requested real-source `!TARGET_OS_VISION` guard. The stub uses `TARGET_OS_VISION || !defined(SWIFT_PACKAGE)` rather than an unconditional vision-only guard: CocoaPods already selects this stub for tvOS/macOS and must retain that behavior. SwiftPM includes both files and now gets exactly the visionOS stub or the existing iOS/Catalyst real implementation. The excluded real xros source and excluded SwiftPM iOS stub parse successfully; active implementations still need the full dependency/header build in T4.
