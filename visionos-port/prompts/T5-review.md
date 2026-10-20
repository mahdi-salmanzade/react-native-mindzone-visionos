You are task **T5-review**: an independent, adversarial code reviewer. You are read-only, so edit nothing.

This repository is a fork of React Native 0.88.0 that adds visionOS support, published as `react-native-mindzone-visionos`. Read `AGENTS.md` (the "This fork" section) and `visionos-port/PLAN.md` for its rules. Review the full change set: `git diff base/upstream-v0.88.0 -- . ':!visionos-port' ':!packages/rn-tester/Podfile.lock' ':!packages/rn-tester/RNTesterPods.xcodeproj/project.pbxproj'`, plus every file that diff adds.

Use the reports in `visionos-port/reports/` only as claims to check, never as evidence.

Priorities, in order:

1. **Any behaviour change on iOS, macOS, tvOS or Android.** Look for:
   - unguarded edits, and guards that are inverted or wrong (`TARGET_OS_VISION` vs `TARGET_OS_IOS`; `#if os(visionOS)` vs `#if !os(...)`);
   - changes to shared C++ or JS paths that run off visionOS;
   - CocoaPods, Ruby, SwiftPM, codegen or Xcode-script changes that alter an iOS-only `pod install`, the podspec dependency graph, prebuilt-core selection, Hermes resolution or build outputs;
   - consumers depending on `min_supported_versions` now picking up visionOS unexpectedly.
2. **Correctness and thread safety of the new native code:** the XR module, the WindowManager module, `ImmersiveBridge.swift` and the SwiftExtensions (`RCTMainWindow`, `RCTWindow`, `RCTRootViewRepresentable`, `RCTReactViewController`, `RCTReactContext`). Check:
   - main-queue use, and that every promise resolves or rejects exactly once;
   - early returns after a reject;
   - session-state races;
   - retain cycles, notification observers that are never removed, and weak/strong mistakes;
   - the focused-window and dimension updates in `RCTUtils.mm` and `RCTDeviceInfo.mm`;
   - the `RCTLinkingManager` initial-URL cache.
3. **Consumer install breakage:** codegen library config, the npm `files` list, `react-native.config.js` / CLI wiring, and the `react-native` npm alias. Would an app depending on `"react-native": "npm:react-native-mindzone-visionos@0.88.0"` build for both iOS and visionOS?
4. **Release safety:** confirm `scripts/oot-release.js` and the CI workflows cannot publish, tag or push without an explicit flag or secret, and cannot target the upstream `react-native` package name.

For every finding give:

- **severity** (blocker, major or minor)
- **file:line**
- **a concrete failure scenario**
- **a suggested fix**
- **confidence**

Report only real, specific defects: no style nits, no speculative "consider" items. Verify each finding against the code before reporting it, and drop any you cannot substantiate. End with a short list of the areas you checked and found clean.
