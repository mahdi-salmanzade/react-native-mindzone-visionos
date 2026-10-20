# T2-apis report

Implemented the owned visionOS APIs and JS/type surface against React Native 0.88.0. ReactVision 0.86.4 is the primary reference, checked against Callstack 0.79.6. Reference trees were read-only. No network, git writes, publishing, dependency installation, node_modules writes, or full app build was performed.

`RN` below means `packages/react-native`. All apply/adapt items have source implementations. Full application linkage/runtime verification remains T4's responsibility. Type generation used a temporary source projection to avoid writing generated files in the separately owned virtualized-lists package; the snapshot also needs the generator alias fix requested from T2-build.

**T2-fixup update:** the explicit hover prop was withdrawn by the orchestrator and removed. Historical commands/results below describe T2 as it ran; see [T2-fixup](T2-fixup.md) for the final cleanup, ordinary-workspace regeneration, and verification.

## Inventory status

| ID | Status | Files (under RN unless stated) | Notes |
| --- | --- | --- | --- |
| A-01 | done (confirmed upstream) | `Libraries/Utilities/Platform.{ios,android}.js`, `PlatformTypes.js`, native constants inspected | OS remains `ios`; isVision checks `interfaceIdiom === 'vision'`; Android returns false. Platform.select keeps the iOS branch. PlatformColor and Linking already use the compatible iOS paths. |
| A-02 | done | `Libraries/Components/Keyboard/Keyboard.js`, `__tests__/Keyboard-test.js` | No internal subscriptions on visionOS; addListener warns once and returns removable no-op; removeAllListeners no-op. Other behavior unchanged. |
| A-03 | done | `Libraries/Components/Keyboard/KeyboardAvoidingView.js` | Warns once, skips subscriptions, renders ordinary View with children/style/ref/rest props. |
| A-04 | done | `Libraries/Components/ScrollView/ScrollView.js` | Guards all four keyboard subscriptions; retains metrics and animated attachment. |
| A-05 | done | `Libraries/Components/StatusBar/StatusBar.js`, `__tests__/StatusBar-test.js` | Guards both mount and unmount so 0.88 mounted-count/appearance bookkeeping stays balanced. Native visionOS PlatformStubs setters are no-ops by inspection. |
| A-06 | done | `Libraries/Components/TextInput/InputAccessoryView.js` | Native branch excludes visionOS; warning/null fallback retained. |
| A-07 | done (obsolete confirmed) | Removed `Libraries/NewAppScreen` path checked | No welcome screen restored. T3 owns current template UI. |
| A-08 | done | `Libraries/SwiftExtensions/RCTReactContext.swift` | Observable scene data, equality, context lookup and SwiftUI environment key; visionOS-only. |
| A-09 | done | `Libraries/SwiftExtensions/RCTMainWindow.swift` | Both initializers, custom content, URL callback, window and immersive scene notifications; startup/plist documentation. |
| A-10 | done | `Libraries/SwiftExtensions/RCTWindow.swift` | Four initializers, matching WindowGroup ID, scene props, no secondary dev-menu ornament, missing-data fatal diagnostic. |
| A-11 | done | `Libraries/SwiftExtensions/RCTRootViewRepresentable.swift` | UIKit controller wrapper, prop updates and DEBUG ornament; SwiftPM import request applied. |
| A-12 | done | `Libraries/SwiftExtensions/RCTReactViewController.{h,m}` | Current Fabric hosting view/factory; null-preserving prop merge; focus/attachment/resize/disconnection notifications coordinated with T2-native. |
| A-13 | done | `Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec` | Explicit AppDelegate dependency, source globs, Swift 5, package metadata, RN_BUILDING marker. |
| A-14 | done | `Libraries/WindowManager/{NativeWindowManager,WindowManager}.js`, tests | Lazy-safe optional native module; getWindow ID/open/update/close and support constant; omitted/null payloads normalize to `{}`. |
| A-15 | done | `Libraries/WindowManager/RCTWindowManager.{h,mm}` | Generated protocol/TurboModule implementation, typed constants, main-queue notifications; return after unsupported-scenes rejection. |
| A-16 | done | `Libraries/WindowManager/React-RCTWindowManager.podspec` | Current C++ helper, dependencies/header subspec/generated spec dependency; no prebuilt source filtering. |
| A-17 | done | `Libraries/XR/{NativeXRModule,XR}.js`, tests | requestSession/endSession promises, missing-module rejection, optional/null unrestricted object payload, docs. |
| A-18 | done | `Libraries/XR/RCTXRModule.{h,mm}` | Main-queue immersive lifecycle, failure/cancellation cleanup, duplicate/no-root errors, pending-open/end/reopen ordering, SwiftPM import request. |
| A-19 | done | `Libraries/XR/ImmersiveBridge.swift` | ObjC enum/completion/factory; main-actor SwiftUI open/dismiss state; unknown results complete with error. iOS fallback retained; macOS compiles out. |
| A-20 | done | `Libraries/XR/React-RCTXR.podspec` | Explicit RCTXR Swift module name, generated spec dependency, current helpers; full source compilation. |
| A-21 | done | `visionos_modules/Native{XRModule,WindowManager}.js` | Required string IDs, 0.88 UnsafeObject/codegen syntax, non-enforcing lookups; generated Apple protocols and implementation verified in /tmp. |
| A-22 | done | `React/React-RCTFBReactNativeSpecVisionOS.podspec` | Current React-bridging dependency, framework/header mapping, RN_BUILDING; generated implementation always included. |
| A-23 | done | `index.js`, `index.js.flow` | ESM-default lazy XR/WindowManager getters and matching named types. StyleSheet unchanged. Root getter tests pass. |
| A-24 | done; workspace integration verified by T2-fixup | `types_generated/**`, `ReactNativeApi.d.ts`, `types_DEPRECATED/index.d.ts`, new legacy XR/window declarations, `__typetests__/visionos.ts` | Generated current types/snapshot; preserved XRStatic/WindowStatic/WindowManagerStatic/Window and value/type aliases. No false runtime Window export. T2-fixup ran ordinary workspace generation and both TypeScript suites successfully; sibling generated types remain ignored upstream-style. |
| A-25 | done (obsolete confirmed) | Removed `types/tsconfig.json`; current `__typetests__/tsconfig*.json` inspected | Current bundler/exports resolution retained; no legacy config recreated. |
| A-26 | done (skip honored) | `Libraries/Core/ReactNativeVersion.js` inspected | 0.88 version retained. No reference version stamp copied. |
| A-27 | done (skip honored) | `ReactNativeApi.d.ts` generated | No foreign snapshot hunks copied. T2-fixup removed the withdrawn hover prop and applied the alias fix. Only XR/WindowManager declarations and exports differ from upstream; all existing export hashes are unchanged. |

