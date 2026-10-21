# T10-audit: full release-readiness audit (Codex, read-only)

Saved verbatim, with local paths stripped. **Correction by the orchestrator:** the ledger row `React.podspec:56 ... Same iOS ... dependencies` is wrong. A real iOS-only consumer `pod install` failed with `Unable to find a specification for React-RCTSwiftExtensions`, because CocoaPods resolves `s.visionos.dependency` even for iOS-only Podfiles. See T11.

**Two major defects remain.** I audited the 255-file change set at `1cac7d8`, including added files. No edits were made. The temporary external iOS probe was removed before the final check; the working tree is clean.

Findings, ordered by severity:

1. **Major — source SwiftPM fails Swift 6 concurrency checking.**  
   [RCTReactContext.swift:48](packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift:48), selected by [Package.swift:783](packages/react-native/Package.swift:783).

   Building `RCTSwiftExtensions` uses Swift 6, but `RCTSceneContextKey.defaultValue` is nonisolated mutable static storage containing a non-Sendable class. A reduced compiler probe using the exact declaration produced:

   > static property 'defaultValue' is not concurrency-safe because it is nonisolated global shared mutable state

   The manifest supplies no language-mode override; tools version 6 defaults to Swift 6. CocoaPods selects Swift 5, so pod builds do not validate this path. [Swift documentation](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/enabledataracesafety/)

   **Fix:** select Swift 5 for the added Swift targets, matching their pods, or complete their Swift 6 isolation migration.  
   **Confidence: high.** Reproduced independently with reduced compiler probes; no full SwiftPM build claimed.

2. **Major — published prebuild tooling has an undeclared `plist` dependency.**  
   [package.json:119](packages/react-native/package.json:119), [framework-resources.js:29](packages/react-native/scripts/ios-prebuild/framework-resources.js:29).

   A packed consumer composing an Apple XCFramework reaches `xcframework.js → headers-compose.js → framework-resources.js → require('plist')` and fails with `MODULE_NOT_FOUND`.

   `plist` is absent from both the runtime’s production/peer dependency closure and the template’s dependency/devDependency closure. The workspace supplies it accidentally through Electron tooling. Excluding that accidental dependency in a module-loading probe reproduced the exception.

   **Fix:** declare `plist` directly in the runtime package and verify composition from a packed consumer installation.  
   **Confidence: high.** Ordinary CocoaPods builds do not exercise this path.

3. **Minor — selecting source core for iOS RNTester also enables visionOS.**  
   [Podfile:74](packages/rn-tester/Podfile:74).

   An iOS-only caller setting `RCT_USE_PREBUILT_RNCORE=0` now receives the `RNTester-visionOS` target and its additional pods. The exact stanza was evaluated with a recording Podfile DSL: this variable alone activates the target.

   **Fix:** introduce an independent visionOS-target opt-in, with source core required when that opt-in is enabled.  
   **Confidence: high.**

4. **Minor — the literal off-visionOS equivalence requirement has shared exceptions.**  
   Representative sites: [index.js:406](packages/react-native/index.js:406), [generateFBReactNativeSpecIOS.js:39](packages/react-native/scripts/codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS.js:39), [setup.js:92](packages/react-native/scripts/ios-prebuild/setup.js:92), [Package.swift:800](packages/react-native/Package.swift:800).

   These are observable changes outside visionOS: additional JS exports and types; extra iOS/prepack generation and header staging; an additional SwiftPM product target; CLI additions; and changed package selection/deduplication in coinstalled-runtime layouts. Fork identity and distribution metadata also necessarily differ.

   **Fix:** gate platform-specific generation/setup work where possible, and explicitly document the intended shared API, tooling and distribution exceptions to the compatibility contract. The ledger identifies these exceptions rather than asserting equivalence.  
   **Confidence: high.** This is a scope finding, not evidence of a regression in existing native runtime behavior.

