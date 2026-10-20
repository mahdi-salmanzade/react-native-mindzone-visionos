# visionOS port inventory — React Native 0.88.0

## Summary

This is the union of Callstack 0.79.6 (CS) and ReactVision 0.86.4 against upstream 0.86.2 (RV), mapped to this repository's upstream 0.88.0 source. `RN` means `packages/react-native`; `RT` means `packages/rn-tester`; `CS-template` and `RV-template` mean the published template package roots listed in `PLAN.md`. `both` means CS and RV. `0.88 check` identifies additional work found in the target rather than a reference hunk.

The reference coverage ledger below accounts for **144 distinct paths: 110 CS text-file records / 206 hunks, 131 RV text-file records / 233 hunks, and two binary assets in each fork**. Expanding every fork-only directory from the `*-files.txt` lists yields 44 CS and 48 RV files; all occur in that ledger. A row may collect multiple closely related hunks; its notes describe all their dispositions. Classification counts count work items, not hunks or files. The supplied diffs exclude `.git`, `node_modules`, lockfiles and `CHANGELOG*.md`; this inventory does not claim those excluded files were audited.

| Owner | apply | adapt | already-upstream | obsolete | skip | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T2-build | 7 | 19 | 4 | 1 | 5 | 36 |
| T2-native | 13 | 11 | 1 | 5 | 4 | 34 |
| T2-apis | 12 | 10 | 1 | 2 | 2 | 27 |
| T3-apps | 3 | 16 | 1 | 1 | 3 | 24 |
| **Total** | **35** | **56** | **7** | **9** | **14** | **121** |

There are **91 implementation/adaptation items**, seven preserved upstream capabilities and 23 obsolete/skipped items. Every work item has exactly one owner, defined by its table; cross-owner integration is described as a dependency, not shared edit ownership.

Highest risks:

- 0.88 defaults to prebuilt React core. `React.xcframework` lacks xros, unlike the supplied Hermes and ReactNativeDependencies artifacts. Disable only prebuilt core for visionOS before pod/facade selection; do not globally disable working dependency artifacts or alter iOS defaults.
- Source compatibility is insufficient by itself: UIKit window/screen access, SwiftUI root-view lifecycle, codegen output paths, module lookup and multiple-window behavior must agree across T2 owners.
- Several reference patches change all Apple platforms. Restrict those changes to `TARGET_OS_VISION` / `os(visionOS)` and preserve existing non-visionOS paths.
- 0.88's generated public types, SwiftPM setup and dependency facades differ materially from 0.86. Copying the old patch or checking only unchanged paths misses them.
- RV's bare template is not evidence of a working 0.88 app: its README says bare apps were unverified, its Metro resolver was removed, and its Xcode project retains stale iOS settings. T3 must produce a coherent bare template and T4 must build it.

Open questions and ownership limits:

- **Uncertain:** the minimum visionOS deployment version that every 0.88 dependency accepts. References use 1.0 in core helpers; RV's template uses 26.0 specifically for ViroReact. Do not impose Viro's minimum on this generic fork. Resolve with podspec evaluation and device/simulator builds; align helper, pod, SwiftPM and Xcode minima.
- Apple CLI command wiring was verified against locally installed `cli-platform-apple@20.2.0`, matching RNTester’s CLI version. Actual `run-visionos` launch and packed-template resolution remain unverified; no network was used in T1.
- **Uncertain:** full SwiftPM integration. Source SwiftPM builds React core from source and needs visionOS platform/source-graph adaptation; it does not require a prebuilt React xros slice. The newer binary consumer flow additionally needs a custom xros React artifact or an explicit unsupported-path diagnostic. Adding `.visionOS(...)` alone is insufficient; no SwiftPM or CocoaPods build was run in T1.
- PLAN omits some target paths that now matter (notably `RN/Package.swift`, `RN/README.md`, `RN/types_DEPRECATED/**`, `RN/types_generated/**` and root `jest.config.js`). Items below assign one accountable owner, but **do not extend edit permissions**: that owner must send the exact change through its `visionos-port/requests/<task>.md` for the orchestrator. Generated outputs must be regenerated, never hand-edited.

## T2-build