No disagreement with the already-upstream/obsolete classifications. PLAN's updated ownership explicitly permits types_DEPRECATED, types_generated and __typetests__, superseding INVENTORY's earlier warning that those paths were unassigned.

## Reference deviations and 0.88 adaptations

- Prefer ReactVision throughout: ESM default wrappers, Swift visionOS guards, current pod helpers and separate generated-spec pod. Do not reproduce Callstack's StyleSheet export typo.
- Native modules/headers and SwiftExtensions compile out off visionOS. ImmersiveBridge preserves the reference plain UIViewController fallback on UIKit platforms, and adds `canImport(UIKit)` so macOS has no UIKit implementation.
- Public IDs are required primitive strings. All public object payloads may be omitted or null; wrappers normalize them to `{}` before calling nonnullable native UnsafeObject specs. Explicit `| null` unions are necessary in public Flow declarations because the type generator replaces nullable `?T` inside object members with undefined. No payload schema restriction was introduced.
- Handwritten compatibility declarations live under `types_DEPRECATED/Libraries/{XR,WindowManager}` according to 0.88's exports conditions. The normal declarations are generated from Flow. The reference runtime `Window` declaration was false: keep only the Window type alias and obtain handles through WindowManager.getWindow.
- StatusBar unmount returns early too; copying only the reference mount guard corrupts 0.88's static counter. The test verifies appearance-listener creation/removal after visionOS mount/unmount cycles.
- Use RCTSurfaceHostingProxyRootView.appProperties instead of deprecated RCTRootView. Preserve factory access through RCTAppDelegate; remove the unused reference factory protocol and call superclass lifecycle methods.
- WindowManager returns immediately after rejection; close consistently rejects unsupported multiple scenes. Promise resolution indicates notification dispatch, as in the references, not observed presentation of a SwiftUI window.
- XR rejects missing root controllers, cleans cancelled/failed sessions and scene data, keeps session ID through teardown, and serializes state on the main queue. Internal Swift dismissal completion waits for an in-flight open to finish and then dismisses, preventing premature reopen. Unknown future SwiftUI results reject instead of leaving a promise pending. Correct UIKit child-controller containment ordering is used.
- New pods derive repository/homepage/version from package.json; module pods retain Callstack authorship and the generated-spec pod retains ReactVision attribution. No remote existence claim was made. Use current React-bridging, explicit AppDelegate dependency and explicit RCTXR module name; never filter new implementation out through prebuilt-core helpers.
- New file formatting was normalized only within owned sources, except the separately disclosed formatter incident below.

## NEW items

| ID | Status | Files | Finding/change |
| --- | --- | --- | --- |
| NEW-1 | done | `Libraries/SwiftExtensions/RCTReactViewController.m` | `setValuesForKeysWithDictionary:` removes NSNull values; Foundation probe confirmed it. `addEntriesFromDictionary:` preserves explicit null and existing keys. |
| NEW-2 | done | same | Focus tap recognizer uses `cancelsTouchesInView = NO` so it does not cancel RN touch delivery. |
| NEW-3 | withdrawn by orchestrator | View props/config, view config test, legacy types, generated types | Removed by T2-fixup. Neither reference fork exposes `visionos_hoverEffect`; upstream `cursor: 'pointer'` already drives visionOS hover. |
| NEW-4 | done | `Libraries/SwiftExtensions/RCTReactViewController.m` | T2-native request: notify dimensions on initial attachment/focus and after resize completion; clear matching weak focused-window hint on scene disconnection, not temporary view disappearance. |
| NEW-5 | done | `types_DEPRECATED/Libraries/Utilities/Platform.d.ts` | Legacy Android isVision declaration was missing despite runtime false and generated Flow declaration. Added boolean with no runtime change. |
| NEW-6 | done | four new podspecs | 0.88 first-party pod helper `mark_as_react_native_build(s)` enables internal headers under RN_STRICT_API. |
| NEW-7 | done, linkage unverified | `RCTRootViewRepresentable.swift`, `RCTXRModule.mm` | T2-build SwiftPM split-language target imports, within existing visionOS guards. |
| NEW-8 | applied and verified in workspace by T2-fixup | `scripts/js-api/build-types/buildApiSnapshot.js` (T2-build owned) | Package rename breaks internal react-native import rewriting; retain canonical source alias for the core snapshot directory. |

