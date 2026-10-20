You are task **T2-native** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`).

{{COMMON}}

## Your area: the native runtime

You own `packages/react-native/React/**`, `ReactApple/**`, `ReactCommon/**` and the native files under `Libraries/**`, but not the new visionOS-only directories (those belong to T2-apis). The exact list is in PLAN.md.

Beyond the inventory items, make sure the following hold.

**API audit.** Every iOS-only UIKit/Foundation API reached on the visionOS compile path is either guarded or replaced with the visionOS-correct equivalent.

- Sweep `packages/react-native/{React,ReactApple,ReactCommon,Libraries}` for at least these, and compare each hit against what the forks did:
  - `UIScreen mainScreen` / `UIScreen.main`
  - `[UIScreen mainScreen].scale` and the other display-scale lookups
  - `UIDevice.orientation`, `UIInterfaceOrientation`, `statusBarOrientation`, `statusBarFrame`, `UIStatusBar*`, `setStatusBarHidden`, `statusBarManager`
  - `UIApplication.sharedApplication.keyWindow`, `windows`, `delegate.window`
  - `UIFeedbackGenerator` / haptics
  - `UIScreen brightness`
  - `UIKeyboard` frame notifications
  - `UIMenuController`
  - `UIPasteboard` detection APIs
  - `UIScrollView.keyboardDismissMode` interactive variants
  - `UIRefreshControl` behaviour
  - `UIDatePicker` styles
  - `CADisplayLink` creation (visionOS needs `-[UIView displayLinkWithTarget:selector:]` or a scene-bound link)
  - `traitCollection.displayScale` fallbacks
- Track new code that 0.88 added since 0.86.2: run `diff -rq` against `$REF/gh/upstream-0.86.2/packages/react-native`, then inspect.

**Scene behaviour.** The scene and window model must work as in the forks: key-window lookup across connected scenes, dimensions from the window scene, not `UIScreen`, and multiple windows (SecondWindow) so the WindowManager APIs can function. The native module side of WindowManager and XR belongs to T2-apis; coordinate through `requests/`.

**Hover and pointer.** Port the visionOS hover-effect support, the `visionos_hoverEffect` view prop, and its view-component plumbing as both forks did. Where the prop is declared in JS or in a codegen spec, T2-apis owns that side. File a request covering what you need.

**Feature flags and C++.** Don't change shared C++ behaviour for other platforms. Where C++ needs a platform branch, use the existing `__APPLE__`/`TARGET_OS_*` patterns in `ReactCommon`.

**Static checks to run** (record them): for files you change, attempt a syntax-only compile against the visionOS simulator SDK, for example:

```
xcrun -sdk xrsimulator clang -fsyntax-only -fobjc-arc -fmodules -x objective-c++ -std=c++20 \
  -target arm64-apple-xros1.0-simulator -I packages/react-native -I packages/react-native/React \
  -I packages/react-native/ReactCommon <file>
```

Most files will fail on missing generated headers or pods. When that happens, record it and move on; don't fight the environment. Use the same approach with `-target arm64-apple-ios15.1-simulator -sdk iphonesimulator`, or the 0.88 minimum, to confirm iOS still parses. Swift files can be checked with `xcrun -sdk xrsimulator swiftc -typecheck` when they are self-contained.