5. **Minor — RNTester incorrectly displays a closed XR session after duplicate opening.**  
   [XRExample.js:43](packages/rn-tester/js/examples/XR/XRExample.js:43).

   Open a session, then press “Open XR Session” again. Native code rejects the duplicate while retaining the existing session; the catch handler sets `isOpen` to `false`. Executing the actual handler reproduced `isOpen=false` with the native session still open.

   **Fix:** disable duplicate opening while opening/open, or preserve the existing state on this rejection.  
   **Confidence: high.**

6. **Minor — generated applications lack the LICENSE their README references.**  
   [template/README.md:3](packages/visionos-template/template/README.md:3), [template.config.js:14](packages/visionos-template/template.config.js:14).

   Community CLI copies `./template`, but the license exists only in the wrapper directory. Generated apps therefore lack `LICENSE`, despite their README and copied source headers referring to it.

   **Fix:** include the applicable notices in `template/LICENSE`.  
   **Confidence: high.**

The compact off-visionOS ledger follows. Prefixes: `RN = packages/react-native`, `S = RN/scripts`, `RT = packages/rn-tester`, `T = packages/visionos-template/template`. Numbers identify changed hunk starts; **whole** covers an entire added file. “Same” means behaviorally equivalent under the stated condition. **Different** entries belong to finding 4 unless another finding is specified.

| Native file / hunks | Off-visionOS assessment |
|---|---|
| `RN/Libraries/AppDelegate/RCTAppDelegate.h:26,68`; `.mm:20,49,53,58,71,78` | Same. New declarations/imports/scene handling are vision-guarded; existing startup remains. Header comment changes only otherwise. |
| `RN/Libraries/AppDelegate/RCTRootViewFactory.mm:190` | Same. Expanded condition retains original TV/non-TV behavior. |
| `RN/Libraries/LinkingIOS/RCTLinkingManager.h:52`; `.mm:19,147,242,253` | Same. Captured URL and callbacks are vision-only; original launch-options path remains elsewhere. |
| `RN/Libraries/PushNotificationIOS/RCTPushNotificationManager.mm:535,553` | Same. Original notification handling retained outside visionOS. |
| `RN/React/Base/RCTBundleURLProvider.mm:471`; `RCTConstants.h:11`; `RCTConstants.m:11` | Same. New extension symbol/query guarded by `TARGET_OS_VISION`. |
| `RN/React/Base/RCTUtils.mm:382,386,417,445,644,669,772` | Same. Spatial orientation, sizing and window selection entirely guarded. |
| `RN/React/CoreModules/PlatformStubs/RCTStatusBarManager.mm:8,28,66`; `RCTStatusBarManager.mm:8,204` | Same runtime behavior. Off-visionOS SwiftPM stub becomes an empty compilation unit; upstream excluded it entirely. |
| `RN/React/CoreModules/RCTAlertController.mm:12,42,46,50,54` | Same. Transparent controller and zero-bounds fallback vision-only. |
| `RN/React/CoreModules/RCTAppearance.mm:72,76` | Same. Original light fallback retained. |
| `RN/React/CoreModules/RCTDevMenu.mm:476,483` | Same. Original synchronous execution retained. |
| `RN/React/CoreModules/RCTDeviceInfo.mm:93,176,212,225,231,238,246,348` | Behaviorally same, not token-identical. Vision observers are guarded; shared code caches the same readonly `screen.scale` value for two uses on the main queue. |
| `RN/React/CoreModules/RCTKeyboardObserver.mm:88,114,118,140` | Same. Original helpers/payload retained. |
| `RN/React/DevSupport/RCTFrameTimingsObserver.mm:12,297,312` | Same. Added lookup/import vision-only. |
| `RN/React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm:73,75,91,96` | Same. Original accessory behavior retained by inverse guards. |
| Same directory, `Modal/RCTFabricModalHostViewController.mm:49` | Same. Original non-TV status overrides retained off visionOS. |
| Same directory, `ScrollView/RCTScrollViewComponentView.mm:37,49,455,459` | Same. Original keyboard converter/assignment retained. |
| Same directory, `Text/RCTParagraphComponentView.mm:366,374` | Same. Original edit-menu fallback retained. |
| Same directory, `TextInput/RCTTextInputComponentView.mm:397,399,670,722`; `RCTTextInputUtils.mm:30,32` | Same. Accessory setup/reset/copy retained. |
| `RN/React/Fabric/RCTSurfacePointerHandler.mm:292,300,392,398,765,771`; `RCTSurfaceTouchHandler.mm:62,68` | Same. Original screen coordinate spaces retained at every site. |
| `RN/React/Fabric/Utils/RCTBoxShadow.mm:68,72,91,95` | Same. Original screen-scale reads retained. |
| `RN/React/Views/RCTViewManager.h:82` | **Different public header surface:** four additive macros. Existing macro behavior unchanged; no current call sites. |
| `RN/ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm:37,42` | Same. Original screen lookup retained. |
| `RN/ReactCommon/react/runtime/platform/ios/ReactCommon/RCTHost.mm:148,168,188,208` | Same. Original debugger window lookup retained. |
| New `SwiftExtensions/{RCTMainWindow,RCTReactContext,RCTRootViewRepresentable,RCTWindow,RCTWindowRouter}.swift`; `RCTReactViewController.{h,m}` — whole | Compiled out off visionOS. |
| New `WindowManager/RCTWindowManager.{h,mm}` and `XR/RCTXRModule.{h,mm}` — whole | Compiled out off visionOS. |
| `XR/ImmersiveBridge.swift` — whole | Spatial lifecycle guarded. UIKit fallback declarations are additive; standard integration selects the module only for visionOS. |
| Four new SwiftExtensions/XR/WindowManager/generated-spec podspecs — whole | New specifications; ordinary iOS dependency graph does not select them. |