## Cross-task requests and incoming requests

See [T2-apis requests](../requests/T2-apis.md) for exact changes and rationale: codegen config/output/publishing, header subspecs and pod installation, SwiftPM graph, focused-window/platform contracts, T3 scene wiring, API generator alias fix, and the remaining codegen Set Flow annotation.

Incoming [T2-native requests](../requests/T2-native.md) for hover and focus/dimensions are implemented. Incoming [T2-build requests](../requests/T2-build.md) for the SwiftPM import boundaries are implemented. Concurrent native changes already supply the guarded weak lastFocusedWindow property.

T3 must use a SwiftUI App with one RCTMainWindow, the shared RCTReactContext, RCTWindow declarations whose IDs match WindowManager calls, and explicitly declared ImmersiveSpace IDs matching XR calls. The delegate subclasses RCTAppDelegate, supplies RCTAppDependencyProvider, and disables automaticallyLoadReactNativeWindow before superclass launch. Forward onOpenURL to RCTLinkingManager.

Required Info.plist shape:

```xml
<key>UIApplicationSceneManifest</key>
<dict>
  <key>UIApplicationPreferredDefaultSceneSessionRole</key>
  <string>UIWindowSceneSessionRoleApplication</string>
  <key>UIApplicationSupportsMultipleScenes</key>
  <true/>
  <key>UISceneConfigurations</key>
  <dict/>
</dict>
```

## JS, Flow, codegen and type checks

Commands below ran from the repo root unless `--cwd` is shown. BABEL_DISABLE_CACHE=1 prevented Babel cache writes to node_modules. Validation logs are under `/private/tmp/T2-apis-*.log`.

- `BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/XR packages/react-native/Libraries/WindowManager packages/react-native/Libraries/Components/Keyboard/__tests__/Keyboard-test.js packages/react-native/Libraries/Components/StatusBar/__tests__/StatusBar-test.js packages/react-native/Libraries/NativeComponent/__tests__/BaseViewConfig-test.js --runInBand --watchman=false`: **5 suites / 24 tests passed**. Includes root getters, payload normalization, unavailable-module/native rejection, window IDs, native hover payload removal/filtering and Keyboard/StatusBar regressions. Earlier component/API/hover subsets also passed.
- `BABEL_DISABLE_CACHE=1 yarn flow-check`: initial pass reported zero errors while parallel work was still landing. Later pass found six owned errors and one T2-build error. All owned errors were fixed. Final `BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/t2-apis-platform-flow`: **one remaining error**, T2-build `scripts/codegen/generate-artifacts-executor/utils.js:171`, underconstrained `new Set()`. Exact annotation request filed. Do not interpret the early zero-error run as the final result.
- Scoped ESLint is used in place of the root `yarn lint` script, which always scans the whole repository. Exact final scoped command and result are recorded below.
- Direct local Prettier over changed/new JS/Flow/legacy declarations/type test: passed. No generated declarations were manually formatted or edited.
- `BABEL_DISABLE_CACHE=1 node packages/react-native-codegen/lib/cli/combine/combine-js-to-schema-cli.js /tmp/T2-apis-schema.json packages/react-native/visionos_modules --platform ios --libraryName FBReactNativeSpec_visionOS`: **passed**.
- `BABEL_DISABLE_CACHE=1 node packages/react-native/scripts/generate-specs-cli.js --platform ios --schemaPath /tmp/T2-apis-schema.json --outputDir /tmp/T2-apis-codegen --libraryName FBReactNativeSpec_visionOS --libraryType modules`: **passed**. Generated required NSString IDs/NSDictionary payloads and typed constants match native implementations; actual generated .mm syntax check passed (native log below).
- `BABEL_DISABLE_CACHE=1 yarn --cwd /tmp/T2-apis-types-fgjpbc25 build-types`: **passed** after applying only the requested canonical-name fix in the temporary generator copy. The projection copies scripts/config/metadata, reads current source via symlinks, uses existing node_modules read-only, and writes sibling types under /tmp. Core generated types were copied verbatim into RN/types_generated; RN/ReactNativeApi.d.ts was regenerated through an owned-output link. No generated output was hand-edited. An initial projection linked types_generated itself; the generator's directory glob skipped that link and API Extractor failed with missing projectFolder. Replacing that with a real temporary output directory fixed the harness.
- `BABEL_DISABLE_CACHE=1 yarn test-generated-typescript`: **failed** because the ordinary workspace lacks `packages/virtualized-lists/types_generated`, so TypeScript falls back to incompatible handwritten list declarations; also exposed the now-fixed Platform.isVision test narrowing. The sibling package is outside this task's ownership.
- `BABEL_DISABLE_CACHE=1 yarn tsc -p /tmp/T2-apis-typescript-generated.json`: **passed** for the complete normal type-test suite. The temporary config extends the exact normal config and only maps @react-native/virtualized-lists to its freshly generated temporary declarations. No sources or assertions are omitted.
- `BABEL_DISABLE_CACHE=1 yarn test-typescript-legacy`: **passed** after adding the missing Android isVision compatibility declaration.
- Additional strict visionOS-only type checks exposed null lost by the nullable-property transform; explicit null unions fixed the owned APIs. The generated declarations also have three unrelated strict-mode errors (AnimatedProps optional/index signature, VirtualizedList derived-state variance, ReactNativeDocument textContent). The focused strict generated check uses skipLibCheck for those declarations; ordinary full-suite checking does not. Final strict results are recorded below.
- No Fantom/native integration test runner was built: ScrollView/InputAccessoryView integration suites require a native tester, deferred with T4 app verification. No full CocoaPods/Xcode app build or simulator launch was attempted.