| ID | Area | Source | Reference file(s) | 0.88 target | Class | Port notes |
| --- | --- | --- | --- | --- | --- | --- |
| B-01 | Package identity | both | `RN/package.json` | same name/version/metadata | adapt | Name react-native-mindzone-visionos, version 0.88.0, actual fork description/repository/bugs/homepage without inventing URLs. Retain current dependencies, engines, exports and Hermes compiler version. RV adds public publishConfig/reactNativeUpstreamVersion; its 0.86.3 value differs from supplied 0.86.2 comparison base. Use actual artifact base 0.88.0 for this fork. |
| B-02 | npm files | both | `RN/package.json`; published RV package | files field | apply | Add visionos_modules and local-cli/localCommands.js. Existing Libraries/React/ReactApple/ReactCommon and codegen/CocoaPods/SDK entries cover new APIs/pods/generated React/FBReactNativeSpec_visionOS. Preserve types_DEPRECATED/types_generated. Inspect packed archive for Swift sources, spec headers/implementation, commands and both type surfaces. |
| B-03 | CLI executable | both (cross-cutting) | `RN/{package.json,cli.js}` | existing bin/findCommunityCli/main | already-upstream | bin react-native→cli.js already delegates to Community CLI with current package name; keep executable name, including npm alias installs. No replacement bin required. Template supplies Community CLI/Apple package; deprecated react-native/cli import stays deprecated. |
| B-04 | visionOS CLI platform | both | `RN/react-native.config.js`; `RN/local-cli/localCommands.js` | current routing config/new commands file | adapt | Prefer RV createCommands(apple), optional resolution and null guard, fixing CS undefined verbose/unguarded apple. Resolve Apple independently of iOS. Register visionos npmPackageName, getProjectConfig/getDependencyConfig({platformName:'visionos'}), createRun/getRunOptions, createBuild/getBuildOptions, createLog/getLogOptions. Preserve 0.88 imported codegenCommand/spmCommand. Installed Apple20.2.0 supports visionos→xrsimulator/xros. RV's added codegen --platform visionos help text has no backend: executor accepts android/ios/all. Keep Apple codegen ios or explicitly implement alias through request for unowned packages/community-cli-plugin/src/commands/codegen.js; do not advertise unsupported input. |
| B-05 | CocoaPods platforms | both | `RN/scripts/cocoapods/helpers.rb`; `RN/scripts/react_native_pods.rb` | Helpers::Constants/top-level min_visionos_version_supported; min_supported_versions | apply | Add reference floor '1.0' and visionos entry alongside unchanged iOS minimum, subject to dependency-build verification. 83/87 current podspecs inherit map: no redundant edits. Exceptions and source-core restriction are enumerated below. Four new API specs belong to T2-apis. |
| B-06 | Core header/spec boundaries | both | `RN/React-Core.podspec` | header_subspecs/exclude_files | apply | Add RCTXRHeaders→Libraries/XR/*.h and RCTWindowManagerHeaders→Libraries/WindowManager/*.h. Port RV exclusion React/FBReactNativeSpec_visionOS/**/* so Core does not duplicate generated-spec compilation/export. CS lacks separate spec ownership fix. |
| B-07 | Added pods | both | `RN/React.podspec`; `RN/scripts/react_native_pods.rb` | umbrella dependencies/use_react_native! | adapt | Install React-RCTSwiftExtensions, React-RCTXR, React-RCTWindowManager (modular headers) and RV-only React-RCTFBReactNativeSpecVisionOS (modular headers). Use visionOS-scoped umbrella deps/active-target installation so iOS graph/behavior remains unchanged. Coordinate names/header imports with A rows; do not restore removed OldArch/JSC setup. |
| B-08 | fmt modular headers | CS | `RN/scripts/react_native_pods.rb` | source-dependency branch | already-upstream | fmt already has modular_headers:true in 0.88; RV no longer needs hunk. Prebuilt-dependency branch uses facades (B-13). |
| B-09 | RN pod list | both | `RN/scripts/cocoapods/utils.rb` | ReactNativePodsUtils.react_native_pods | apply | Add React-RCTXR to current name list. Review consumers to determine whether separated spec/Swift/window pods also need membership; list membership does not install pods. Preserve other names/behavior. |
| B-10 | Autolinking root | RV | `RN/scripts/cocoapods/autolinking.rb` | list_native_modules! / autolinking.json output | adapt | Use Pod::Config.instance.installation_root for installed visionOS Podfile, fallback config.project.ios.sourceDir if absent. Generated manifest/relative pod paths must resolve under visionos/, not sibling ios/. Preserve current iOS result and verify alias/coinstalled layouts. |
| B-11 | Artifact base version | RV | `RN/package.json`; `RN/scripts/cocoapods/new_architecture.rb`; `RN/scripts/react_native_pods.rb` | extract_react_native_version/setup dependencies/setup_rncore and replacement phases | adapt | Add extract_react_native_upstream_version reading reactNativeUpstreamVersion with package-version fallback; both 0.88.0 here. Use base version consistently for downloads and replace_dependencies_version.js / supported-platform replace-rncore-version.js: current podspec phases pass package version, a future fork-patch mismatch if only RV setup hunk copied. Hermes version.properties:HERMES_VERSION_NAME remains independent. |
| B-12 | Source core/prebuilt dependencies | 0.88 check; RV policy | `RN/scripts/react_native_pods.rb`; RV build policy | same; cocoapods/rncore.rb/setup callers | adapt | Both RCT_USE_RN_DEP and RCT_USE_PREBUILT_RNCORE default1. For visionOS force core source before setup_rncore/podspec_sources/RNCoreFacades.generate, while retaining RNDeps/Hermes binaries with supplied xros slices. Supersedes RV claim all binaries lack xros. **Uncertain mixed-target design:** ReactNativeCoreUtils caches process-global state on first setup; changing ENV in later target is insufficient. Make core mode target-aware, or establish an explicit mixed-target source-core configuration after review; test mixed pod install/build and preserve normal iOS defaults. |
| B-13 | New dependency facades | 0.88 check | no reference hunk | `RN/scripts/cocoapods/{rndeps_facades.rb,rncore_facades.rb}`; react_native_pods.rb | adapt | RNDepsFacades.generate receives only min_ios_version_supported; base_spec emits platforms ios only. Extend source to use shared map for RCT-Folly/glog/boost/DoubleConversion/fmt/fast_float/SocketRocket facades while retaining prebuilt RNDeps on visionOS. Regenerate emitted podspec.json, never edit them. RNCoreFacades also hardcodes iOS but must not run on visionOS without an xros core artifact. |
| B-14 | Hermes xros backend | both (cross-cutting) | `RN/sdks/hermes-engine/**` | podspec/utils/build-hermes-xcode.sh | already-upstream | 0.88 explicitly has visionos1.0, xros framework, universal hermesvm.xcframework and xros/xrsimulator mapping/XROS_DEPLOYMENT_TARGET in source builder. Preserve; no normal visionOS source-Hermes forcing. Framework is hermesvm, not old hermes. |
| B-15 | Source Hermes outputs | both | `RN/sdks/hermes-engine/hermes-engine.podspec` | [RN] [2] Build Hermes script phase | adapt | Recognize xrsimulator output using current hermesvm.framework/hermesvm and ImportHostCompilers.cmake. Derive output for selected xros/xrsimulator source build, preserving iOS outputs; don't add an always-missing xrsimulator output to every iOS incremental build as reference patch does. |
| B-16 | CMake source-Hermes gate | both | `RN/sdks/hermes-engine/utils/build-hermesc-xcode.sh` | same | adapt | Require CMake≥3.28.0 only for xros/xrsimulator source builds, before SDKROOT changes to macOS for host hermesc. Keep existing iOS acceptance and host isolation. Use quoted binary/robust version comparison rather than blindly copying unquoted reference invocation/sort -V. |
| B-17 | Bundle resolver argument | both | `RN/scripts/react-native-xcode.sh` | current bundle command | adapt | Add --resolver-option platformExtension=visionos only when PLATFORM_NAME is xros/xrsimulator. Both refs add it globally; preserve iOS args and 0.88 SwiftPM Hermes compiler lookup. Bundle platform remains ios; extension selects .visionos sources through OOT resolver. |
| B-18 | Codegen declaration/Android isolation | both + 0.88 check | `RN/package.json` | codegenConfig.libraries; `RN/scripts/codegen/generate-artifacts-executor/index.js` library filter | adapt | Add FBReactNativeSpec_visionOS, type modules, jsSrcsDir visionos_modules, Apple config, retaining current main-spec module options. An ios config without android config does **not** gate generic codegen: plain Native*.js generates Java for android/all. Before generateSchemaInfos, retain existing disabled-library filter and additionally require `platform !== 'android'` or `config.name !== 'FBReactNativeSpec_visionOS'`. Leave other libraries unchanged. Normal ReactAndroid Gradle already scans ../src and ignores deprecated libraries array, so does not include the new directory. Validate both generic android/all generation and unchanged Gradle root. Coordinate A-21. |
| B-19 | Codegen output/prepack | RV | `RN/scripts/codegen/generate-artifacts-executor/{constants,generateFBReactNativeSpecIOS,generateNativeCode}.js` | same; scripts/prepack.js caller | apply | Add CORE_LIBRARIES_WITH_OUTPUT_FOLDER.FBReactNativeSpec_visionOS.ios→React/FBReactNativeSpec_visionOS. Generate optional second core library in generateFBReactNativeSpecIOS using ios; extend shouldSkipGenerationForFBReactNativeSpec to both names/indexed output path, logging actual name. Consumer discovery may omit RN itself, so prepack must ship generated header/JSI header/.mm, as RV does. Regenerate, never copy generated reference output. |
| B-20 | Duplicate-schema avoidance | RV | `RN/scripts/codegen/generate-artifacts-executor/utils.js` | findExternalLibraries/readPackageNameOf | adapt | Read resolved react-native/package.json declared identity: when upstream+fork coexist skip duplicated upstream core schemas; when fork aliased as react-native retain it. Preserve unrelated dependencies/conflict validation. Adapt placement to 0.88 autolinking-first discovery/main+visionOS libraries; do not bypass all external discovery. |
| B-21 | Source SwiftPM | RV | `RN/Package.swift` | platforms/reactCoreModules/target graph | adapt | Add visionOS v1 with unchanged iOS/Catalyst. RV only adds platform; current graph excludes PlatformStubs/RCTStatusBarManager.mm unconditionally, unlike correct CocoaPods selection. Make source/stub selection visionOS-safe and wire spec/XR/window/SwiftExtensions targets for full source-package APIs, preserving Swift/ObjC target boundaries. Source graph uses xros-capable Hermes/RNDeps binary deps, not binary React core. PLAN does not own RN/Package.swift: send exact request to orchestrator. |
| B-22 | New consumer SwiftPM flow | 0.88 check | no reference hunk | `RN/scripts/setup-apple-spm.js`; `RN/scripts/spm/**`; `RN/scripts/codegen/templates/Package.swift{,.spm}-template` | adapt | Both codegen templates only list iOS/Catalyst; generate-spm-autolinking/scaffold-package-swift hardcode iOS and linked-framework conditions; generate-spm-autolinking-config requires project.ios.sourceDir. Make visionOS selection explicit, preserve iOS output. Consumer generateXCFrameworksPackageSwift/downloads require React.xcframework lacking xros. **Uncertain:** implement source-compatible delivery/custom xros core or explicit unsupported binary-flow diagnostic; select/test path before claiming SwiftPM parity. flavored-frameworks.js already handles xros/xrsimulator. |
| B-23 | xros core prebuild targets | RV | `RN/scripts/ios-prebuild/{cli,types}.js` | platforms/platformToDestination/Platform/Destination | adapt | Add visionos→visionOS and visionos-simulator→visionOS Simulator with matching Flow types. Preserve existing default iOS/Catalyst build set; only build visionOS when selected. Validate 0.88 headers/resources with produced xros slices before custom binary use. |
| B-24 | Generated artifact ignores | RV | `.gitignore` | same | apply | Ignore packages/react-native/*.tgz and packages/react-native/React/FBReactNativeSpec_visionOS/, matching existing generated-spec policy; explicit npm files/prepack must still pack generated output. |
| B-25 | Legacy local-cache ignores | CS | `.gitignore` | same | skip | .circleci/storage and .yarn are local legacy CI/package-manager policy; RV dropped them. No visionOS capability. |
| B-26 | Workspace RN alias | RV | root `package.json` | devDependencies | apply | Add react-native:link:./packages/react-native so internal imports survive declared package rename. Retain 0.88 tooling versions. Lockfile regeneration requires correct ownership; PLAN has none. |
| B-27 | Old Jest mapping | CS | root `jest.config.js` | current root config/T3 preset resolver | obsolete | Broad mappers point to removed RN/jest/ReactNativeInternalFeatureFlagsMock.js. RV uses root link/preset resolver instead. Preserve current specific subpath mappings; don't restore obsolete mock layout. Root config is unowned: request any actual followup. |
| B-28 | visionOS CI | both | `.github/actions/test-visionos-rntester/action.yml`; CS test-all.yml; RV test-visionos.yml | composite action/separate workflow | adapt | Prefer RV separate workflow with read-only contents, cancellation, Debug/Release matrix, SDK install, generic visionOS Simulator destination, derived data/artifacts. Build RNTester-visionOS with current Hermes/New Architecture/source core. Remove CS OldArch/JSC, continue-on-error, stale Xcode15.4 pin and mismatched inputs. Preserve existing test-all behavior and prebuilt Hermes/RNDeps. Verify runner/Xcode availability in CI; no hosted execution claimed. |
| B-29 | Historical CI drift | CS | `.github/actions/test-ios-{helloworld,rntester}/action.yml`; `.github/workflows/test-all.yml` | same | skip | Skip ruby/setup-ruby 1.170→1.171, bulk facebook repository gating, removed manual E2E input, removed Hermes/JSC matrix entry and job suppressions. RV separated fork testing; keep upstream0.88 CI. |
| B-30 | Fork release preparation | both | `scripts/{oot-release.js,new-github-release-url.js,monorepo/for-each-package.js}` | new scripts; current releases/utils/npm-utils.js | adapt | Port version planning/enumeration/URL helper for explicit allowlist react-native-mindzone-visionos and react-native-mindzone-visionos-template; RV still selects @callstack/*. Keep upstream tooling at base version and fork/template stable/nightly versions coherent. Use RV corrected npm-utils path. Reject empty selection/any failed package; results.every(Boolean) currently lets partial failures report success. Use confirmed release destination. Implement reviewable preparation/dry-run with no git writes; do not execute tagging/publishing in port tasks. |
| B-31 | Upstream release recovery changes | RV | `.github/workflows/{bump-podfile-lock,create-draft-release,generate-changelog,publish-npm}.yml` | same | skip | releaseVersion/checkoutRef/releaseId recovery, draft reuse/post-release conditions and macos15 pin serve upstream bots/community-template/rn-diff-purge/Maven publication, not this two-package fork. Retain current workflows; avoid foreign publish targets. |
| B-32 | DotSlash owner migration | RV | `scripts/releases/upload-release-assets-for-dotslash.js` and snapshot | same constants/list/delete/upload | already-upstream | GITHUB_OWNER=react/GITHUB_REPO=react-native already implemented in0.88, solving historical POST redirects. Keep current fixture behavior; don't substitute fork into unrelated upstream artifacts. |
| B-33 | Local registry config | both | `scripts/e2e/verdaccio.yml` | same | adapt | Keep needed upstream @react-native/* proxying for isolated fork/template tests. Skip obsolete unauthenticated @callstack/* rule; current ** already covers new unscoped names with access/publish all and npmjs proxy. Add exact package isolation only as needed. No registry/publish executed. |
| B-34 | Functional documentation | both | root `README.md`; RV `RN/README.md` | root README; prepack-copied package README | adapt | Document names/init/run command/base0.88, source-core and binary-dependency policy, OS=ios/isVision, APIs, RNTester, requirements and reviewable release prep. prepack copies root README to package: keep root authoritative. RN/README.md is unowned; request any needed explicit change. |
| B-35 | Reference branding/promises | both | READMEs/package metadata | fork docs | skip | Omit CS/RV logos/screenshots/Discord/Viro promotion, Expo plugin promises, stale quick-init/version claims. Retain license/factual attribution; B-34 supplies verified instructions. |
| B-36 | Version-only drift | RV | `RN/ReactAndroid/gradle.properties`; `RN/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.kt`; `RN/scripts/codegen/__tests__/__snapshots__/generate-artifacts-executor-test.js.snap` | same | skip | Android literal0.86.2→0.86.3 and snapshot0.86.2→0.86.4 are not port functionality. Keep0.88.0; regenerate snapshots only for actual generator changes. Android paths have no owner: T2-build records skip, no edit permission implied. |

## T2-native

Paths in this table are relative to `RN/`.

| ID | Area | Source | Reference file(s) | 0.88 target | Class | Port notes |
| --- | --- | --- | --- | --- | --- | --- |
| N-01 | Focused window property | both | `Libraries/AppDelegate/RCTAppDelegate.h` | same | adapt | Add weak nullable UIWindow *lastFocusedWindow under TARGET_OS_VISION; Swift wrapper updates it and RCTKeyWindow consults it. CS also made bridge strong; RV retained upstream deprecated declaration. 0.88 removed bridge property: do not restore it. Preserve delegate deprecation/current factory APIs. |
| N-02 | SwiftUI owns window creation | both | `Libraries/AppDelegate/RCTAppDelegate.mm` | same | apply | In application:didFinishLaunchingWithOptions:, keep factory creation but guard automatic loadReactNativeWindow: call and its implementation with !TARGET_OS_VISION, excluding UIScreen.mainScreen.bounds and duplicate UIKit window creation. |
| N-03 | Transparent Fabric root | both | `Libraries/AppDelegate/RCTRootViewFactory.mm` | viewWithModuleName:initialProperties:launchOptions:bundleConfiguration:devMenuConfiguration: | adapt | Add visionOS clear root background; keep current TV clear background, systemBackgroundColor elsewhere and customizeRootView callback. References also alter legacy createRootViewWithBridge:moduleName:initProps:, removed in 0.88: omit that second hunk. RV preserves TV differences, unlike blind CS copying. |
| N-04 | SwiftUI links | both | `Libraries/LinkingIOS/RCTLinkingManager.{h,mm}` | same; current +postNotificationWithURL: | adapt | Add visionOS +onOpenURL: with NS_SWIFT_NAME(onOpenURL(url:)), static initial URL: first call stores initial URL, subsequent calls post existing URL notification. Upstream replaced free postNotificationWithURL(URL,sender) helper with class method; use current one. getInitialURL resolves stored URL on visionOS, retaining launch-options path elsewhere. Preserve new scene:openURLContexts:, scene:continueUserActivity:, handleUserActivity:window: and lifecycle checks. Verify cold-start ordering/reload/listener timing: references never clear initial URL. |
| N-05 | Initial push-notification completion | both | `Libraries/PushNotificationIOS/RCTPushNotificationManager.mm` | getInitialNotification:reject: | adapt | References compile out entire body on visionOS, leaving promise pending. If preserving suppression, resolve null explicitly on visionOS; preserve upstream UserNotifications processing elsewhere. Current code uses kInitialNotification/UNNotification, not old launch-options keys. Historical reason for suppressing this is **uncertain**; notification-launch testing would settle full support. |
| N-06 | Legacy selectable text | both | `Libraries/Text/Text/RCTTextView.mm` | removed; N-20 Fabric equivalent | obsolete | References suppress handleLongPress: UIMenuController fallback. View/header/manager/shadow view were deleted with legacy architecture; do not recreate. |
| N-07 | Legacy text-input accessory | both | `Libraries/Text/TextInput/RCTBaseTextInputView.mm` | removed; N-18/N-21/N-22 | obsolete | setCustomInputAccessoryViewWithNativeID:/setDefaultInputAccessoryView guards belonged to deleted legacy base view/manager/shadow view, not a renamed implementation. Port live Fabric paths. |
| N-08 | Metro platform extension | both | `React/Base/{RCTConstants.h,RCTConstants.m,RCTBundleURLProvider.mm}` | same | apply | Under TARGET_OS_VISION declare/define `RCTPlatformExtension = @"visionos"` and add resolver.platformExtension bundle URL query. Keep `RCTPlatformName = @"ios"` and existing platform query. Coordinate resolver support with T2-build. |
| N-09 | Key-command whitespace | both | `React/Base/RCTKeyCommands.m` | same | skip | Only blank-line whitespace changes; no behavior or capability. |
| N-10 | Spatial size/orientation | both | CS `React/Base/RCTUtils.m`; RV `React/Base/RCTUtils.mm` | `React/Base/RCTUtils.mm`, RCTScreenSize/RCTDeviceOrientation | adapt | .m became ObjC++; functions survive. VisionOS orientation returns UIDeviceOrientationPortrait without unavailable UIDevice.orientation. Port RV RCTVisionWindowSize: atomic last nonzero key-window bounds, main-queue refresh, synchronous first off-main lookup, zero until a window exists. CS dispatch_once dimensions are stale after resize; RV fixes them. Preserve 0.88's new nonvision RCTKeyWindow().screen/UIScreen.screens fallback/cache under !TARGET_OS_VISION. UIWindow.screen is unavailable on visionOS. Existing RCTViewportSize prefers bounds and then this fallback. |
| N-11 | Active scene/window selection | both | CS `React/Base/RCTUtils.m`; RV `React/Base/RCTUtils.mm` | RCTKeyWindow in .mm | adapt | Under TARGET_OS_VISION consult optional delegate.lastFocusedWindow, skip UISceneSessionRoleImmersiveSpaceApplication, and replace ornament key window with nonornament window in that scene. Both refs detect 'Ornament' in debugDescription: brittle heuristic, retain only with documented device/simulator validation. Preserve upstream scene type checks, nil checks, isKeyWindow iteration and legacy fallback elsewhere. CS removed checks globally; RV restores nonvision branch, but both leave focused override global: guard it. |
| N-12 | Removed window-cache proxy | CS | `React/Base/UIKitProxies/RCTKeyWindowValuesProxy.mm` | no class/symbol; N-10/N-16 live lookup | obsolete | CS avoided main-screen fallback and DeviceInfo consumed this proxy. RV drops it because proxy had already disappeared by 0.86.2. Do not recreate cache. |
| N-13 | Transparent alerts/fallback | both | `React/CoreModules/RCTAlertController.mm` | initializer | apply | Add visionOS-only root controller overriding preferredContainerBackgroundStyle to UIContainerBackgroundStyleHidden. Retain scene-based window construction/level. In no-scene fallback use CGRectZero on visionOS instead of UIScreen.mainScreen.bounds: RV adds this because newer upstream initializer introduced the fallback; CS had no such branch. |
| N-14 | Appearance fallback | both | `React/CoreModules/RCTAppearance.mm` | RCTColorSchemePreference | adapt | Unknown/unspecified user-interface style returns dark only under TARGET_OS_VISION; retain override/explicit light-dark/disabled behavior and upstream light fallback everywhere else. Both references changed fallback globally; do not reproduce off-platform change. |
| N-15 | Dev-menu action timing | both | `React/CoreModules/RCTDevMenu.mm` | alertActionHandlerForDevItem: | apply | Queue item.callHandler on main queue with zero delay on visionOS so sheet dismissal precedes next action/window selection. Keep synchronous other-platform call and _actionSheet=nil cleanup. |
| N-16 | Device dimensions | both | `React/CoreModules/RCTDeviceInfo.mm` | RCTExportedDimensions | adapt | On visionOS screen/window dimensions both reflect current key-window bounds (zero without window); scale from trait collection; preserve fontScale. CS used removed proxy and removed main-thread assertion; RV uses direct key-window and assertion. Preserve assertion, 0.88 injected dimensions provider, cached constants/KVO/invalidation/frame notification. Guard new mainWindow.screen access as well as historical mainScreen. Existing orientation/fullscreen paths are already TARGET_OS_IOS && !TARGET_OS_MACCATALYST. |
| N-17 | Keyboard payload | both | `React/CoreModules/RCTKeyboardObserver.mm` | RCTParseKeyboardNotification | adapt | Return Objective-C empty dictionary @{} for visionOS, compile coordinate/frame extraction under !TARGET_OS_VISION inside existing TV handling. Excludes both window.screen.coordinateSpace accesses. Reference TARGET_OS_IOS/return {} should become visionOS-specific guard and explicit dictionary to preserve others/avoid null C++ initializer. Keep event names/module. |
| N-18 | Fabric accessory component | both | `React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` | didMoveToWindow / inputAccessoryView override | apply | Guard assignment _textInput.inputAccessoryView=_contentView and inputAccessoryView override with !TARGET_OS_VISION. Preserve lookup/IDs/content/lifecycle. Property unavailable on visionOS. |
| N-19 | Fabric scroll dismissal | both | `React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm` | converter/updateProps | apply | Guard RCTUIKeyboardDismissModeFromProps and scrollView.keyboardDismissMode assignment with !TARGET_OS_VISION. Live _keyboardWillChangeFrame: accessory branch already TARGET_OS_IOS; do not duplicate legacy scroll guard. Preserve other props/recycling/insets. |
| N-20 | Fabric text edit menu | both | `React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.mm` | handleLongPress: | apply | Keep UIEditMenuInteraction, guard only UIMenuController fallback with !TARGET_OS_VISION. Preserve 0.88 text drawing/accessibility. |
| N-21 | Fabric text-input setup/recycle | both | `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm` | setDefaultInputAccessoryView / prepareForRecycle | apply | Guard default accessory body and _backedTextInputView.inputAccessoryView=nil with !TARGET_OS_VISION. Reset guard is RV-only because recycling gained this assignment after CS. Retain IDs and all other reset behavior. |
| N-22 | Fabric text-input copy | both | `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputUtils.mm` | RCTCopyBackedTextInput | apply | Guard copying inputAccessoryView from/to backed input with !TARGET_OS_VISION, preserving all other copied fields and 0.88 additions. |
| N-23 | Pointer/hover coordinates | both | `React/Fabric/RCTSurfacePointerHandler.mm` | CreatePointerEventFromActivePointer cancel case; UpdateActivePointerWithUITouch; hovering:pointerId:pointerType: | apply | Use window.coordinateSpace under TARGET_OS_VISION and existing window.screen.coordinateSpace elsewhere. Spatial 'screen' coordinates are relative to window. Ignore blank-line deletions. |
| N-24 | Touch coordinates | both | `React/Fabric/RCTSurfaceTouchHandler.mm` | UpdateActiveTouchWithUITouch | apply | Use rootComponentView.window.coordinateSpace on visionOS; preserve screen coordinate space elsewhere, offset/page coordinates and root-origin adjustment. |
| N-25 | Shadow scale | RV | `React/Fabric/Utils/RCTBoxShadow.mm` | initBoxShadowLayer / RCTGetOutsetBoxShadowLayer | apply | Use UITraitCollection.currentTraitCollection.displayScale under TARGET_OS_VISION for shadow layer and mask contentsScale; retain both mainScreen.scale uses elsewhere. CS predates this requirement. |
| N-26 | UIManager whitespace | CS | `React/Modules/RCTUIManager.mm` | same reduced compatibility file | skip | Only a blank line removed before orientation dispatch. RV drops it; no behavior to port. |
| N-27 | Removed legacy modal | both | `React/Views/RCTModalHostViewController.m` | .m removed; .h UIKit-import stub; N-33 live Fabric | obsolete | CS guards cached status bar. RV additionally sets modalInPresentation=YES (already in CS upstream base). Do not revive controller/status ivars; handle surviving behavior in Fabric. |
| N-28 | Conditional property macros | both | `React/Views/RCTViewManager.h` | same | apply | Add RCT_EXPORT_NOT_VISIONOS_VIEW_PROPERTY, RCT_EXPORT_VISIONOS_VIEW_PROPERTY, RCT_REMAP_NOT_VISIONOS_VIEW_PROPERTY, RCT_REMAP_VISIONOS_VIEW_PROPERTY. With TARGET_OS_VISION vision macros delegate to existing export/remap, NOT macros empty; inverse elsewhere. Legacy ScrollView consumer is gone but public compatibility macros/header remain relevant; leave existing macros unchanged. |
| N-29 | Removed legacy scroll | both | `React/Views/ScrollView/{RCTScrollView.m,RCTScrollViewManager.h,RCTScrollViewManager.m}` | implementations/manager absent; RCTScrollView.h UIKit-import stub | obsolete | Guard hunks cover keyboard accessory access, setKeyboardDismissMode, converter declaration/definition and conditional property export. No live symbols to patch; N-19 covers Fabric. RV retained old code under legacy guards in 0.86; 0.88 deletes it. Ignore CS extra blank line. |
| N-30 | Reference release stamps | RV | `React/Base/RCTVersion.m`; `ReactCommon/cxxreact/ReactNativeVersion.h` | same | skip | RV changes values to inconsistent 0.86.3/0.86.4 stamps. Keep target 0.88.0, do not import release drift. |
| N-31 | Sample module dimensions | both | `ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm` | initialize | adapt | On visionOS use actual app window bounds (corrected RCTKeyWindow), retain typed const2=screenSize.width. RV creates a window from arbitrary connectedScenes.anyObject, unsafe for immersive/nonwindow scenes; adapt selection. CS patched old getConstants and accidentally used @(screenSize); do not copy incorrect value. Preserve nonvision path. |
| N-32 | Old Hermes hook suppression | CS | `ReactCommon/react/runtime/ReactInstance.cpp` | initializeRuntime; HermesInstance.cpp override | skip | CS disables unstable_initializeOnJsThread() on visionOS with TODO. RV calls normally; current hook registers profiling. Retain current initialization. Exact drop reason **uncertain**, likely newer Hermes support; verify visionOS startup/profiling instead of restoring undocumented bypass. |
| N-33 | Live modal behavior | both (legacy intent) | `React/Views/RCTModalHostViewController.m` | `React/Fabric/Mounting/ComponentViews/Modal/{RCTFabricModalHostViewController.mm,RCTModalHostViewComponentView.mm}` | adapt | Add !TARGET_OS_VISION only to preferredStatusBarStyle/prefersStatusBarHidden overrides beside current !TARGET_OS_TV, without disabling neighboring touch code. This is no-status-bar behavior parity, not a claim these selectors fail compilation in XROS27. modalInPresentation=YES is already upstream with !allowSwipeDismissal and controller synchronization: preserve current prop behavior, do not force it. |
| N-34 | Existing safe primitives | both (cross-cutting) | no additional hunk | `React/Base/RCTUtils.mm`; `React/Views/RCTView.m`; Fabric View/ScrollView and DeviceInfo | already-upstream | RCTScreenScale already uses trait scale; hover paths use view bounds off iOS with explicit visionOS comments. Fabric keyboard-inset/accessory and DeviceInfo orientation/fullscreen blocks already use TARGET_OS_IOS. Preserve rather than redundantly wrap. |

## T2-apis

Paths in this table use the `RN` prefix defined above.

| ID | Area | Source | Reference file(s) | 0.88 target | Class | Port notes |
| --- | --- | --- | --- | --- | --- | --- |
| A-01 | Platform detection | both (inherited upstream) | No changed hunk; references depend on `Platform.isVision` | `RN/Libraries/Utilities/{Platform.ios.js,Platform.android.js,PlatformTypes.js}`; `RN/src/private/specs_DEPRECATED/modules/NativePlatformConstantsIOS.js`; `RN/ReactNativeApi.d.ts` | already-upstream | iOS getter compares `constants.interfaceIdiom === 'vision'`; Android returns false; Flow/snapshot already declare isVision. `RCTPlatform.mm` maps `UIUserInterfaceIdiomVision` to vision. Preserve OS='ios', Platform.select's ios branch and native constants. |
| A-02 | Keyboard JS | both | `RN/Libraries/Components/Keyboard/Keyboard.js` | same, `KeyboardImpl` constructor/addListener/removeAllListeners | apply | Import warnOnce. On isVision, skip constructor's internal show/hide subscriptions; addListener warns once with `Keyboard-unavailable` (keyboard occupies a separate system window) and returns `{remove() {}}`; removeAllListeners returns. Keep dismissal/metrics/layout-animation code. RV made CS checks explicit `=== true`. Native counterpart N-17. |
| A-03 | KeyboardAvoidingView | both | `RN/Libraries/Components/Keyboard/KeyboardAvoidingView.js` | same, componentDidMount/render | apply | Warn once with `KeyboardAvoidingView-unavailable`, skip subscriptions, render ordinary View retaining ref/style/rest props/children, without keyboard-driven onLayout/height/position/padding. Existing empty subscription array makes unmount safe. RV only makes truthiness checks explicit. |
| A-04 | ScrollView keyboard listeners | both | `RN/Libraries/Components/ScrollView/ScrollView.js` | same, componentDidMount | apply | Guard all four keyboardWillShow/WillHide/DidShow/DidHide subscriptions with `Platform.isVision !== true`. Preserve initial metrics, additional offset and animated-node attachment; current unmount null-checks subscriptions. |
| A-05 | StatusBar lifecycle | both | `RN/Libraries/Components/StatusBar/StatusBar.js` | same, componentDidMount/componentWillUnmount | adapt | Add warnOnce `StatusBar-unavailable` and visionOS mount return before stack insertion. 0.88 now tracks `_mountedCount` and `_appearanceSubscription`: add corresponding unmount return before unconditional decrement, otherwise reference patch creates a negative count. Update already checks _stackEntry. Imperative methods still forward through native iOS module; verify the visionOS stub, not just component mounting. |
| A-06 | Input accessory JS | both | `RN/Libraries/Components/TextInput/InputAccessoryView.js` | same platform branch | apply | Render native view only for `Platform.OS === 'ios' && !Platform.isVision`; visionOS follows warning/null fallback. API is deprecated but still present. Native counterparts N-18/N-21/N-22. |
| A-07 | Legacy welcome screen | CS | `RN/Libraries/NewAppScreen/components/Header.js` | directory removed; new template welcome UI | obsolete | CS changed welcome text, overflow visible→hidden and removed marginBottom -192. RV drops hunk because old NewAppScreen is gone. Do not restore removed core example; P-17 handles template. |
| A-08 | SwiftUI scene data | both | `RN/Libraries/SwiftExtensions/RCTReactContext.swift` | new same path | apply | Add @Observable RCTSceneData with ID, optional [String:AnyHashable] props and equality; RCTReactContext.scenes/getSceneData(id:); EnvironmentValues.reactContext/default environment key. Adopt RV whole-file `#if os(visionOS)`, absent in CS, around Observation/SwiftUI implementation. |
| A-09 | Main SwiftUI window | both | `RN/Libraries/SwiftExtensions/RCTMainWindow.swift` | new same path | apply | Preserve both initializers, initial props/dev-menu anchor, custom content builder and onOpenURL modifier. WindowHandlingModifier uses shared reactContext/openWindow/dismissWindow/supportsMultipleWindows: RCTOpenWindow stores id/userInfo then opens; RCTUpdateWindow changes props; RCTDismissWindow removes/dismisses; immersive notifications maintain scene data. RV whole-file os(visionOS) guard. App must opt into multiple scenes and forward URL callback. |
| A-10 | Secondary SwiftUI windows | both | `RN/Libraries/SwiftExtensions/RCTWindow.swift` | new same path | apply | Add Scene/WindowGroup(id:), four initializers (explicit module or ID-as-module; optional content builder), root representable with scene props/no dev-menu ornament, and RCTFatal when appearing without registered scene data. Use RV whole-file os(visionOS) guard. |
| A-11 | SwiftUI root/ornament | both | `RN/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift` | new same path | apply | UIViewControllerRepresentable creates RCTReactViewController, accepts initial props/scene anchor, forwards prop changes, optionally attaches UIHostingOrnament under DEBUG. DevMenuView calls RCTTriggerReloadCommandListeners or posts RCTShowDevMenuNotification, with glass background. RV whole-file os(visionOS) guard keeps spatial APIs out of other builds. |
| A-12 | SwiftUI UIKit host | both | `RN/Libraries/SwiftExtensions/RCTReactViewController.{h,m}` | new same paths; RCTAppDelegate.rootViewFactory and RCTSurfaceHostingProxyRootView.appProperties | adapt | Preserve module/props init, root creation, resize notification, tap updating lastFocusedWindow and merging nonnil props. Current factory returns Fabric RCTSurfaceHostingProxyRootView; use its appProperties→surface.properties contract rather than deprecated RCTRootView cast. rootViewFactory still exists through reactNativeFactory. Guard implementation TARGET_OS_VISION. N-01 owns focused-window property; resize notification already upstream. Verify nil props/update behavior: references mutableCopy existing props; current factory normalizes initial props to {}. |
| A-13 | SwiftExtensions pod | both | `RN/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec` | new same path | adapt | Preserve name, Swift/header/ObjC glob, UIKit/SwiftUI frameworks and Core/XR/WindowManager dependencies; inherit visionOS via min_supported_versions. Ensure imported AppDelegate/factory headers have an explicit React-RCTAppDelegate dependency instead of relying on install order. New code must compile from source. Use agreed fork source metadata, not stale CS identity. |
| A-14 | WindowManager JS | both | `RN/Libraries/WindowManager/{NativeWindowManager.js,WindowManager.js}` | new same paths | apply | Re-export spec; getWindow(id) returns handle with id/open(props)/update(props)/close(), all native promises. supportsMultipleScenes uses native constant or false; absent native implementation rejects with 'NativeWindowManager is not available'. Adopt RV ESM default export (CS CommonJS) matching lazy root getter; preserve nonvision safe import. |
| A-15 | WindowManager native module | both | `RN/Libraries/WindowManager/RCTWindowManager.{h,mm}` | new same paths | adapt | Implement NativeWindowManagerSpec, export WindowManager, typed constants and NativeWindowManagerSpecJSI factory. Main-queue open/update/close post RCTOpenWindow/RCTUpdateWindow/RCTDismissWindow with id/userInfo. References reject unsupported multiple-scenes but omit return and still post/resolve: return after rejection. Guard TARGET_OS_VISION or strictly select visionOS sources so other platforms gain no active behavior. Align signatures with generated protocol; current ModuleConstants alias is compatible. Verify bridgeless lookup. |
| A-16 | WindowManager pod | both | `RN/Libraries/WindowManager/React-RCTWindowManager.podspec` | new same path | adapt | Prefer RV rct_cxx_language_standard(), ReactCodegen header spelling, add_rn_third_party_dependencies and explicit React-RCTFBReactNativeSpecVisionOS dependency. Skip CS hardcoded Folly/C++ flags and React_Codegen spelling. Retain React-Core/RCTWindowManagerHeaders, TypeSafety, JSI, ReactCommon/turbomodule/core and NativeModulesApple dependencies; coordinate new header subspec with T2-build and verify static/framework linkage. |
| A-17 | XR JS | both | `RN/Libraries/XR/{NativeXRModule.js,XR.js}` | new same paths | apply | Re-export spec and expose requestSession(sessionId,userInfo)/endSession promises. Missing native module rejects with 'NativeXRModule is not available'. Adopt RV ESM/default export and current Flow syntax, preserving nullable/optional public props behavior. |
| A-18 | XR native module | both | `RN/Libraries/XR/RCTXRModule.{h,mm}` | new same paths | adapt | Implement NativeXRModuleSpec, export XRModule from RCTXRModule, NativeXRModuleSpecJSI, session ID and child bridge controller. requestSession mounts SwiftUI host on RCTKeyWindow().rootViewController, posts RCTOpenImmersiveSpace(id,userInfo), resolves opened, rejects error/cancel/already-open/unsupported-scenes. Guard TARGET_OS_VISION. Fix reference rejection-without-return, failed-open/cancel bookkeeping, and endSession clearing _currentSessionId before queued dismissal reads it: capture correct ID and perform state/controller transitions on main queue. Verify cancel, failed-open, reopen, duplicate-open and end paths. |
| A-19 | Swift immersive bridge | both | `RN/Libraries/XR/ImmersiveBridge.swift` | new same path | apply | Keep ObjC ImmersiveSpaceResult opened/userCancelled/error, completion type and SwiftUIBridgeFactory.makeImmersiveBridgeView. os(visionOS) protects open/dismiss environment actions; asynchronously open on appearance/dismiss on disappearance, map result to completion. Existing nonvision fallback returns ordinary UIViewController. Unknown future result currently never completes: decide explicit error completion and verify. A-20 must validate generated RCTXR-Swift.h module name. |
| A-20 | XR pod | both | `RN/Libraries/XR/React-RCTXR.podspec` | new same path | adapt | Apply RV helper/C++/spec-pod updates as A-16; retain React-Core/RCTXRHeaders, TypeSafety/JSI/NativeModulesApple/ReactCommon dependencies and Swift/ObjC++ globs. Coordinate header subspec and installation with build owner. Verify RCTXR-Swift.h under static pods and USE_FRAMEWORKS; do not exclude new module sources because another platform uses prebuilt RNCore. |
| A-21 | VisionOS codegen specs | both | `RN/visionos_modules/{NativeWindowManager.js,NativeXRModule.js}` | new same paths | adapt | Keep separate specs, non-enforcing TurboModuleRegistry.get and names WindowManager/XRModule. Window constants optional supportsMultipleScenes plus getConstants/openWindow/updateWindow/closeWindow promises; XR requestSession/endSession promises. Modernize Flow/casts/object type consistently. Resolve signature mismatch: reference XR spec sessionId optional but public API string required; nullable JS props versus nonnullable Object spec; Window TS optional open props versus nullable-required Flow. Preserve required string IDs and calls XR.requestSession(id), window.open(), and omitted/null unrestricted object payloads; do not narrow payload schema. Normalize omitted props or express native nullability accurately; generate rather than handpatch native signatures. B owns library FBReactNativeSpec_visionOS/type modules/jsSrcsDir visionos_modules. |
| A-22 | VisionOS generated-spec pod | RV | `RN/React/React-RCTFBReactNativeSpecVisionOS.podspec` | new same path; generated `RN/React/FBReactNativeSpec_visionOS/**` | adapt | RV adds explicit wrapper for fork symbols absent in upstream binaries. Preserve header/pod names, globs, USE_HEADERMAP=NO, framework resolution and JS engine/third-party deps. Replace removed ReactCommon/turbomodule/bridging with current React-bridging using 0.88 ordinary spec pod as pattern. Always compile generated implementation when installed; do not make this headers-only through prebuilt-source filtering. Coordinate generated-file ownership; never hand-edit output. |
| A-23 | Root runtime/Flow exports | both | `RN/{index.js,index.js.flow}` | same | apply | Add lazy .default getters and matching Flow default re-exports for XR/WindowManager using RV. CS accidentally points StyleSheet Flow export at WindowManager; RV fixes it. Preserve 0.88 StyleSheet and all other exports. |
| A-24 | Public types and snapshot | both; snapshot RV | `RN/Libraries/XR/XR.d.ts`; `RN/Libraries/WindowManager/WindowManager.d.ts`; `RN/types/index.d.ts`; XR/window hunks in `RN/ReactNativeApi.d.ts` | `RN/index.js.flow` → `RN/types_generated/**`/snapshot; compatibility entry `RN/types_DEPRECATED/index.d.ts` | adapt | types/index moved/reorganized: default package types now generated; react-native-legacy-deep-imports condition selects types_DEPRECATED. Preserve named public types XRStatic, WindowStatic, WindowManagerStatic and Window type alias via Flow root exports; merely exporting XR/WindowManager defaults drops these names. Author accurate Flow (primitive string, consistent optional/null payloads), run yarn build-types and yarn test-generated-typescript. References also falsely declare runtime const Window; document correcting that declaration as a compatibility deviation, preserve its type alias, and do not invent runtime export. Add legacy compatibility exports only through ownership request. Snapshot already includes isVision. PLAN also omits __typetests__; request test-path changes. |
| A-25 | Obsolete type-test config | both | `RN/types/tsconfig.json` | removed; `RN/__typetests__/tsconfig.json` and generated test config | obsolete | Reference adds react-native/*→../* mapping. Current type tests use bundler resolution/package exports; do not recreate removed config or widen exports. Use current tests for A-24, through correct ownership. |
| A-26 | RV version stamp | RV | `RN/Libraries/Core/ReactNativeVersion.js` | same generated source | skip | RV stamps 0.86.2→0.86.3; target is already 0.88.0. Preserve target and use version generator only for intentional releases. |
| A-27 | Unrelated API snapshot churn | RV | non-XR/window hunks in `RN/ReactNativeApi.d.ts` | same generated snapshot | skip | Do not transplant changed self-import aliases, FlatList/VirtualizedList Omit composition, style/layout/host refs, section/list/Animated hashes or signed-source lines. These are generator-state drift, not visionOS functionality; current generation determines output. |

## T3-apps

| ID | Area | Source | Reference file(s) | 0.88 target | Class | Port notes |
| --- | --- | --- | --- | --- | --- | --- |
| P-01 | RNTester pod target | both | `RT/Podfile` | same, `pods` helper / `use_react_native!` | adapt | Add `target('RNTester-visionOS')`, `platform :visionos, min_visionos_version_supported`, then `pods('RNTester-visionOS')`. Keep existing iOS/test targets. Coordinate source-core selection with T2-build before global ENV/singleton state is initialized: a mixed iOS/visionOS Podfile must not reuse iOS-only core facades for visionOS or silently change standalone iOS defaults. Check `ReactCommon-Samples`, push notifications, ScreenshotManager, MyNativeView and NativeCxxModuleExample dependencies. |
| P-02 | Unrelated OCMock bump | both | `RT/Podfile`, same hunk as P-01 | existing `RNTesterUnitTests` dependency | skip | Do not change `OCMock ~> 3.9.1` to a Git checkout of tag v3.9.2 merely to copy the fork. The added visionOS app is not the existing iOS unit-test target; no visionOS requirement was established for this change. |
| P-03 | RNTester project and scheme | both; generator/scheme RV-only | `RT/RNTesterPods.xcodeproj/project.pbxproj`; `RT/scripts/add-visionos-target.rb`; `RT/RNTesterPods.xcodeproj/xcshareddata/xcschemes/RNTester-visionOS.xcscheme` | same project, new generator and shared scheme | adapt | Prefer RV's idempotent Xcodeproj generator over CS's hand-merged CocoaPods output. Add target, product, group, App.swift/AppDelegate.swift sources, assets/privacy resources, Debug/Release configurations and matching scheme IDs. Target-scoped settings: `SDKROOT=xros`, `SUPPORTED_PLATFORMS="xros xrsimulator"`, device family 7, aligned `XROS_DEPLOYMENT_TARGET`, Swift 5 and upstream C++ standard. Fix RV's generator creating an iOS target and SDK-specific `Foundation.framework` path: use the selected SDK's framework, not `iPhoneOS26.0.sdk`. Bundle `js/RNTesterApp.ios.js` with existing `with-environment.sh`/`react-native-xcode.sh`, quoted paths and valid `.xcode.env` inputs. Let pod install generate CP phases, linkage and header paths. RV dropped CS's project-wide xros switch, stale YogaKit search paths and test-target churn, reducing rebase impact. |
| P-04 | RNTester incidental project churn | CS; RV removal of churn | `RT/RNTesterPods.xcodeproj/project.pbxproj` | existing iOS/test project entries | skip | Skip CS UUID replacements/reordered CP phases, empty Packages group, deletion of `RCTNetworkTaskTests.m` from Sources, project-wide `SDKROOT=xros`, and alterations of iOS/test supported platforms/Catalyst flags. Keep 0.88 iOS settings; only P-03's new target gets visionOS settings. RV already omitted these changes. |
| P-05 | RNTester SwiftUI scene and delegate | both | `RT/RNTester-visionOS/{App.swift,AppDelegate.swift}` | same new directory; current `RCTAppDelegate`/`RCTRootViewFactory` | adapt | Port `RNTesterApp`, `@UIApplicationDelegateAdaptor`, `RCTMainWindow(moduleName:"RNTesterApp")`, URL forwarding to `RCTLinkingManager.onOpenURL`, `RCTWindow(id:"SecondWindow", sceneData:...)` with bottom ornament and 400×700 default size, and `ImmersiveSpace(id:"TestImmersiveSpace")` with mixed/progressive/full selection. Initialize `RCTAppDependencyProvider`, set `automaticallyLoadReactNativeWindow=false`, and use the T2-apis scene context. Resolve debug bundle via `js/RNTesterApp.ios`; add release `main.jsbundle` fallback rather than always querying Metro. Verify 0.88 deprecated delegate still feeds the shared Fabric factory. |
| P-06 | RNTester scene manifest | both | `RT/RNTester-visionOS/Info.plist` | same new file | apply | Preserve `rntester` URL scheme and `UIApplicationSceneManifest`: application scene role, `UIApplicationSupportsMultipleScenes=true`, empty SwiftUI scene configurations. This enables the SecondWindow and immersive examples. |
| P-07 | RNTester asset bundle | both | all 11 asset files under `RT/RNTester-visionOS/Assets.xcassets/**` and `Preview Content/**` (expanded in ledger) | same new paths | apply | Copy the solid image stack and JSON catalogs, including binary Back `back.jpg` and Front `front.png`; Middle is intentionally an empty image layer. Keep layer order Front/Middle/Back, vision idiom/2x metadata, root catalog and Preview Assets catalog. Binary SHA-256 matches between CS and RV. Include assets in the new target only. |
| P-08 | RNTester privacy manifest | both | `RT/RNTester/PrivacyInfo.xcprivacy` | existing `RT/PrivacyInfo.xcprivacy` | already-upstream | The existing root-level manifest already has the same FileTimestamp C617.1, UserDefaults CA92.1, SystemBootTime 35F9.1, empty collected data and false tracking entries. Reference it from the visionOS target instead of adding a duplicate under RNTester/. Preserve the iOS resource reference. |
| P-09 | RNTester JS registration/menu | both | `RT/js/RNTesterApp.ios.js`; `RT/js/utils/RNTesterList.ios.js` | same; `AppRegistry.registerComponent`, examples array | adapt | Register `SecondWindow` and include `XRExample` only for `Platform.isVision`; ordinary iOS must not register the visionOS-only example/menu. Module lookups themselves are non-enforcing. Keep OS and bundle platform ios where existing code expects it. |
| P-10 | XR/window examples | both | `RT/js/examples/SecondWindow/SecondWindow.js`; `RT/js/examples/XR/XRExample.js` | same new files | adapt | Preserve support check, `XR.requestSession('TestImmersiveSpace')`, `endSession`, and `WindowManager.getWindow('SecondWindow').open({title})`, `.update({title})`, `.close()`, plus second-window counter/close control and error alerts. Use the resolved fork consistently rather than mixing scoped-fork and upstream imports. RV adds `RNTesterModuleExample` annotation; use 0.88 Flow syntax/types (`string`, current React element typing), handle unknown errors, and render boolean state visibly. Exercise real open/update/close and immersive cancellation in T4. |
| P-11 | RNTester dependencies and CLI | both | `RT/package.json` | same; existing peerDependencies/CLI devDependencies | adapt | Point the fork dependency at `react-native-mindzone-visionos@0.88.0`, retaining one effective React Native runtime for Metro. Current React is 19.3.0 and CLI packages are 20.2.0. CS explicitly added cli-platform-apple 15 alpha; RV dropped that addition while depending on fork CLI wiring. Pin the verified Apple command package with T2-build rather than copying either old version; expose a working run-visionos path. Existing Metro `extraNodeModules['react-native']` already points to `../react-native`; preserve that workspace resolution. |
| P-12 | HelloWorld package relocation | both | CS `packages/helloworld/package.json`; RV `private/helloworld/package.json` | `private/helloworld/package.json`, existing Metro workspace alias | adapt | CS's package moved to private/; this is not removal of the app. Replace/add the fork dependency using the agreed workspace resolution while keeping imports `react-native` resolving to this local source and React 19.3.0. Do not copy CS React19.0/RV19.2.3. No new visionOS target is implied here; the standalone template is P-16 onward. |
| P-13 | Removed test-library manifest | CS | `packages/react-native-test-library/package.json` | no root manifest; new `apple/` and `common/` fixtures | obsolete | CS changed the old fixture's react-native devDependency. RV no longer has that hunk; 0.88 has split fixtures (`react-native-test-library-apple/common`), not a same-name package to rename. Do not recreate the old manifest. |
| P-14 | New 0.88 autolinking fixtures | 0.88 check | no fork hunk | `packages/react-native-test-library/{apple,common}/{package.json,react-native.config.js,*.podspec}` | adapt | Both podspecs inherit `min_supported_versions`, so helper addition suffices. Both configs currently expose only `ios:{}`; if RNTester visionOS autolinking queries visionos, add equivalent visionos metadata without removing iOS and preserve Apple→Common transitive dependency. Do not blindly replace deliberately synthetic peer `react-native:1000.0.0` in the autolinking fixture with a release version. Validate discovery against the chosen CLI. |
| P-15 | Jest resolver package identity | RV | `packages/jest-preset/jest/resolver.js` | same `packageFilter` | apply | Extend the existing `filteredPkg.name === 'react-native'` condition to also recognize `react-native-mindzone-visionos`, then delete its exports for Jest's existing private-subpath compatibility. Keep the upstream name case. Test resolution through the alias and direct package name. |
| P-16 | Template package wrapper | both templates | `{package.json,template.config.js,postInitScript.js,LICENSE}` | new `packages/visionos-template/` | adapt | Create `react-native-mindzone-visionos-template@0.88.0`, CommonJS, public publish configuration; pack `template/*`, `template.config.js`, `postInitScript.js` including underscore dotfile placeholders. Keep `placeholderName:'HelloWorld'`, display-name placeholder, `templateDir`, `platforms:['visionos']`, post-init hook and MIT attribution. Instructions must invoke this template/fork and working run-visionos. Do not publish during implementation. |
| P-17 | Template JS/tooling resolution | both templates; CS resolver dropped by RV | `template/{package.json,metro.config.js,jest.config.js,tsconfig.json,App.tsx,index.js,app.json}` | same beneath `packages/visionos-template/` | adapt | Align React/renderer to 19.3.0, RN tooling to 0.88.0 and CLI to the verified 0.88-compatible release. Both templates install upstream `react-native` plus a scoped fork; CS maps visionos with `getPlatformResolver`, RV leaves Metro config empty. Ensure `react-native` imports on visionOS resolve to this fork, with one React/runtime, by a documented alias/resolver scheme coordinated with T2-build; do not assume native Podfile selection controls Metro. Restore supported platform resolution if retaining separate upstream/fork installs. Include verified cli-platform-apple command dependency, `visionos` run script, modern `@react-native/jest-preset` and TypeScript config. Keep RV's external NewAppScreen/safe-area structure only after those dependencies resolve and their pods support visionOS; no legacy `Libraries/NewAppScreen` import. |
| P-18 | Template visionOS pods | both templates | `template/visionos/Podfile` | same new path | adapt | Resolve `react-native-mindzone-visionos/scripts/react_native_pods.rb` through Node for hoisting; use that same resolved package root in `use_react_native!`, not a hard-coded scoped path. Use shared visionOS floor, source React core, retained supported prebuilt dependencies/Hermes, dependency codegen and `react_native_post_install`. Preserve optional USE_FRAMEWORKS and test inheritance if tests remain. RV's 26.0 floor and Viro comment are product-specific; omit them absent an actual dependency requirement. |
| P-19 | Template SwiftUI startup | both templates | `template/visionos/HelloWorld/{App.swift,AppDelegate.swift}` | same new paths | adapt | Port `HelloWorldApp` and `RCTMainWindow(moduleName:"HelloWorld")`; add explicit `import ReactAppDependencyProvider` and disable automatic UIKit window loading, matching RNTester. Keep debug Metro `index` and release `main.jsbundle`. Integrate the current T2 shared Fabric factory/context and verify app-name substitution. References' native delegate does not explicitly import its generated provider. |
| P-20 | Template Xcode/resources | both templates | entire `template/visionos/HelloWorld.xcodeproj`, `HelloWorld/{Info.plist,PrivacyInfo.xcprivacy,Images.xcassets/**}`, `visionos/_xcode.env` | same new paths | adapt | Reconcile target SDK to xros/xrsimulator, family7, matching deployment minimum, and inherited 0.88 C++/Swift settings. Reference projects still contain project `SDKROOT=iphoneos`, iOS13.4 settings and generated CP artifacts; do not use them as proof of visionOS configuration. Quote bundle-phase paths and resolve the fork through REACT_NATIVE_PATH. Preserve privacy resource inclusion (RV adds it), catalogs, shared scheme and local-network Metro settings. Remove iOS-only armv7/orientation/status-bar plist remnants. References set multiple-scenes false; enable true if shipping XR/window examples, otherwise document the default single-window capability. Align test scheme IDs with actual targets. |
| P-21 | Template native smoke test | both templates | `template/visionos/HelloWorldTests/{HelloWorldTests.m,Info.plist}` and scheme test entry | same new test target / current scene root | adapt | Old test imports legacy RCTRootView, reads UIApplication delegate.window and waits for 'Welcome to React'; these do not establish SwiftUI/Fabric startup and RV's newer App content may not match. Remove unused legacy import, obtain the active app window/scene through ported window utilities or an appropriate UI test, and assert a deterministic accessible element in the actual shipped app. Preserve test target only with a working scheme and xros host. |
| P-22 | Template iOS/Android payload | both templates | all `template/ios/**`, `template/android/**` | corresponding new template directories | adapt | Preserve both platforms in the new template. Bring build versions and native entry points to 0.88 using this repo's current HelloWorld/build configuration as evidence, not CS0.79/RV0.86 pins. RV uses `ReactNativeApplicationEntryPoint.loadReactNative`, lazy `getDefaultReactHost`, main-manifest `${usesCleartextTraffic}` and newer Gradle wrapper; CS debug AndroidManifest was replaced, not a visionOS feature to restore. Preserve resource/launcher files, wrapper executable permissions, Android debug keystore, iOS factory delegate/launch screen/privacy assets and scheme. Apply no visionOS behavior to these platform-specific startup paths. Exact Android wrapper/plugin compatibility remains a template validation check. |
| P-23 | Template marketing text | both templates | package `README.md` and identity metadata | new template README/metadata | skip | Do not copy CS/RV badges, Discord links, Expo-only support claims, Viro promotion, old repository URLs or release claims. Write accurate install/version/attribution documentation for this fork and describe only validated support. Keep license attribution. |
| P-24 | Template common scaffolding | both templates | `template/{Gemfile,README.md,__tests__/App.test.tsx,_bundle/config,_eslintrc.js,_gitignore,_prettierrc.js,_watchmanconfig,babel.config.js}` | same new paths | adapt | Retain ordinary template tooling/dotfile renaming and renderer smoke-test intent. Update install instructions and verify Gemfile constraints against installed Ruby/CocoaPods/Xcodeproj; RV retains `xcodeproj <1.26.0` while adding Ruby3.4 `nkf`, so do not assume that pin fits Xcode27. Keep safe existing defaults and 0.88 Babel preset; no unrelated formatting changes in the core fork. |

## Cross-cutting checks

### CocoaPods census and artifact selection

All **87** existing `*.podspec` files under `RN/` are listed below. “Shared map” means **needs the B-05 visionOS entry in min_supported_versions; no per-file platform edit**. This is a platform-declaration audit, not proof that every source/dependency builds. There are 83 shared-map consumers and four exceptions. All existing podspec decisions belong to T2-build; new API-owned specs A-13/A-16/A-20/A-22 are additional to this census.

`RCT_USE_PREBUILT_RNCORE=0` is required for visionOS because the user-supplied artifact evidence says React.xcframework lacks xros. Keep normal prebuilt Hermes/RNDeps selection; their artifacts have xros slices. The audit verified selection code, not binary contents. Metadata alone cannot supply a missing slice. The new generated RNDeps facade podspecs are a separate B-13 obligation: they are emitted `.podspec.json`, absent from a source `*.podspec` census. Mixed-target global state remains the explicit B-12 uncertainty.

| RN-relative podspec | visionOS declaration/action |
| --- | --- |
| `Libraries/ActionSheetIOS/React-RCTActionSheet.podspec` | Shared map — B-05. |
| `Libraries/AppDelegate/React-RCTAppDelegate.podspec` | Shared map — B-05. |
| `Libraries/Blob/React-RCTBlob.podspec` | Shared map — B-05. |
| `Libraries/FBLazyVector/FBLazyVector.podspec` | Shared map — B-05. |
| `Libraries/Image/React-RCTImage.podspec` | Shared map — B-05. |
| `Libraries/LinkingIOS/React-RCTLinking.podspec` | Shared map — B-05. |
| `Libraries/NativeAnimation/React-RCTAnimation.podspec` | Shared map — B-05. |
| `Libraries/Network/React-RCTNetwork.podspec` | Shared map — B-05. |
| `Libraries/PushNotificationIOS/React-RCTPushNotification.podspec` | Shared map — B-05. |
| `Libraries/Required/RCTRequired.podspec` | Shared map — B-05. |
| `Libraries/Settings/React-RCTSettings.podspec` | Shared map — B-05. |
| `Libraries/Text/React-RCTText.podspec` | Shared map — B-05. |
| `Libraries/TypeSafety/RCTTypeSafety.podspec` | Shared map — B-05. |
| `Libraries/Vibration/React-RCTVibration.podspec` | Shared map — B-05. |
| `React/CoreModules/React-CoreModules.podspec` | Shared map; already excludes real RCTStatusBarManager on visionOS and selects PlatformStubs. |
| `React/React-RCTFBReactNativeSpec.podspec` | Shared map — B-05. |
| `React/React-RCTFabric.podspec` | Shared map — B-05. |
| `React/Runtime/React-RCTRuntime.podspec` | Shared map — B-05. |
| `React-Core-prebuilt.podspec` | Shared metadata, but **exclude from visionOS graph**: no xros React binary (B-12). |
| `React-Core.podspec` | Shared map — B-05. |
| `React.podspec` | Shared map — B-05. |
| `ReactApple/Libraries/RCTFoundation/RCTDeprecation/RCTDeprecation.podspec` | No platform restriction; already usable, do not introduce one. |
| `ReactApple/RCTAnimatedModuleProvider/React-RCTAnimatedModuleProvider.podspec` | Shared map — B-05. |
| `ReactApple/RCTSwiftUI/RCTSwiftUI.podspec` | Shared map — B-05. |
| `ReactApple/RCTSwiftUIWrapper/RCTSwiftUIWrapper.podspec` | Shared map — B-05. |
| `ReactCommon/React-Fabric.podspec` | Shared map — B-05. |
| `ReactCommon/React-FabricComponents.podspec` | Shared map — B-05. |
| `ReactCommon/React-FabricImage.podspec` | Shared map — B-05. |
| `ReactCommon/React-Mapbuffer.podspec` | Shared map — B-05. |
| `ReactCommon/ReactCommon.podspec` | Shared map — B-05. |
| `ReactCommon/callinvoker/React-callinvoker.podspec` | Shared map — B-05. |
| `ReactCommon/cxxreact/React-cxxreact.podspec` | Shared map — B-05. |
| `ReactCommon/hermes/React-hermes.podspec` | Shared map — B-05. |
| `ReactCommon/hermes/executor/React-jsitracing.podspec` | Shared map — B-05. |
| `ReactCommon/jserrorhandler/React-jserrorhandler.podspec` | Shared map — B-05. |
| `ReactCommon/jsi/React-jsi.podspec` | Shared map — B-05. |
| `ReactCommon/jsiexecutor/React-jsiexecutor.podspec` | Shared map — B-05. |
| `ReactCommon/jsinspector-modern/React-jsinspector.podspec` | Shared map — B-05. |
| `ReactCommon/jsinspector-modern/cdp/React-jsinspectorcdp.podspec` | Shared map — B-05. |
| `ReactCommon/jsinspector-modern/network/React-jsinspectornetwork.podspec` | Shared map — B-05. |
| `ReactCommon/jsinspector-modern/tracing/React-jsinspectortracing.podspec` | Shared map — B-05. |
| `ReactCommon/jsitooling/React-jsitooling.podspec` | Shared map — B-05. |
| `ReactCommon/logger/React-logger.podspec` | Shared map — B-05. |
| `ReactCommon/oscompat/React-oscompat.podspec` | Shared map — B-05. |
| `ReactCommon/react/bridging/React-bridging.podspec` | Shared map — B-05. |
| `ReactCommon/react/cxxstableapi/React-cxxstableapi.podspec` | Shared map — B-05. |
| `ReactCommon/react/debug/React-debug.podspec` | Shared map — B-05. |
| `ReactCommon/react/featureflags/React-featureflags.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/core/platform/ios/React-NativeModulesApple.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/defaults/React-defaultsnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/dom/React-domnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/featureflags/React-featureflagsnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/idlecallbacks/React-idlecallbacksnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/intersectionobserver/React-intersectionobservernativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/microtasks/React-microtasksnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/mutationobserver/React-mutationobservernativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/resizeobserver/React-resizeobservernativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/samples/ReactCommon-Samples.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/viewtransition/React-viewtransitionnativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/nativemodule/webperformance/React-webperformancenativemodule.podspec` | Shared map — B-05. |
| `ReactCommon/react/networking/React-networking.podspec` | Shared map — B-05. |
| `ReactCommon/react/performance/cdpmetrics/React-performancecdpmetrics.podspec` | Shared map — B-05. |
| `ReactCommon/react/performance/timeline/React-performancetimeline.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/consistency/React-rendererconsistency.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/css/React-renderercss.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/debug/React-rendererdebug.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/graphics/React-graphics.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/imagemanager/platform/ios/React-ImageManager.podspec` | Shared map — B-05. |
| `ReactCommon/react/renderer/runtimescheduler/React-runtimescheduler.podspec` | Shared map — B-05. |
| `ReactCommon/react/runtime/React-RuntimeCore.podspec` | Shared map — B-05. |
| `ReactCommon/react/runtime/React-RuntimeHermes.podspec` | Shared map — B-05. |
| `ReactCommon/react/runtime/platform/ios/React-RuntimeApple.podspec` | Shared map — B-05. |
| `ReactCommon/react/timing/React-timing.podspec` | Shared map — B-05. |
| `ReactCommon/react/utils/React-utils.podspec` | Shared map — B-05. |
| `ReactCommon/reactperflogger/React-perflogger.podspec` | Shared map — B-05. |
| `ReactCommon/runtimeexecutor/React-runtimeexecutor.podspec` | Shared map — B-05. |
| `ReactCommon/yoga/Yoga.podspec` | Shared map — B-05. |
| `scripts/codegen/__fixtures__/test-library/test-library.podspec` | Discovery fixture already explicitly includes visionos1.0. |
| `scripts/codegen/__fixtures__/test-library-2/test-library-2.podspec` | Deliberate discovery fixture iOS/macOS/tvOS; no visionOS addition needed. |
| `sdks/hermes-engine/hermes-engine.podspec` | Already explicit visionos1.0 and xros/hermesvm wiring (B-14); source outputs B-15. |
| `third-party-podspecs/DoubleConversion.podspec` | Shared map — B-05. |
| `third-party-podspecs/RCT-Folly.podspec` | Shared map — B-05. |
| `third-party-podspecs/ReactNativeDependencies.podspec` | Shared map — B-05. |
| `third-party-podspecs/boost.podspec` | Shared map — B-05. |
| `third-party-podspecs/fast_float.podspec` | Shared map — B-05. |
| `third-party-podspecs/fmt.podspec` | Shared map — B-05. |
| `third-party-podspecs/glog.podspec` | Shared map — B-05. |

### SwiftPM

0.88 has `RN/Package.swift` and `RN/Libraries/ReactNativeDependencies/Package.swift`, plus newly published setup/scaffolding/codegen SwiftPM tooling. The dependency package has **no platforms restriction**, so it needs no `.visionOS` declaration; its binary target points to `../../third-party/ReactNativeDependencies.xcframework`, whose slice support comes from supplied artifact evidence. Source RN manifest uses source core with binary Hermes/RNDeps; consumer setup instead downloads binary React core. These are distinct paths (B-21/B-22). Source platform declarations, target graph, visionOS status-bar stub selection, generated manifests, framework platform conditions and source-directory selection all need review/adaptation. The binary consumer flow cannot be called visionOS-ready without an xros React artifact. RV's source Package.swift was not shipped in its npm package; 0.88 ships setup-apple-spm/scripts/spm, but still does not list root Package.swift or ios-prebuild in npm files.

### Codegen, native lookup and public API

B-18–B-20 and A-21/A-22 form one contract: keep main and visionOS schemas separate; generate Apple code with platform ios; ensure core detection understands the renamed package; prevent duplicated upstream schemas when both packages exist; ship generated visionOS files before consumer pod install. A read-only in-memory Android codegen probe against RV's visionos_modules returned NativeWindowManagerSpec.java and NativeXRModuleSpec.java: ios-only metadata is not a filter. Normal core Gradle scans ../src, but generic CLI android/all needs this B-18 filter before generateSchemaInfos:

```js
const libraries = codegenEnabledLibraries.filter(
  ({name, config}) =>
    !disabledLibraries.includes(name) &&
    (platform !== 'android' ||
      config.name !== 'FBReactNativeSpec_visionOS'),
);
```

Keep the B-19 output-folder mapping Apple-only. T2-build must add meaningful ios/android/all generation coverage under its scripts/codegen test ownership and regenerate affected snapshots through the test runner. No generated files were written during the probe. RV's published output explicitly contains:

- `React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS.h`
- `React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS-generated.mm`
- `React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOSJSI.h`

All 22 API fork-only source files in RV match its published package byte-for-byte. The new spec pod compiles generated implementation even though upstream core binaries lack these symbols. PLAN assigns surrounding React/** to T2-native, spec wrapper to T2-apis and generator to T2-build: coordinate regeneration via requests; no manual generated changes.

0.88 can compile out RCT_EXPORT_MODULE static registration, but RCTTurboModuleManager's getFallbackClassFromName still tries exact class name then RCT-prefixed name. That can resolve XRModule→RCTXRModule and WindowManager→RCTWindowManager when linked. Therefore runtime module lookup is a required check, **not a proven missing provider**. The generated module-provider path filters core libraries, so adding ios.modules.className alone is not a guaranteed fix.

Runtime getters and Flow exports must agree with lazy ESM defaults, safe absence off visionOS, handle methods, optional/null props and named public types. Default public typings come from index.js.flow→types_generated, with ReactNativeApi.d.ts snapshot; types_DEPRECATED preserves legacy compatibility. Run current generators and type checks, not hand-edits. Platform.isVision and native interfaceIdiom are already upstream; OS remains ios. A-05 must account for new StatusBar mount/unmount counter. Multi-scene crash/RN_ALLOW_MULTIPLE_SCENES wording exists only in RCTAppDelegate.h comments; no implementing guard was found, so treat it as documentation uncertainty to test, not an invented blocker.

### npm, CLI and release integration

B-01–B-04 cover files/bin/platform commands. Local installed `node_modules/@react-native-community/cli-platform-apple` is **20.2.0**. Reading its build/index.js, runCommand/createRun.js, getPlatformInfo.js and simulator destination map confirms command factories, ctx.project[platformName] lookup, visionos→xrsimulator/xros and visionOS Simulator mapping. Installed cli-config-apple supportedPlatforms includes visionos. This verifies command wiring from source, not a successful run-visionos launch. Preserve Community CLI20.2.0 alignment in the new template.

N-08 debug bundle URLs and B-17 release bundle command must agree on platform=ios plus resolver.platformExtension=visionos. Verify a real .visionos file and imports of XR resolve to this fork. Existing Metro aliases are not proof that a separately installed upstream package cannot win resolution. Package files must ship local-cli, visionos_modules, Swift/ObjC sources, generated specs and both typing surfaces. Do not run prepack/pack during T1 because it modifies generated files; T2/T4 must validate the resulting tarballs.

B-28/B-30/B-33/P-16 account for CI, fork release preparation, registry tests and template packing. Preserve upstream CI/release behavior; no bot destinations, publishing, tags or commits are authorized in port tasks. Resolve actual repository/release URL metadata before release tooling uses it.

### 0.86.2 → 0.88 native scan

Literal `diff -rq` ran independently for React/, ReactApple/, ReactCommon/, Libraries/ against upstream0.86.2. Each returned1 (differences), with 189/6/733/634 report lines respectively, including removals/non-native changes. Recursive native-content comparison found:

| Root | Changed native files | Added native files |
| --- | ---: | ---: |
| React | 94 | 5 |
| ReactApple | 1 | 1 |
| ReactCommon | 559 | 49 |
| Libraries | 29 | 0 |
| Total | 683 | 55 |

Native suffixes checked: .m/.mm/.h/.cpp/.swift/.c; no .cc/.cxx/.hpp occur in these target roots. Added/changed lines were inspected for requested APIs and broader UIKit/availability/target macros, Foundation/CoreGraphics/CoreText/CoreAnimation/AV/Metal uses. The new unsupported accesses beyond reference-hunk matching are `RCTKeyWindow().screen` in RCTScreenSize and `mainWindow.screen` in RCTExportedDimensions (N-10/N-16). Keep 0.88 nonvision fallbacks while adapting the spatial branches.

The exact risky-API hit dispositions, compared with the reference guards:

| Hit/site in target | Reference coverage / 0.88 disposition |
| --- | --- |
| AppDelegate loadReactNativeWindow mainScreen.bounds | both → N-02. |
| RCTUtils UIDevice.orientation | RV adds guard → N-10; CS's RCTUtils hunks only cover size/window lookup. |
| RCTUtils screen lookup / UIScreen.screens fallback | changed since0.86; N-10 must cover new window.screen access, not only old mainScreen string. |
| RCTUtils RCTUIStatusBarManager/windowScene.statusBarManager | SDK-available; retain helper; guard no-status-bar behavior at live modal callsites (N-33). |
| RCTAlertController mainScreen fallback | RV guard for later upstream fallback → N-13. |
| RCTDeviceInfo mainWindow.screen/UIScreen.screens | changed since0.86 → N-16; orientation and fullscreen accesses already TARGET_OS_IOS (N-34). |
| RCTBoxShadow two mainScreen.scale uses | RV-only → N-25. |
| RCTSampleTurboModule mainScreen dimensions | both, method moved to initialize → N-31. |
| RCTKeyboardObserver window.screen.coordinateSpace | both → N-17. |
| RCTSurfacePointerHandler / RCTSurfaceTouchHandler screen coordinate spaces | both → N-23/N-24. |
| Real RCTStatusBarManager status style/hidden/frame/setters | CocoaPods already excludes implementation on visionOS and selects stub; SwiftPM unconditionally excludes stub and needs B-21/B-22 adaptation. |
| Fabric modal preferredStatusBarStyle/prefersStatusBarHidden | legacy reference intent → N-33, guard only overrides, preserve touch handling. Modal orientation validation already RCT_DEV && TARGET_OS_IOS. |
| inputAccessoryView / keyboardDismissMode / old edit-menu paths | explicit N-18–N-22; live scroll keyboard accessory branch already TARGET_OS_IOS. Removed legacy counterparts N-06/N-07/N-29 are not missing ports. |
| UIFeedbackGenerator, UIImpact/Selection/NotificationFeedbackGenerator, haptic use | No native hits. |
| UIApplication.sharedApplication.keyWindow | No native access hits. Existing helper/scene.keyWindow code is separately audited; not the unavailable legacy application accessor. |
| UIScreen brightness | No native hardware-brightness use; brightness hits are UIColor HSV/CSS filters. |
| UIWindowLevelStatusBar in DevLoadingView/LogBoxView | Not unavailable in local SDK; keep unless runtime visual check shows a problem. |
| RCTHost.mm / RCTFrameTimingsObserver.mm independent active-window selection | Compiles with supported APIs; **uncertain multiwindow/ornament diagnostic behavior**. T2-native owns checking this with N-11 and may route only visionOS through corrected helper if tests show wrong window. |

Read-only checks of installed `/Applications/Xcode.app/Contents/Developer/Platforms/XROS.platform/Developer/SDKs/XROS27.0.sdk` confirmed UIWindow.screen, UIDevice.orientation, UIResponder.inputAccessoryView and UIScrollView.keyboardDismissMode are visionOS-unavailable. UIScreen.mainScreen/screens and UIWindowScene.interfaceOrientation are available but deprecated in this SDK; they still need spatially correct behavior. UIStatusBarManager/scene.statusBarManager and UIWindowLevelStatusBar are available; old direct UIApplication status-bar setters are unavailable. New UNUserNotificationCenter setBadgeCount and scene launch keys are available (launch keys deprecated). These distinctions avoid confusing behavioral port requirements with compiler errors.

Other inspected added/changed native Apple code did not reveal new unsupported APIs:

| Files/area | Why no extra guard is listed |
| --- | --- |
| New React/CoreModules/RCTInspectorWebSocketReporter.{h,mm}; changed RCTWebSocketModule.mm | Foundation/CFHTTPMessage reporting, no hardware screen/status assumptions. |
| New React/Tests/Mounting/{RCTScrollViewComponentViewTests.mm,RCTViewComponentViewUnmountTests.mm}, React/Tests/Text/RCTTextInputUtilsTest.mm | Keyboard tests already TARGET_OS_IOS; ordinary view/geometry/tint tests otherwise. |
| New ReactApple/RCTAnimatedModuleProvider/RCTAnimatedModuleProvider+Private.h and changed implementation | Foreground check uses supported UIApplication.applicationState; existing CADisplayLink usage. |
| AppDelegate/RCTReactNativeFactory.{h,mm}, RCTDefaultReactNativeFactoryDelegate.mm | New URL-context/user-activity scene overloads use supported launch keys; error-text changes safe. Preserve API with N-04. |
| RCTRedBox2Controller.mm; Fabric View/Paragraph/Unimplemented component views | Supported application-state/accessibility/text/color changes; TV additions already guarded. |
| React/I18n/RCTLocalizedString.mm and RCTUtils asset catalog changes | NSBundle/UIImage resources, no extra screen assumptions. |
| React/Views/RCTFont.mm; renderer/textlayoutmanager/platform/ios RCTAttributedTextUtils/RCTFontUtils/RCTTextLayoutManager/RCTTextPrimitivesConversions | CoreText descriptors/attributed text/CoreGraphics drawing; no newly unavailable API identified. |
| renderer/graphics/platform/ios HostPlatformColor/PlatformColorParser/RCTPlatformColorUtils | Shared semantic UIColor fallbacks. |
| DevLoadingView, EnhancedScrollView, text fields/text views | Generic transforms/content sizes/input changes; no new hardware/status APIs. |
| Blob/Image/Network/Settings/Vibration native changes | Module signature, Foundation/URL/error changes; existing AudioServicesPlaySystemSound(kSystemSoundID_Vibrate) unchanged, no new generator. |
| PushNotificationManager new setBadgeCount | Supported in local XROS SDK; initial-notification reference suppression separately N-05. |
| TurboModule/runtime ObjC++ and tests; remaining ReactCommon additions | Foundation/lifecycle/thread work or C++ ABI, ArrayBuffer, ResizeObserver, TextEffect/layout/runtime/Yoga grid code; no additional UIKit screen/status/haptics sites. |

This is an exhaustive reference/target-source audit, **not a substitute for compiling against xros and xrsimulator**. T4 remains responsible for actual builds/launch/iOS regression verification.


### RNTester and template acceptance

P-01–P-24 cover target, shared scheme, SwiftUI startup, assets, privacy, XR/SecondWindow examples, package resolution, test fixtures and the standalone npm template. `RT/{RCTTest/React-RCTTest,NativeCxxModuleExample/NativeCxxModuleExample,NativeModuleExample/ScreenshotManager,NativeComponentExample/MyNativeView}.podspec` all inherit `min_supported_versions`; so do both new `react-native-test-library` podspecs. No duplicate platform line is necessary after the helper is extended. A targeted native-API grep of the three extra RNTester native-module/component directories and test-library fixtures found no additional UIScreen/status-bar/orientation/haptics guard hit.

T4 must validate from the packed template, not only a monorepo-relative checkout: placeholder replacement, package `files` inclusion, `run-visionos` discovery, Metro's resolved RN source, codegen, pod install, debug and release bundle loading, xrsimulator build and launch. Exercise initial dimensions, resizing, alert/dev menu presentation, keyboard/input accessory no-ops, links, pinch/pointer events, XR open/end/cancel, secondary-window properties/close and normal iOS behavior. None of these runtime outcomes is claimed by this inventory.

### Template file coverage

The published CS template has 70 files and RV has 69; their union is 70 (the CS-only Android debug manifest is replaced by RV's main-manifest setting). P-16 owns package wrapper/config/hook/license; P-23 owns package README identity; P-17 owns JS entry/app/config/dependencies; P-18 owns visionOS Podfile; P-19 owns its two Swift sources; P-20 owns its Xcode project/scheme, two asset-catalog JSON files, app plist/privacy and `_xcode.env`; P-21 owns the two native-test files; P-22 owns every iOS/Android file; P-24 owns the remaining common scaffolding. Thus no published-template file is silently omitted. Core package publish-surface checks are recorded separately under T2-build.

Concrete target-version evidence for P-22: current `private/helloworld/android/build.gradle` declares build tools37.0.0, compileSdk37, targetSdk35, minSdk24, NDK27.1.12297006 and Kotlin2.1.20; root wrapper uses Gradle9.4.1. Current CocoaPods helper retains iOS15.1 and minimum Xcode16.1. These are inspected 0.88 values, not proof that copying the old template's Android wrapper/native project is compatible; reconcile the complete template build configuration and validate it.

## Not ported

- **Obsolete architecture/layout:** N-06 legacy text view, N-07 base text input, N-12 key-window cache proxy, N-27 legacy modal implementation and N-29 legacy ScrollView/manager are removed. Their surviving behavior maps to live Fabric/window paths; no legacy implementation is resurrected. A-07 old NewAppScreen and A-25 old type-test config are gone; B-27 old Jest mock mapping and P-13 original test-library manifest target removed layouts.
- **Already upstream, preserved without a port patch:** B-03 CLI executable delegation, B-08 fmt modular headers, B-14 Hermes xros backend, B-32 DotSlash owner constants; N-34 trait-scale/hover/iOS-only branches; A-01 isVision; P-08 privacy manifest. RV's modalInPresentation intent also exists in current Fabric with allowSwipeDismissal (N-33).
- **Whitespace only:** N-09 RCTKeyCommands and N-26 UIManager. Other incidental blank-line hunks within implementation rows are not copied.
- **Release/generator drift:** A-26/N-30/B-36 reference version stamps and A-27 unrelated generated API aliases/hashes. Keep 0.88 values and generate only necessary output. B-31 upstream recovery workflows are unrelated to this fork's release process.
- **Historical CI/cache policy:** B-25 CS .circleci/.yarn ignores and B-29 unrelated action upgrades, repository gating and removed jobs. B-28 supplies separate visionOS CI.
- **Foreign identity/product claims:** B-35 and P-23 logos, bots/promotional links, release destinations, Viro/Expo promises and stale documentation. Retain attribution; write correct fork documentation. B-30/B-33 replace obsolete @callstack package selectors/scopes rather than publishing to them.
- **Undocumented engine workaround:** N-32 CS suppression of unstable_initializeOnJsThread. RV dropped it; cause remains uncertain, and current engine/profiling startup must be tested before reviving any bypass.
- **Incidental app changes:** P-02 OCMock Git/version bump and P-04 CS project-wide SDK changes, generated UUID/CP churn, test-source deletion and unrelated target restrictions.
- **Reference bugs/global side effects:** do not copy CS StyleSheet→WindowManager export typo, malformed sample constant, permanent one-time window dimensions, global appearance/focused-window changes, unconditional visionOS bundler option, or unconditional CMake restriction. A-15/A-18/N-05 correct rejected/pending-promise defects; A-24 preserves public named types while explicitly recording the false runtime Window declaration correction. These are deliberate adaptations, not omitted visionOS features.
- **Template-specific extras:** RV's Viro-motivated visionOS26 floor, dead armv7/orientation/status-bar plist entries, stale native test assumptions and outdated dependency/SDK pins are replaced by P-17–P-24's coherent 0.88 app. CS's removed debug AndroidManifest is represented by the newer main-manifest cleartext setting, not re-added.
- **Excluded inputs:** lockfiles, changelogs, .git and node_modules were excluded by the supplied reference-diff command. Installed CLI source was read separately for command verification; excluded historical dependency trees/locks were not treated as port features.

## Reference coverage ledger

Each entry accounts for **all** hunks in that file. Numbers are hunk counts; `binary` records the two full-tree assets absent as textual hunks; `—` means no difference in that reference. Refer to the item IDs for split dispositions. Different paths for the same moved symbol remain separate here to make omissions visible.

| Reference path (repo-relative) | CS hunks | RV hunks | Item IDs |
| --- | ---: | ---: | --- |
| `.github/actions/test-ios-helloworld/action.yml` | 1 | — | `B-29` |
| `.github/actions/test-ios-rntester/action.yml` | 1 | — | `B-29` |
| `.github/actions/test-visionos-rntester/action.yml` | 1 | 1 | `B-28` |
| `.github/workflows/bump-podfile-lock.yml` | — | 2 | `B-31` |
| `.github/workflows/create-draft-release.yml` | — | 3 | `B-31` |
| `.github/workflows/generate-changelog.yml` | — | 3 | `B-31` |
| `.github/workflows/publish-npm.yml` | — | 7 | `B-31` |
| `.github/workflows/test-all.yml` | 18 | — | `B-28`, `B-29` |
| `.github/workflows/test-visionos.yml` | — | 1 | `B-28` |
| `.gitignore` | 1 | 1 | `B-24`, `B-25` |
| `README.md` | 1 | 1 | `B-34`, `B-35` |
| `jest.config.js` | 1 | — | `B-27` |
| `package.json` | — | 1 | `B-26` |
| `packages/helloworld/package.json` | 1 | — | `P-12` |
| `packages/jest-preset/jest/resolver.js` | — | 1 | `P-15` |
| `packages/react-native-test-library/package.json` | 1 | — | `P-13` |
| `packages/react-native/Libraries/AppDelegate/RCTAppDelegate.h` | 1 | 1 | `N-01` |
| `packages/react-native/Libraries/AppDelegate/RCTAppDelegate.mm` | 2 | 2 | `N-02` |
| `packages/react-native/Libraries/AppDelegate/RCTRootViewFactory.mm` | 2 | 2 | `N-03` |
| `packages/react-native/Libraries/Components/Keyboard/Keyboard.js` | 4 | 4 | `A-02` |
| `packages/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js` | 3 | 3 | `A-03` |
| `packages/react-native/Libraries/Components/ScrollView/ScrollView.js` | 1 | 1 | `A-04` |
| `packages/react-native/Libraries/Components/StatusBar/StatusBar.js` | 2 | 2 | `A-05` |
| `packages/react-native/Libraries/Components/TextInput/InputAccessoryView.js` | 1 | 1 | `A-06` |
| `packages/react-native/Libraries/Core/ReactNativeVersion.js` | — | 1 | `A-26` |
| `packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.h` | 1 | 1 | `N-04` |
| `packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm` | 4 | 4 | `N-04` |
| `packages/react-native/Libraries/NewAppScreen/components/Header.js` | 3 | — | `A-07` |
| `packages/react-native/Libraries/PushNotificationIOS/RCTPushNotificationManager.mm` | 2 | 2 | `N-05` |
| `packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift` | 1 | 1 | `A-09` |
| `packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift` | 1 | 1 | `A-08` |
| `packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h` | 1 | 1 | `A-12` |
| `packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m` | 1 | 1 | `A-12` |
| `packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift` | 1 | 1 | `A-11` |
| `packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift` | 1 | 1 | `A-10` |
| `packages/react-native/Libraries/SwiftExtensions/React-RCTSwiftExtensions.podspec` | 1 | 1 | `A-13` |
| `packages/react-native/Libraries/Text/Text/RCTTextView.mm` | 2 | 2 | `N-06` |
| `packages/react-native/Libraries/Text/TextInput/RCTBaseTextInputView.mm` | 4 | 4 | `N-07` |
| `packages/react-native/Libraries/WindowManager/NativeWindowManager.js` | 1 | 1 | `A-14` |
| `packages/react-native/Libraries/WindowManager/RCTWindowManager.h` | 1 | 1 | `A-15` |
| `packages/react-native/Libraries/WindowManager/RCTWindowManager.mm` | 1 | 1 | `A-15` |
| `packages/react-native/Libraries/WindowManager/React-RCTWindowManager.podspec` | 1 | 1 | `A-16` |
| `packages/react-native/Libraries/WindowManager/WindowManager.d.ts` | 1 | 1 | `A-24` |
| `packages/react-native/Libraries/WindowManager/WindowManager.js` | 1 | 1 | `A-14` |
| `packages/react-native/Libraries/XR/ImmersiveBridge.swift` | 1 | 1 | `A-19` |
| `packages/react-native/Libraries/XR/NativeXRModule.js` | 1 | 1 | `A-17` |
| `packages/react-native/Libraries/XR/RCTXRModule.h` | 1 | 1 | `A-18` |
| `packages/react-native/Libraries/XR/RCTXRModule.mm` | 1 | 1 | `A-18` |
| `packages/react-native/Libraries/XR/React-RCTXR.podspec` | 1 | 1 | `A-20` |
| `packages/react-native/Libraries/XR/XR.d.ts` | 1 | 1 | `A-24` |
| `packages/react-native/Libraries/XR/XR.js` | 1 | 1 | `A-17` |
| `packages/react-native/Package.swift` | — | 1 | `B-21` |
| `packages/react-native/README.md` | — | 1 | `B-34`, `B-35` |
| `packages/react-native/React-Core.podspec` | 1 | 2 | `B-06` |
| `packages/react-native/React.podspec` | 1 | 1 | `B-07` |
| `packages/react-native/React/Base/RCTBundleURLProvider.mm` | 1 | 1 | `N-08` |
| `packages/react-native/React/Base/RCTConstants.h` | 1 | 1 | `N-08` |
| `packages/react-native/React/Base/RCTConstants.m` | 1 | 1 | `N-08` |
| `packages/react-native/React/Base/RCTKeyCommands.m` | 1 | 1 | `N-09` |
| `packages/react-native/React/Base/RCTUtils.m` | 4 | — | `N-10`, `N-11` |
| `packages/react-native/React/Base/RCTUtils.mm` | — | 6 | `N-10`, `N-11` |
| `packages/react-native/React/Base/RCTVersion.m` | — | 1 | `N-30` |
| `packages/react-native/React/Base/UIKitProxies/RCTKeyWindowValuesProxy.mm` | 1 | — | `N-12` |
| `packages/react-native/React/CoreModules/RCTAlertController.mm` | 2 | 2 | `N-13` |
| `packages/react-native/React/CoreModules/RCTAppearance.mm` | 1 | 1 | `N-14` |
| `packages/react-native/React/CoreModules/RCTDevMenu.mm` | 1 | 1 | `N-15` |
| `packages/react-native/React/CoreModules/RCTDeviceInfo.mm` | 3 | 1 | `N-16` |
| `packages/react-native/React/CoreModules/RCTKeyboardObserver.mm` | 2 | 2 | `N-17` |
| `packages/react-native/React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` | 2 | 2 | `N-18` |
| `packages/react-native/React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm` | 3 | 3 | `N-19` |
| `packages/react-native/React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.mm` | 2 | 2 | `N-20` |
| `packages/react-native/React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm` | 2 | 3 | `N-21` |
| `packages/react-native/React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputUtils.mm` | 1 | 1 | `N-22` |
| `packages/react-native/React/Fabric/RCTSurfacePointerHandler.mm` | 4 | 4 | `N-23` |
| `packages/react-native/React/Fabric/RCTSurfaceTouchHandler.mm` | 1 | 1 | `N-24` |
| `packages/react-native/React/Fabric/Utils/RCTBoxShadow.mm` | — | 2 | `N-25` |
| `packages/react-native/React/Modules/RCTUIManager.mm` | 1 | — | `N-26` |
| `packages/react-native/React/React-RCTFBReactNativeSpecVisionOS.podspec` | — | 1 | `A-22` |
| `packages/react-native/React/Views/RCTModalHostViewController.m` | 1 | 1 | `N-27`, `N-33` |
| `packages/react-native/React/Views/RCTViewManager.h` | 1 | 1 | `N-28` |
| `packages/react-native/React/Views/ScrollView/RCTScrollView.m` | 2 | 2 | `N-29` |
| `packages/react-native/React/Views/ScrollView/RCTScrollViewManager.h` | 1 | 1 | `N-29` |
| `packages/react-native/React/Views/ScrollView/RCTScrollViewManager.m` | 4 | 3 | `N-29` |
| `packages/react-native/ReactAndroid/gradle.properties` | — | 1 | `B-36` |
| `packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.kt` | — | 1 | `B-36` |
| `packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h` | — | 1 | `N-30` |
| `packages/react-native/ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm` | 1 | 1 | `N-31` |
| `packages/react-native/ReactCommon/react/runtime/ReactInstance.cpp` | 1 | — | `N-32` |
| `packages/react-native/ReactNativeApi.d.ts` | — | 20 | `A-24`, `A-27` |
| `packages/react-native/index.js` | 1 | 1 | `A-23` |
| `packages/react-native/index.js.flow` | 1 | 1 | `A-23` |
| `packages/react-native/local-cli/localCommands.js` | 1 | 1 | `B-04` |
| `packages/react-native/package.json` | 3 | 4 | `B-01`, `B-02`, `B-11`, `B-18` |
| `packages/react-native/react-native.config.js` | 3 | 3 | `B-04` |
| `packages/react-native/scripts/cocoapods/autolinking.rb` | — | 1 | `B-10` |
| `packages/react-native/scripts/cocoapods/helpers.rb` | 1 | 1 | `B-05` |
| `packages/react-native/scripts/cocoapods/new_architecture.rb` | — | 1 | `B-11` |
| `packages/react-native/scripts/cocoapods/utils.rb` | 1 | 1 | `B-09` |
| `packages/react-native/scripts/codegen/__tests__/__snapshots__/generate-artifacts-executor-test.js.snap` | — | 4 | `B-36` |
| `packages/react-native/scripts/codegen/generate-artifacts-executor/constants.js` | — | 1 | `B-19` |
| `packages/react-native/scripts/codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS.js` | — | 2 | `B-19` |
| `packages/react-native/scripts/codegen/generate-artifacts-executor/generateNativeCode.js` | — | 2 | `B-19` |
| `packages/react-native/scripts/codegen/generate-artifacts-executor/utils.js` | — | 2 | `B-20` |
| `packages/react-native/scripts/ios-prebuild/cli.js` | — | 2 | `B-23` |
| `packages/react-native/scripts/ios-prebuild/types.js` | — | 1 | `B-23` |
| `packages/react-native/scripts/react-native-xcode.sh` | 1 | 1 | `B-17` |
| `packages/react-native/scripts/react_native_pods.rb` | 3 | 3 | `B-05`, `B-07`, `B-08`, `B-11` |
| `packages/react-native/sdks/hermes-engine/hermes-engine.podspec` | 1 | 1 | `B-15` |
| `packages/react-native/sdks/hermes-engine/utils/build-hermesc-xcode.sh` | 1 | 1 | `B-16` |
| `packages/react-native/types/index.d.ts` | 1 | 1 | `A-24` |
| `packages/react-native/types/tsconfig.json` | 1 | 1 | `A-25` |
| `packages/react-native/visionos_modules/NativeWindowManager.js` | 1 | 1 | `A-21` |
| `packages/react-native/visionos_modules/NativeXRModule.js` | 1 | 1 | `A-21` |
| `packages/rn-tester/Podfile` | 1 | 1 | `P-01`, `P-02` |
| `packages/rn-tester/RNTester-visionOS/App.swift` | 1 | 1 | `P-05` |
| `packages/rn-tester/RNTester-visionOS/AppDelegate.swift` | 1 | 1 | `P-05` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Back.solidimagestacklayer/Content.imageset/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Back.solidimagestacklayer/Content.imageset/back.jpg` | binary | binary | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Back.solidimagestacklayer/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Front.solidimagestacklayer/Content.imageset/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Front.solidimagestacklayer/Content.imageset/front.png` | binary | binary | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Front.solidimagestacklayer/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Middle.solidimagestacklayer/Content.imageset/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/AppIcon.solidimagestack/Middle.solidimagestacklayer/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Assets.xcassets/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester-visionOS/Info.plist` | 1 | 1 | `P-06` |
| `packages/rn-tester/RNTester-visionOS/Preview Content/Preview Assets.xcassets/Contents.json` | 1 | 1 | `P-07` |
| `packages/rn-tester/RNTester/PrivacyInfo.xcprivacy` | 1 | 1 | `P-08` |
| `packages/rn-tester/RNTesterPods.xcodeproj/project.pbxproj` | 36 | 16 | `P-03`, `P-04` |
| `packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/xcschemes/RNTester-visionOS.xcscheme` | — | 1 | `P-03` |
| `packages/rn-tester/js/RNTesterApp.ios.js` | 1 | 1 | `P-09` |
| `packages/rn-tester/js/examples/SecondWindow/SecondWindow.js` | 1 | 1 | `P-10` |
| `packages/rn-tester/js/examples/XR/XRExample.js` | 1 | 1 | `P-10` |
| `packages/rn-tester/js/utils/RNTesterList.ios.js` | 1 | 1 | `P-09` |
| `packages/rn-tester/package.json` | 2 | 1 | `P-11` |
| `packages/rn-tester/scripts/add-visionos-target.rb` | — | 1 | `P-03` |
| `private/helloworld/package.json` | — | 1 | `P-12` |
| `scripts/e2e/verdaccio.yml` | 1 | 1 | `B-33` |
| `scripts/monorepo/for-each-package.js` | 1 | 1 | `B-30` |
| `scripts/new-github-release-url.js` | 1 | 1 | `B-30` |
| `scripts/oot-release.js` | 1 | 1 | `B-30` |
| `scripts/releases/__tests__/__snapshots__/upload-release-assets-for-dotslash-test.js.snap` | — | 4 | `B-32` |
| `scripts/releases/upload-release-assets-for-dotslash.js` | — | 4 | `B-32` |