For the native comparison, Clang preprocessing of all 30 modified Objective-C/C++ files produced 29 identical executable-token outputs and the described DeviceInfo scale temporary, across iOS, tvOS, Catalyst and macOS configurations. Imports were stripped for this comparison; it was **not** a compilation test.

| Shared JS/types file / hunks | Off-visionOS assessment |
|---|---|
| `RN/Libraries/Components/Keyboard/Keyboard.js:17,81,112,131` | Same existing behavior. Added warning import is inert; new branches require `isVision === true`. |
| `Keyboard/KeyboardAvoidingView.js:22,209,252` | Same existing behavior under the same guard. |
| `ScrollView/ScrollView.js:890` | Same four subscriptions when `isVision !== true`. |
| `StatusBar/StatusBar.js:15,356,382` | Same mount/unmount behavior; vision early returns preserve counters. |
| `TextInput/InputAccessoryView.js:55` | Same iOS/Android branch selection when `isVision` is false. |
| `RN/index.js:406`; `index.js.flow:459` | **Different:** additive runtime/type exports on every platform. |
| New `Libraries/{XR,WindowManager}` JS wrappers and `visionos_modules/{NativeXRModule,NativeWindowManager}.js` — whole | **Different additive APIs.** Safe imports without native modules; calls reject and capability defaults false. |
| `RN/ReactNativeApi.d.ts:7,494,5700,5730,5768,6078,6083` | **Different type surface:** generated additions; existing API declarations retained. |
| `RN/types_DEPRECATED/index.d.ts:154`; `Libraries/Utilities/Platform.d.ts:71`; new XR/WindowManager declarations — whole | **Different type surface:** additive APIs and Android `isVision`. Both type-check modes passed. |
| `RT/js/RNTesterApp.ios.js:19,29`; `js/utils/RNTesterList.ios.js:14,410` | Same nonvision registrations/menu. New entries guarded by `Platform.isVision`. |
| `RT/js/examples/{SecondWindow/SecondWindow.js,XR/XRExample.js}` — whole | New vision-selected examples; finding 5 affects XR example state. |
| `scripts/js-api/build-types/buildApiSnapshot.js:181` | Same logical upstream import name; renamed workspace package is explicitly represented as `react-native`. |