## Ownership/formatting incident

A purported scoped `yarn prettier --check <paths>` invoked the existing root script's global `prettier --write "./**/*.{js,md,yml,ts,tsx}"`. It reported formatting five T2-build-owned files: `RN/scripts/setup-apple-spm.js`, `RN/scripts/spm/generate-spm-autolinking.js`, `RN/scripts/spm/scaffold-package-swift.js`, `scripts/monorepo/for-each-package.js`, and `scripts/new-github-release-url.js`. Another such invocation was interrupted before reaching scripts. No semantic changes or outside-ownership rollback were attempted. The exact affected paths are flagged to T2-build/orchestrator in requests for review. Subsequent formatting used the direct local binary with explicit owned paths. The task did not intentionally modify package.json, yarn.lock or the Hermes compiler line.

## Open risks

- T4 must link static/framework CocoaPods and SwiftPM targets, verify bridgeless module discovery, and run app/iOS regression builds. Syntax/type checks are not app builds.
- Full SwiftExtensions visionOS type checking is blocked by the sandbox preventing the Observation macro plugin from starting (`sandbox_apply: Operation not permitted`). Syntax, focused root/ornament checks and nonvision compile-out checks passed.
- Actual scene mounting, supportsMultipleWindows environment, focus/Dimensions, resizing, URLs, property updates and interactive hover remain runtime checks. Native notifications require the main SwiftUI host to be mounted.
- XR must be exercised for opened/cancelled/error, duplicate request, pending-open end, repeated end, reopen, system dismissal and app/root disappearance. SwiftUI cannot cancel an opening request, so endSession waits for the open result before dismissing.
- Normal workspace type generation/checking must be rerun after T2-build accepts the alias request and supplies sibling generated types. The one remaining full Flow error belongs to T2-build.
- Final package source metadata/tag existence was not checked over the network. Minimum deployment compatibility is supported by isolated SDK checks, not a complete dependency build.

## Native API check details

## Checks (exact commands)

1. Passed standalone visionOS Swift typecheck:

```sh
xcrun swiftc -typecheck -target arm64-apple-xros1.0-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -module-name RCTXR -module-cache-path /private/tmp/t2-apis-xr-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

2. Passed Swift module and Objective-C header generation to /tmp; inspected emitted selectors and enum constants, which match native usage:

```sh
xcrun swiftc -emit-module -emit-objc-header -emit-objc-header-path /private/tmp/t2-apis-RCTXR-Swift.h -emit-module-path /private/tmp/t2-apis-RCTXR.swiftmodule -target arm64-apple-xros1.0-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -module-name RCTXR -module-cache-path /private/tmp/t2-apis-xr-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
rg -n 'SwiftUIBridgeFactory|makeImmersive|dismissImmersive|ImmersiveSpaceResult' /private/tmp/t2-apis-RCTXR-Swift.h
```

3. Passed standalone iOS Swift typecheck (nonvision fallback):

```sh
xcrun swiftc -typecheck -target arm64-apple-ios15.1-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator27.1.sdk -module-name RCTXR -module-cache-path /private/tmp/t2-apis-xr-ios-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

The initial attempt incorrectly assumed iPhoneSimulator27.0.sdk and failed to find SDK/standard library; `xcrun --sdk iphonesimulator --show-sdk-path` located 27.1 and the corrected command above passed.

4. Passed native visionOS Objective-C++ syntax check with -Werror, real 0.88 headers, freshly generated actual specs, and actual emitted Swift header; no stubs. `/private/tmp/t2-apis-native-headers` contains symlinks from React/ to repo React+Libraries header basenames, RCTRequired/ to Libraries/Required, RCTTypeSafety/ to Libraries/TypeSafety, FBLazyVector/ to Libraries/FBLazyVector/FBLazyVector, RCTDeprecation/ to ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported, RCTXR-Swift.h to the generated /tmp header. The first attempt lacked the RCTDeprecation mapping; adding that actual header mapping resolved it.

```sh
xcrun clang++ -fsyntax-only -fobjc-arc -fblocks -std=c++20 -DRN_BUILDING=1 -DRCT_NEW_ARCH_ENABLED=1 -Werror -Wno-deprecated-declarations -Wno-nullability-completeness -target arm64-apple-xros1.0-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -I/private/tmp/t2-apis-native-headers -I/private/tmp/T2-apis-codegen -Ipackages/react-native/ReactCommon -Ipackages/react-native/ReactCommon/jsi -Ipackages/react-native/ReactCommon/callinvoker -Ipackages/react-native/ReactCommon/react/nativemodule/core -Ipackages/react-native/ReactCommon/react/nativemodule/core/platform/ios packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
```

