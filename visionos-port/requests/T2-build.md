# Requests from T2-build

## T2-native: destination-safe status-bar sources for B-21

Targets:
- `packages/react-native/React/CoreModules/RCTStatusBarManager.mm`: after copyright, insert `#import <TargetConditionals.h>` then `#if !TARGET_OS_VISION`; close with `#endif` at EOF.
- `packages/react-native/React/CoreModules/PlatformStubs/RCTStatusBarManager.mm`: after copyright, insert `#import <TargetConditionals.h>` then `#if TARGET_OS_VISION`; close with `#endif` at EOF.

After those guards are applied, T2-build/orchestrator must change `reactCoreModules` in `packages/react-native/Package.swift` from `excludedPaths: ["PlatformStubs/RCTStatusBarManager.mm"]` to `excludedPaths: []`. The original exclusion is deliberately retained until both files are guarded, to avoid duplicate class symbols on existing iOS source builds.

Why: the manifest is executed on the macOS host and cannot use `#if os(visionOS)` to select destination-specific source exclusions. The guards select the correct implementation and keep the existing iOS/Catalyst implementation byte-for-byte. CocoaPods still excludes one or the other. Source SwiftPM visionOS remains incomplete until this coordinated change is applied.

**Resolved during T2:** T2-native applied the real-source guard and used `TARGET_OS_VISION || !defined(SWIFT_PACKAGE)` for the stub to preserve CocoaPods tvOS/macOS behavior. T2-build then removed the manifest exclusion. See `requests/T2-native.md`, “B-21 status-bar request completed”. Native compilation still belongs to T4.

## T2-apis: split-target SwiftPM imports for B-21

Target `packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift`: beneath `import React`, inside its existing `#if os(visionOS)` region, add:
```swift
#if SWIFT_PACKAGE
import RCTSwiftExtensionsObjC
#endif
```
Any other SwiftExtensions Swift source directly referencing `RCTReactViewController` needs the same conditional import. CocoaPods gives it via the mixed-language bridging header; SwiftPM requires separate language targets.

Target `packages/react-native/Libraries/XR/RCTXRModule.mm`: replace the CocoaPods-only generated Swift header import with:
```objc
#if defined(SWIFT_PACKAGE)
@import RCTXR;
#else
#import "RCTXR-Swift.h"
#endif
```
The SwiftPM Swift bridge target is `RCTXR` and the ObjC target is `React-RCTXR`; using a Swift module import exposes Swift's generated Objective-C interface across that target boundary. Keep this inside any existing `#if TARGET_OS_VISION` guard. T4 must compile the boundary against xros; no build is claimed.

**Resolved during T2:** both conditional imports were observed applied by T2-apis.

## T3-apps: CocoaPods source-core selection and CI contract

Targets: `packages/rn-tester/Podfile`, `packages/visionos-template/template/visionos/Podfile`, and their setup documentation.

- Set `ENV['RCT_USE_PREBUILT_RNCORE'] = '0'` before the **first** `use_react_native!` call in a process that contains visionOS targets, or document and enforce `RCT_USE_PREBUILT_RNCORE=0 bundle exec pod install` for that Podfile. A mixed iOS/visionOS Podfile must select source core before configuring its iOS targets too. The build helper rejects unsupported prebuilt-core mode explicitly, including a late switch after core initialization. Do not force source Hermes or disable `RCT_USE_RN_DEP`: those binary archives contain xros slices.
- Define RNTester's `RNTester-visionOS` scheme in `RNTesterPods.xcworkspace`; the new CI action runs that scheme for Debug/Release with `-sdk xrsimulator -destination 'generic/platform=visionOS Simulator'`.
- Preserve `platform=ios` in Metro and support `resolver.platformExtension=visionos` in the RNTester/template resolver. The fork's release bundling script now supplies `--resolver-option platformExtension=visionos` only on xros/xrsimulator.
- Keep template package name `react-native-mindzone-visionos-template`. The release preparer requires both this package and the core package, plus `template.config.js`, `template/package.json`, `template/visionos/Podfile`, a visionOS `.xcodeproj/project.pbxproj`, README and LICENSE.

Why: React.xcframework lacks xros and the podspec mode is process-global. These settings make the application targets agree with B-12/B-17/B-28/B-30 without silently changing an iOS-only install. The CI action generates both core specs before installing pods.