| Build/tooling file / hunks | Off-visionOS assessment |
|---|---|
| `RN/React-Core-prebuilt.podspec:9,19,95` | Same current iOS platform/version values: upstream and fork base both `0.88.0`. |
| `RN/React-Core.podspec:74,113`; `React.podspec:56` | Same iOS compilation/dependencies. New exclusion affects only vision-generated files; header/dependency additions are vision-scoped. |
| `S/cocoapods/helpers.rb:87`; `react_native_pods.rb:40,48` | **Different platform metadata**, unchanged iOS minimum. |
| `S/react_native_pods.rb:105`; `cocoapods/rncore.rb:39` | Same offvision; early return before environment changes. |
| `S/react_native_pods.rb:145,155,158`; `cocoapods/new_architecture.rb:161` | Same artifact versions now; future fork patches intentionally use their upstream base. |
| `S/react_native_pods.rb:189` | Same iOS graph; four pods installed only for visionOS. |
| `S/react_native_pods.rb:266`; `cocoapods/rndeps_facades.rb:59,67,71,88,96,116,139,141` | Same iOS dependencies/minimum; **generated JSON gains vision metadata**. Internal parameter and sole production caller changed together. |
| `S/react_native_pods.rb:293`; `cocoapods/codegen.rb:18,37`; `codegen_utils.rb:17,21,36,46,75,79` | Same ordinary nonvision command/repeat behavior. New validation affects mixed vision/nonvision selections. Ruby tests passed. |
| `S/react_native_pods.rb:646`; `cocoapods/utils.rb:432,444` | Same offvision target settings; actual platform checked. |
| `S/cocoapods/utils.rb:753` | **Additive classification entries**; existing membership unchanged. |
| `S/cocoapods/autolinking.rb:41,55`; `autolinking_utils.rb:8` | Same nonvision root/config selection. Ruby tests passed. |
| `RN/sdks/hermes-engine/hermes-engine.podspec:10` | Same normal alias installation; **different when upstream and direct fork coexist:** selects owning fork. |
| Same podspec `:110,168` | Same expanded iOS source-Hermes output path; SDK-specific overrides only for xros. |
| `RN/sdks/hermes-engine/utils/build-hermesc-xcode.sh:12` | Same offvision; new CMake gate only for xros/xrsimulator. |
| `RN/third-party-podspecs/ReactNativeDependencies.podspec:8,12,75` | Same normal alias/current version; **owning-package selection differs in coinstalled layouts**. |
| `S/react-native-xcode.sh:133`; `react_native_pods_utils/script_phases.sh:100`; `xcode/asset-catalog.sh:65` | Same nonvision arguments; xros cases isolated. |
| `S/codegen/generate-artifacts-executor/constants.js:34` | **Additive reserved-library mapping**; existing mapping unchanged. |
| Same directory, `generateFBReactNativeSpecIOS.js:25,39` | `.find()` preserves main selection; **extra vision-spec generation occurs during iOS/prepack runs**. |
| Same directory, `generateNativeCode.js:45,48,53,94,102` | Same existing-core skip/output behavior; extended to new reserved library. |
| Same directory, `index.js:59,71,125,130` | Existing iOS filtering retained; Android drops the added vision library. |
| Same directory, `utils.js:16,171,236,305,502` | **Different shared discovery:** duplicate core entries deduplicated; coinstalled upstream schemas skipped; selected fork supplies source references. |
| `S/generate-codegen-artifacts.js:29,61`; new `codegen/validate-apple-codegen.js` — whole | Existing defaults retained; optional vision selection and mixed-platform validation added. |
| `S/codegen/templates/Package.swift.template:15`; `.spm-template:31` | Existing iOS/Catalyst declarations retained; **generated text gains visionOS metadata**. |
| `RN/Package.swift:409,449,749,795,800,803,817` | Existing nonvision runtime graph retained, but **additional empty adapter target/product membership and manifest graph**. Vision build fails finding 1. |
| `S/spm/visionos/ReactVisionOS.swift` — whole | Empty module offvision; exported import guarded. |
| `S/ios-prebuild/cli.js:21,31,58`; `types.js:15,22` | Same default destination set; vision destinations explicitly selected. |
| `S/ios-prebuild/setup.js:91` | **Additional header staging offvision** whenever fork directories exist. |
| `S/setup-apple-spm.js:77,165,243,1065`; new `spm/apple-platform.js` — whole | Same ordinary iOS flow; new rejection for explicit/inferred vision selection. |
| `S/spm/download-spm-artifacts.js:64,81,135,1156`; `generate-spm-package.js:38,63,119,185,231` | Same default iOS downloads/package; rejects vision binary flow before writes. |
| `S/spm/generate-spm-autolinking-config.js:48,173,195,198` | Same default iOS directory/diagnostic; explicit vision selects its directory. |
| `S/spm/generate-spm-autolinking.js:61,198,241,971,1108,1160,1262,1281` | Same default iOS generated declarations; vision behavior explicit. Selected tests passed. |
| `S/spm/scaffold-package-swift.js:38,570,589,664,781,880,1081,1302,1392` | Same default iOS deployment/linker strings. Selected tests passed. |
| `S/spm/spm-types.js:14,40,67,174,215,388,393` | Flow-only additions. |
| `RN/react-native.config.js:73,88,99,109,115`; new `local-cli/{coreCommands,localCommands,resolvePackageName}.js` — whole | **CLI/platform surface differs.** Ordinary existing command arguments preserved; selected/custom runtime root now honored. |
| `packages/community-cli-plugin/src/commands/codegen.js:13,52`; `spm.js:13,17,34,90,102,125` | **Shared root-selection/platform-option differences.** Normal alias root retained. Shipped local adapters cover separately published plugin edits. |
| `packages/jest-preset/jest/resolver.js:25` | Original upstream case unchanged; **fork identity additionally receives export stripping**. |
| `packages/react-native-test-library/{apple,common}/react-native.config.js:17` | Same iOS configuration; additive vision metadata. |
| `RT/Podfile:72` | Finding 3. Default prebuilt iOS path retained. |
| `RT/Podfile.lock` — all hunks | **Different lock graph:** source-core/mixed-target installation, stable version stamps, vision pods/header subspecs and regenerated checksums. No unrelated dependency version bump found. |
| `RT/RNTesterPods.xcodeproj/project.pbxproj` — all hunks | Vision additions target-specific. Empty phase-array removals equivalent. Shared generated flags/path are also managed by unchanged upstream post-install logic. Committed project is not byte-identical. |
| New RNTester vision scheme and `scripts/add-visionos-target.rb` — whole | Explicit new target; generator checks for an existing target. Scheme IDs match. |
| `RT/metro.config.js:40`; new `scripts/visionos-resolver.js` — whole | Same nonvision delegation; vision preference requires iOS plus the extension option. Real-resolver tests passed. |
| `RT/react-native.config.js:24` | Existing iOS/Android declarations unchanged; additive vision declaration. |