5. Passed syntax-only compile of freshly generated visionOS implementation with the same actual headers:

```sh
xcrun clang++ -fsyntax-only -fobjc-arc -fblocks -std=c++20 -DRN_BUILDING=1 -DRCT_NEW_ARCH_ENABLED=1 -Werror -Wno-deprecated-declarations -Wno-nullability-completeness -target arm64-apple-xros1.0-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -I/private/tmp/t2-apis-native-headers -I/private/tmp/T2-apis-codegen -Ipackages/react-native/ReactCommon -Ipackages/react-native/ReactCommon/jsi -Ipackages/react-native/ReactCommon/callinvoker -Ipackages/react-native/ReactCommon/react/nativemodule/core -Ipackages/react-native/ReactCommon/react/nativemodule/core/platform/ios /private/tmp/T2-apis-codegen/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS-generated.mm
```

6. Passed iOS Objective-C++ syntax check, confirming native module code compiles out:

```sh
xcrun clang++ -fsyntax-only -target arm64-apple-ios15.1-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator27.1.sdk packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
```

7. Each `ruby -c` passed for the three new podspecs. CocoaPods 1.16.2 real helper evaluation passed with ordinary pods and USE_FRAMEWORKS=static:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby -r cocoapods -r ./packages/react-native/scripts/react_native_pods.rb -e 'ARGV.each { |path| spec = Pod::Specification.from_file(path); attrs = spec.to_hash; puts({name: spec.name, module_name: spec.module_name, platforms: spec.available_platforms.map(&:to_s), sources: attrs["source_files"], dependencies: spec.dependencies.map(&:name), definitions: attrs["pod_target_xcconfig"]["GCC_PREPROCESSOR_DEFINITIONS"]}.to_json) }' packages/react-native/Libraries/WindowManager/React-RCTWindowManager.podspec packages/react-native/Libraries/XR/React-RCTXR.podspec packages/react-native/React/React-RCTFBReactNativeSpecVisionOS.podspec
USE_FRAMEWORKS=static GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby -r cocoapods -r ./packages/react-native/scripts/react_native_pods.rb -e 'ARGV.each { |path| spec = Pod::Specification.from_file(path); attrs = spec.to_hash; puts({name: spec.name, module_name: spec.module_name, header_mappings_dir: attrs["header_mappings_dir"], sources: attrs["source_files"]}.to_json) }' packages/react-native/Libraries/WindowManager/React-RCTWindowManager.podspec packages/react-native/Libraries/XR/React-RCTXR.podspec packages/react-native/React/React-RCTFBReactNativeSpecVisionOS.podspec
```

Results: platforms iOS15.1/visionOS1.0; XR module_name=RCTXR; spec ordinary module name FBReactNativeSpec_visionOS and framework module name React_RCTFBReactNativeSpecVisionOS; implementation source globs intact; all RN_BUILDING=1. An initial inspection script incorrectly read `spec.source_files` (no getter); switching to `spec.to_hash['source_files']` passed. Plain Homebrew Ruby initially could not load CocoaPods until its installed GEM_HOME was supplied.

8. Clang-format initial dry run identified formatting in copied/new files. Formatted only the four newly added native header/implementation files. Final dry run passed:

```sh
/opt/homebrew/opt/llvm/bin/clang-format -i packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/XR/RCTXRModule.h packages/react-native/Libraries/WindowManager/RCTWindowManager.mm packages/react-native/Libraries/WindowManager/RCTWindowManager.h
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/XR/RCTXRModule.h packages/react-native/Libraries/WindowManager/RCTWindowManager.mm packages/react-native/Libraries/WindowManager/RCTWindowManager.h
```

## Open risks

No CocoaPods install/full app build, link, simulator launch or interactive scene lifecycle was run. Framework and static pod evaluation plus actual Swift header generation verify names/configuration, not final linkage. T4 must exercise opened/cancelled/error, duplicate request, end while opening, repeated end, reopened session, app/root disappearance and multiple windows. Pending open cannot be cancelled through SwiftUI's API; endSession waits for system open result then dismisses if needed. Native notifications still depend on RCTMainWindow mounted in the application's SwiftUI scene tree, as in both references. Package metadata still pointed at upstream when evaluated; B-01 must finalize it.

## Final integration follow-up

Applied the T2-build request in `visionos-port/requests/T2-build.md`: RCTXRModule.mm imports `@import RCTXR` under `#if defined(SWIFT_PACKAGE)` and retains `RCTXR-Swift.h` otherwise, inside TARGET_OS_VISION. Actual SwiftPM cross-target module linkage remains unverified and belongs to T4.

Added an outer `#if canImport(UIKit)` around ImmersiveBridge.swift and an explicit UIKit import. This preserves the requested iOS UIViewController fallback and compiles the entire source out on macOS. Passed:

```sh
xcrun swiftc -typecheck -module-name RCTXR -module-cache-path /private/tmp/t2-apis-xr-macos-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
xcrun clang++ -fsyntax-only packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
```

Repeated visionOS/iOS Swift typechecks, visionOS ObjC++ syntax checks against actual generated specs/header, and final clang-format after these changes; all passed. New macOS check targets the host arm64-apple-macosx26.0 environment. SwiftPM's module import path itself was not compiled.