| Distribution/scaffolding/test hunks | Off-visionOS assessment |
|---|---|
| Root `package.json:112`; `yarn.lock:7855`; `RT/package.json:18,40,60`; `private/helloworld/package.json:16` | **Shared package-resolution changes:** fork identity/workspace alias, Apple CLI dependency and new script. |
| `RN/package.json:2,4,8,11,22,85,87,118,144,228` | **Different identity, metadata, published files and codegen manifest.** Existing `bin`/exports retained. Finding 2 affects new prebuild surface. |
| `scripts/e2e/init-project-e2e.js:250` | Same when fork dependency absent; otherwise removes duplicate runtime during local-tarball substitution. |
| New `scripts/{oot-release,new-github-release-url}.js`, `scripts/monorepo/for-each-package.js` — whole | New explicit-use tools. No existing execution path changed; release safety verified below. |
| New vision workflow/action — whole | Separate vision jobs; existing iOS/Android workflows unchanged. |
| New template wrapper manifest/config/post-init script — whole | Independent scaffolder. Post-init only prints instructions. |
| `T/{App.tsx,index.js,app.json,package.json,babel.config.js,jest.config.js,metro.config.js,react-native.config.js,tsconfig.json,Gemfile}` — whole | **New shared sample behavior/configuration**, not upstream-identical. Resolver anchors the fork on iOS/Android; vision extension preference is conditional. |
| `T/{_bundle/config,_eslintrc.js,_gitignore,_prettierrc.js,_watchmanconfig,__tests__/App.test.tsx}` — whole | New isolated sample tooling/tests. |
| `T/ios/**` — every added file | New iOS sample. AppDelegate/SceneDelegate byte-identical to current HelloWorld; Podfile selects fork. Projects, tests and resources inspected individually. |
| `T/android/**` — every added file | New Android sample. Versions/startup checked against HelloWorld; Gradle resolves fork. Wrapper, keystore and resources inspected. |
| `T/visionos/**`; `RT/RNTester-visionOS/**` — every added file | New vision targets/resources. Swift startup guarded; resource references and project settings inspected. |
| Added/changed tests in Components, XR, WindowManager, CLI, CocoaPods, codegen, SwiftPM, resolver, RNTester, release and `__typetests__/visionos.ts` | Test-only behavior; no application imports. |
| `.gitignore:78,141`; AGENTS/README/license changes | No runtime behavior. Generated vision specs ignored consistently with upstream generation policy. Finding 6 covers generated-app license omission. |