## SwiftExtensions check details

# T2-apis SwiftExtensions check log

All commands ran from `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos`. No network, git writes, node_modules writes, full app build or simulator launch occurred. The temporary include tree contains symlinks to actual repository headers; it is not a replacement implementation. The minimal module maps below verify used symbols and Swift/ObjC boundaries, but do not verify CocoaPods-generated framework module maps or package linking.

## Temporary header preparation

These commands completed successfully:

```sh
python3 - <<'PY'
from pathlib import Path
p=Path('/private/tmp/t2-apis-swift-check')
headers=p/'headers'/'React'
headers.mkdir(parents=True, exist_ok=True)
root=Path.cwd()/'packages/react-native'
for base in ['React', 'Libraries']:
 for f in sorted((root/base).rglob('*.h')):
  link=headers/f.name
  if not link.exists(): link.symlink_to(f)
app=p/'headers'/'React-RCTAppDelegate'
if not app.exists(): app.symlink_to(root/'Libraries/AppDelegate')
(headers/'module.modulemap').write_text('module React {\n  header "RCTAssert.h"\n  header "RCTUtils.h"\n  header "RCTReloadCommand.h"\n  export *\n}\n')
PY
```

```sh
python3 - <<'PY'
from pathlib import Path
base=Path.cwd()/'packages/react-native'
p=Path('/private/tmp/t2-apis-swift-check/headers/RCTDeprecation')
if not p.exists(): p.symlink_to(base/'ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported')
PY
```

```sh
python3 - <<'PY'
from pathlib import Path
module=Path('/private/tmp/t2-apis-swift-check/headers/RCTSwiftExtensionsObjC')
module.mkdir(exist_ok=True)
header=Path.cwd()/'packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h'
(module/'module.modulemap').write_text(f'module RCTSwiftExtensionsObjC {{\n  header "{header}"\n  export *\n}}\n')
PY
```

## Swift syntax and type checks

Both syntax checks passed (exit 0):

```sh
xcrun --sdk xrsimulator swiftc -parse -target arm64-apple-xros1.0-simulator packages/react-native/Libraries/SwiftExtensions/*.swift
xcrun --sdk iphonesimulator swiftc -parse -target arm64-apple-ios15.1-simulator packages/react-native/Libraries/SwiftExtensions/*.swift
```

The following full visionOS type check was attempted and failed (exit 1) because the Observation macro process could not start inside the sandbox. Diagnostic: `sandbox-exec: sandbox_apply: Operation not permitted`, followed by `ObservationMacros.ObservableMacro could not be found` / `swift-plugin-server produced malformed response`. No attempt was made to bypass the sandbox. This is not a passing full Swift type check.

```sh
xcrun --sdk xrsimulator swiftc -typecheck -swift-version 5 -D DEBUG -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/t2-apis-swift-check/cache -I /private/tmp/t2-apis-swift-check/headers -import-objc-header packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h packages/react-native/Libraries/SwiftExtensions/*.swift
```

The debug ornament/root wrapper type check passed (exit 0), including the real UIKit/SwiftUI SDK APIs and actual Objective-C controller header. It was repeated successfully after the SwiftPM import change:

```sh
xcrun --sdk xrsimulator swiftc -typecheck -swift-version 5 -D DEBUG -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/t2-apis-swift-check/cache -I /private/tmp/t2-apis-swift-check/headers -import-objc-header packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift
```

SwiftPM conditional-import check passed (exit 0); the controller was imported through the separate `RCTSwiftExtensionsObjC` Clang module rather than a bridging-header argument:

```sh
xcrun --sdk xrsimulator swiftc -typecheck -swift-version 5 -D DEBUG -D SWIFT_PACKAGE -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/t2-apis-swift-check/cache-spm -I /private/tmp/t2-apis-swift-check/headers packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift
```

## Objective-C visionOS checks

Passed (exit 0), repeated after the null-preserving property-merge change. Warnings: upstream `RCTUIConfiguratorProtocol` references deprecated `RCTRootView`, and the intentional `RCTAppDelegate` compatibility path is deprecated.

```sh
xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-xros1.0-simulator -I /private/tmp/t2-apis-swift-check/headers -I packages/react-native/ReactCommon/yoga packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
```

After the dimension/focus/disconnection lifecycle changes, this check passed (exit 0), with the same three deprecation warnings:

```sh
xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -DRN_BUILDING=1 -DRN_STRICT_API=1 -target arm64-apple-xros1.0-simulator -I /private/tmp/t2-apis-swift-check/headers -I packages/react-native/ReactCommon/yoga packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
```

Earlier include-scaffolding attempts, before the successful commands above:

```sh
xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-xros1.0-simulator -I /private/tmp/t2-apis-swift-check/headers packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
```

First attempt failed because `RCTDeprecation/RCTDeprecation.h` was not in the temporary include tree. After adding that real-header symlink, the same command failed because it lacked the Yoga include directory. Adding `-I packages/react-native/ReactCommon/yoga` yielded the passing check above. These were temporary check-environment omissions, not source fixes.

## Non-visionOS compile-out checks

All four commands passed (exit 0) and were repeated after the lifecycle/SwiftPM changes. Swift's `#if os(visionOS)` and ObjC's `#if TARGET_OS_VISION` exclude these implementations on iOS and macOS:

```sh
xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 5 -target arm64-apple-ios15.1-simulator -module-cache-path /private/tmp/t2-apis-swift-check/cache-ios packages/react-native/Libraries/SwiftExtensions/*.swift
xcrun --sdk iphonesimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-ios15.1-simulator packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
xcrun --sdk macosx swiftc -typecheck -swift-version 5 -module-cache-path /private/tmp/t2-apis-swift-check/cache-macos packages/react-native/Libraries/SwiftExtensions/*.swift
xcrun --sdk macosx clang -fsyntax-only -fobjc-arc -fblocks packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
```

An earlier equivalent iOS ObjC check also passed with the temporary include directory present:

```sh
xcrun --sdk iphonesimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-ios15.1-simulator -I /private/tmp/t2-apis-swift-check/headers packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
```

## Podspec checks

Passed (exit 0; `Syntax OK`), repeated after adding `mark_as_react_native_build(s)`:

```sh
ruby -c packages/react-native/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec
```

Final actual CocoaPods evaluation passed (exit 0). It verified iOS 15.1 / visionOS 1.0, dependencies `React-Core`, `React-RCTAppDelegate`, `React-RCTXR`, `React-RCTWindowManager`, and `GCC_PREPROCESSOR_DEFINITIONS => $(inherited) RN_BUILDING=1`.

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby - <<'RUBY'
require 'cocoapods'
require_relative './packages/react-native/scripts/react_native_pods'
spec = Pod::Specification.from_file('packages/react-native/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec')
raise 'visionOS minimum missing' unless spec.available_platforms.any? { |platform| platform.name == :visionos && platform.deployment_target.to_s == '1.0' }
raise 'factory dependency missing' unless spec.dependencies.any? { |dependency| dependency.name == 'React-RCTAppDelegate' }
raise 'internal header exemption missing' unless spec.attributes_hash.fetch('pod_target_xcconfig').fetch('GCC_PREPROCESSOR_DEFINITIONS').split.include?('RN_BUILDING=1')
puts({name: spec.name, platforms: spec.available_platforms.map(&:to_s), dependencies: spec.dependencies.map(&:name), xcconfig: spec.attributes_hash['pod_target_xcconfig']}.inspect)
RUBY
```

Earlier successful evaluation (before RN_BUILDING was added) also confirmed metadata/source selection:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby - <<'RUBY'
require 'cocoapods'
require_relative './packages/react-native/scripts/react_native_pods'
spec = Pod::Specification.from_file('packages/react-native/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec')
raise 'visionOS minimum missing' unless spec.available_platforms.any? { |platform| platform.name == :visionos && platform.deployment_target.to_s == '1.0' }
raise 'factory dependency missing' unless spec.dependencies.any? { |dependency| dependency.name == 'React-RCTAppDelegate' }
puts({name: spec.name, platforms: spec.available_platforms.map(&:to_s), source: spec.source, dependencies: spec.dependencies.map(&:name), sources: spec.attributes_hash['source_files']}.inspect)
RUBY
```

Output source was `https://github.com/mindzone/react-native-mindzone-visionos`, tag `v0.88.0`, inherited from concurrently updated package metadata. No remote tag existence was checked.

Initial environment probe failed because the default Ruby gem environment did not contain CocoaPods:

```sh
ruby -e 'require "cocoapods"; puts Pod::VERSION'
```