All **91 apply/adapt inventory items have implementation sites**. That does not make all 91 release-complete:

| Inventory group | Confirmed coverage and exceptions |
|---|---|
| Build | B-01,02,04–07,09–13,15–20,22,24,26,28,30,33,34 implemented. **B-21 partial:** SwiftPM compiler failure. **B-23 incomplete as a packed consumer flow:** undeclared `plist`. |
| Native | N-01–05,08,10–11,13–25,28,31,33 implemented. No missing native apply/adapt item found. |
| APIs | A-02–06,08–24 implemented. A-10 intentionally recreates missing restored scene data rather than reproducing the references’ fatal behavior. SwiftPM integration remains subject to B-21. |
| Apps | P-01,03,05–07,09–12,14–22,24 implemented. **P-01 has finding 3; P-10 has finding 5; P-24 has finding 6.** |

Areas found clean, with verification limits:

- **Native lifecycle:** no verified double promise settlement, leak, `nil`/`NSNull` crash or unguarded post-visionOS-1 API. XR state changes stay on the main queue/MainActor; early rejects return; tokens prevent stale completion; invalidation settles pending calls. WindowManager uses synchronous acceptance and one active router handler.
- **Windows and linking:** focused windows are checked against connected foreground scenes; immersive scenes are excluded; weak ownership and observer cleanup are present. Initial URL capture records the first application scene’s URL—or absence—once; warm links emit without replacing it.
- **Package contents:** npm’s own read-only `npm-packlist`/Arborist selected **4,583 runtime files and 81 template files**. Required native/Swift sources, generated specs, podspecs, CLI adapters, type surfaces, wrappers and dotfile placeholders are included. No logs, `.tgz`, Pods, DerivedData, `visionos-port`, probes or local Xcode environment files were selected.
- **Consumer resolution:** alias/direct-package routing and Metro extension fallbacks checked. React/renderer 19.3.0, CLI 20.2.0 and RN tooling 0.88.0 agree with HelloWorld and the [official upstream template](https://raw.githubusercontent.com/react-native-community/template/0.88-stable/template/package.json). **Live registry availability was not verified** because network access failed.
- **CI:** current action already removes `sudo` from `xcodebuild -downloadPlatform visionOS`. No additional verified workflow defect found. Hosted CI was not rerun.
- **Release safety:** exact two-package allowlist; publishing requires `options.publish === true`; dry-run invokes no publication commands; no git tagging/writes; release URL generation only constructs a URL. No upstream package publication path found.
- **Licensing/hygiene:** root/runtime MIT and Meta notice retained; Callstack/ReactVision credited; inspected Gradle/Android assets retain attribution. No newly introduced secrets, machine-specific paths or unfinished-work markers found. The standard Android debug keystore is expected. Generated output tracking follows upstream policy.
- **Checks:** 36 unique focused JS tests across nine suites, 23 Ruby tests/77 assertions, both TypeScript modes, and ESLint on 75 changed source files passed. Jest cache persistence was suppressed in memory; temporary-file-writing cases were excluded.
- **Limits:** actual `npm pack --dry-run` failed on sandbox cache writes; packlist inspection substituted for file selection only. No fresh consumer installation, full native build, simulator interaction or full SwiftPM compilation was completed. Those outcomes are not established by this audit.