An initial evaluation diagnostic attempted `spec.source_files`, which is not a `Pod::Specification` method. The spec had already evaluated and both assertions passed, but printing failed with `NoMethodError`; the corrected, successful command above uses `spec.attributes_hash['source_files']`. Exact initial command:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby - <<'RUBY'
require 'cocoapods'
require_relative './packages/react-native/scripts/react_native_pods'
spec = Pod::Specification.from_file('packages/react-native/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec')
raise 'visionOS minimum missing' unless spec.available_platforms.any? { |platform| platform.name == :visionos && platform.deployment_target.to_s == '1.0' }
raise 'factory dependency missing' unless spec.dependencies.any? { |dependency| dependency.name == 'React-RCTAppDelegate' }
puts({name: spec.name, platforms: spec.available_platforms.map(&:to_s), source: spec.source, dependencies: spec.dependencies.map(&:name), sources: spec.source_files}.inspect)
RUBY
```

## Foundation property-merge behavior probe

Compilation and execution passed (exit 0). Output demonstrated that reference KVC merge removed the `nullable` key, while dictionary merge retained `nullable = <null>` and `unchanged = 1`. This directly motivated using `addEntriesFromDictionary:` in the host's property update.

```sh
cat > /private/tmp/t2-apis-swift-check/props.m <<'OBJC'
#import <Foundation/Foundation.h>
int main(void) {
  @autoreleasepool {
    NSMutableDictionary *properties = [@{@"unchanged": @1, @"nullable": @"old"} mutableCopy];
    [properties setValuesForKeysWithDictionary:@{@"nullable": [NSNull null]}];
    NSLog(@"KVC merge: %@", properties);
    [properties addEntriesFromDictionary:@{@"nullable": [NSNull null]}];
    NSLog(@"Dictionary merge: %@", properties);
    return [properties[@"nullable"] isEqual:[NSNull null]] && [properties[@"unchanged"] isEqual:@1] ? 0 : 1;
  }
}
OBJC
xcrun --sdk macosx clang -fobjc-arc -framework Foundation /private/tmp/t2-apis-swift-check/props.m -o /private/tmp/t2-apis-swift-check/props
/private/tmp/t2-apis-swift-check/props
```

## Follow-up implementation notes

- `mark_as_react_native_build(s)` belongs here because this is a first-party RN pod. The current helper explicitly says every first-party pod should define RN_BUILDING; it is target-local and permits internal fine-grained headers under RN_STRICT_API. It is called last as required by the helper documentation.
- T2-native's focus/dimensions request is implemented: `viewDidAppear:` captures the attached window/scene, updates the focus hint and posts the frame notification with the window object; taps update focus and post the same notification; resize notifications run after coordinator completion, with a next-main-queue fallback if not enqueued.
- Closing is detected through a matching `UISceneDidDisconnectNotification`. Window/scene hints are weak; the focused-window property is cleared only if it still references the tracked window. `viewDidDisappear:` deliberately does not clear focus, because immersive content can temporarily hide a window. UIKit lifecycle and scene notifications execute on the main thread; the explicit fallback uses the main queue.
- T2-build's SwiftPM import request is implemented only under SWIFT_PACKAGE inside the existing visionOS region. Its focused type check uses a separate real-header module, but complete Package.swift target generation/linkage remains for T4.
- Full Swift Observation-enabled compilation, real scene attachment/closure, focus-driven Dimensions events and live resizing remain unverified without T4's app build/runtime work.


## Final JS/type validation results

The final scoped lint command passed over all 26 owned changed/new JS/Flow/legacy declaration/type-test files:

```sh
BABEL_DISABLE_CACHE=1 yarn eslint --max-warnings 0 packages/react-native/Libraries/Components/Keyboard/Keyboard.js \
  packages/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js \
  packages/react-native/Libraries/Components/Keyboard/__tests__/Keyboard-test.js \
  packages/react-native/Libraries/Components/ScrollView/ScrollView.js \
  packages/react-native/Libraries/Components/StatusBar/StatusBar.js \
  packages/react-native/Libraries/Components/StatusBar/__tests__/StatusBar-test.js \
  packages/react-native/Libraries/Components/TextInput/InputAccessoryView.js \
  packages/react-native/Libraries/Components/View/ViewPropTypes.js \
  packages/react-native/Libraries/NativeComponent/BaseViewConfig.ios.js \
  packages/react-native/Libraries/NativeComponent/__tests__/BaseViewConfig-test.js \
  packages/react-native/Libraries/WindowManager/NativeWindowManager.js \
  packages/react-native/Libraries/WindowManager/WindowManager.js \
  packages/react-native/Libraries/WindowManager/__tests__/WindowManager-test.js \
  packages/react-native/Libraries/XR/NativeXRModule.js \
  packages/react-native/Libraries/XR/XR.js \
  packages/react-native/Libraries/XR/__tests__/XR-test.js \
  packages/react-native/__typetests__/visionos.ts \
  packages/react-native/index.js \
  packages/react-native/index.js.flow \
  packages/react-native/types_DEPRECATED/Libraries/Components/View/ViewPropTypes.d.ts \
  packages/react-native/types_DEPRECATED/Libraries/Utilities/Platform.d.ts \
  packages/react-native/types_DEPRECATED/Libraries/WindowManager/WindowManager.d.ts \
  packages/react-native/types_DEPRECATED/Libraries/XR/XR.d.ts \
  packages/react-native/types_DEPRECATED/index.d.ts \
  packages/react-native/visionos_modules/NativeWindowManager.js \
  packages/react-native/visionos_modules/NativeXRModule.js
```

`BABEL_DISABLE_CACHE=1 node_modules/.bin/prettier --check` with the same 26 paths passed. Scoped `git diff --check` passed, and a separate trailing-whitespace scan of all new XR/WindowManager/SwiftExtensions/spec files returned zero issues.

Final strict checks:

```sh
BABEL_DISABLE_CACHE=1 yarn tsc -p /tmp/T2-apis-typescript-strict-generated.json
BABEL_DISABLE_CACHE=1 yarn tsc -p /tmp/T2-apis-typescript-strict-legacy.json
```

Both passed. These configs extend the normal/legacy config, select only `__typetests__/visionos.ts`, and enable strict checking. The generated variant maps the generated sibling list types and uses skipLibCheck for the three pre-existing declaration errors identified above; the legacy variant does not skip declaration checks. The tests exercise named public types, omitted/null/arbitrary props, primitive required IDs, hover values/null, and the absence of a runtime Window constructor.

The complete normal suite with only the sibling generated-type path mapping passed after the final regeneration. The complete legacy suite passed. Re-running unmodified `yarn test-generated-typescript` still fails exclusively on absent sibling generated list declarations; no new visionOS assertion fails. Final Flow has exactly the one T2-build Set inference error recorded above. Full-suite and strict logs are `/private/tmp/T2-apis-typescript-{staged,legacy,strict-generated,strict-legacy,final}.log`; lint log is `/private/tmp/T2-apis-eslint-final.log`; final Flow log is `/private/tmp/T2-apis-flow-final.log`.

The Swift work used the local write-swift skill; verification limitations come from the actual sandbox/toolchain results, not an approval requirement. No approval or policy bypass was requested.
