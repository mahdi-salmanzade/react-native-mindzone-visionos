# T3-apps report

Implemented the RNTester visionOS target/examples, the `react-native-mindzone-visionos-template@0.88.0` package, HelloWorld package identity, autolinking fixtures, and Jest resolver integration. ReactVision 0.86.4 is the primary reference, cross-checked with Callstack 0.79.6 and current 0.88 source. No already-upstream/obsolete classification was rejected.

“Done” below means source implementation or disposition review, not successful native application compilation. Full CocoaPods installation, Xcode builds, simulator launch, native smoke execution and iOS regression builds belong to T4. No Git writes, network access, package installation, publishing, `pod install`, full app build, `yarn.lock` change or Hermes-compiler-line edit was performed. Read-only Git inspection was used. All retained edits are in owned application/fixture paths and this task's report/requests. **Constraint incident:** one template verification command implicitly created a Babel cache under the new `template/node_modules`; that self-created cache/directory was removed, no existing dependency files were modified, and final packing excludes node_modules. Details appear with the template checks below.

Two cross-owner integration requests remain: the HelloWorld local E2E override must remove its stale registry dependency, and the new RNTester scheme must be exempted from the existing root ignore rule or deliberately staged by the orchestrator. See [requests/T3-apps.md](../requests/T3-apps.md). The scheme exists locally and the generator recreates it; no Git staging was performed.

## Item-by-item status

`RT` = `packages/rn-tester`; `VT` = `packages/visionos-template`; `TL` = `packages/react-native-test-library`.

| ID | Status | Files | Notes |
| --- | --- | --- | --- |
| P-01 | done | RT/Podfile, README.md | Adds visionOS target using shared pods/minimum when `RCT_USE_PREBUILT_RNCORE=0` is selected before installation. Default iOS targets/core policy unchanged. Existing T2 CI already supplies this variable. Five sample/extra podspecs evaluated for xros support. |
| P-02 | done (skip confirmed) | RT/Podfile | Keeps OCMock `~> 3.9.1`; no unrelated Git dependency. |
| P-03 | done; scheme staging request open | RT/scripts/add-visionos-target.rb, RNTesterPods.xcodeproj/project.pbxproj, shared RNTester-visionOS.xcscheme | Real xros target, family 7, Swift 5, shared floor 1.0, SDK-relative Foundation and inherited upstream C++ 20. Generator adds 184 pbxproj lines with no deletions, is byte-idempotent, and recreates a missing scheme. CocoaPods-generated integration left to T4. |
| P-04 | done (skip confirmed) | Existing RT project objects | Structural comparison preserves all existing iOS/test objects apart from necessary appended references. No upstream test/configuration/phase churn. |
| P-05 | done | RT/RNTester-visionOS/App.swift, AppDelegate.swift | Shared T2 context/factory, dependency provider, no automatic UIKit window, named main/secondary/immersive scenes, bottom ornament, 400×700 size, immersion styles and URL forwarding. Debug/release bundle paths. |
| P-06 | done | RT/RNTester-visionOS/Info.plist | rntester URL scheme, application scene role, multiple scenes and empty SwiftUI scene configuration; current Metro/Fabric keys added. |
| P-07 | done | RT/RNTester-visionOS/Assets.xcassets, Preview Content | All reference catalogs and binary images copied byte-identically. Actual xrsimulator asset compilation passed. |
| P-08 | done (already-upstream confirmed) | RT/PrivacyInfo.xcprivacy, project resource reference | Parsed existing manifest equals reference, including FileTimestamp C617.1, UserDefaults CA92.1, SystemBootTime 35F9.1, no collected data and false tracking. Reused existing iOS file reference. |
| P-09 | done | RT/js/RNTesterApp.ios.js, js/utils/RNTesterList.ios.js | Only `Platform.isVision` registers SecondWindow and loads XR menu. VM evaluation checked both true/false branches. Platform/bundle identity stays ios. |
| P-10 | done | RT/js/examples/XR, SecondWindow | Reference controls plus visible boolean state, primitive string/0.88 unknown error typing, error alerts for every async action, counter retained across prop update. Behavioral Jest tests pass. |
| P-11 | done | RT/package.json, react-native.config.js, metro.config.js, scripts/visionos-resolver.js | Fork peer 0.88.0, React 19.3 unchanged, Apple CLI 20.2.0, run script/scheme, explicit native sourceDir. Workspace RN alias preserved; real CLI discovery and both platform bundles checked. |
| P-12 | done; cross-owner E2E request open | private/helloworld/package.json | Direct fork 0.88.0 replaces upstream dependency; React 19.3 and Metro workspace alias unchanged. No new HelloWorld native target. Existing external E2E helper requires the requested local-override adaptation. |
| P-13 | done (obsolete confirmed) | TL old root manifest absent; apple/common manifests inspected | Old Callstack OSSLibraryExample no longer exists in RV/current upstream. Did not recreate it. |
| P-14 | done | TL/{apple,common}/react-native.config.js | Adds visionos alongside ios. Podspecs already inherit shared minima. Preserves synthetic RN 1000 peer and Apple→Common relation. Real CLI discovers both platforms/podspecs. |
| P-15 | done | packages/jest-preset/jest/resolver.js | Recognizes fork identity as well as upstream name. Real defaultResolver private-subpath checks cover alias/direct name. |
| P-16 | done | VT/package.json, template.config.js, postInitScript.js, LICENSE | Public CommonJS package 0.88.0, placeholders/platform/post-init preserved, proper payload/files and attribution. Offline packing/CLI-copy checks; no publication. |
| P-17 | done | VT/template/package.json, metro.config.js, jest.config.js, tsconfig.json, App.tsx, index.js, app.json, react-native.config.js | React/renderer 19.3, RN tooling 0.88, CLI20.2, current TS/Jest. Direct fork plus same-version npm alias; Metro/Jest select one physical runtime and one app React. Self-contained resolver implements visionOS preference with ios fallbacks. |
| P-18 | done | VT/template/visionos/Podfile | Node-resolved direct fork shared by CLI/Metro, source core before any target, shared minimum, supported Hermes/RNDeps prebuilds retained, optional frameworks and tests/post-install. |
| P-19 | done | VT/template/visionos/HelloWorld/{App,AppDelegate}.swift | Current T2 RCTAppDelegate factory/context contract, explicit dependency-provider import, SwiftUI root, labeled URL callback, debug index/release main.jsbundle. |
| P-20 | done | VT/template/visionos project, scheme, plist, privacy, assets, _xcode.env | xros/xrsimulator, family 7, floor 1, C++ 20, current quoted bundle scripts, valid scene/network metadata. Privacy is an app resource; copied spatial icon stack replaces stale flat iOS icon. Main window only; README explains additional scene registration. |
| P-21 | done; native execution deferred | VT/template/{visionos,ios}/HelloWorldTests | Scene-based connected active-window lookup and actual accessible `Hello, World!` heading, no legacy RCTRootView/delegate.window assumptions. Test host/scheme inspected; not executed natively. |
| P-22 | done; native execution deferred | VT/template/{ios,android} | Preserved both platforms. Current 0.88 iOS AppDelegate/SceneDelegate/factory; current Android entrypoint/host, Gradle 9.4.1/SDK 37/AGP 9 compatibility settings and Hermes namespace. Resources, wrapper permissions and debug keystore retained. |
| P-23 | done (skip confirmed) | VT/README.md, package metadata | Accurate fork instructions/limitations; no old promotion, Expo/Viro claims or release promises. Repository URL matches T2 owner-confirmation placeholder; not verified remotely. |
| P-24 | done | VT/template common scaffolding | Dotfile placeholders and CLI renaming preserved; modern Babel/Jest smoke and Gemfile supporting installed CocoaPods/Xcodeproj. Native and Jest smoke expect same actual text. |

## Reference choices and deviations

- Prefer ReactVision's generator/current Swift and Flow direction, rather than Callstack's project-wide changes. No original RNTester iOS source, build target or test phase was altered. New native files are guarded by `os(visionOS)` and isolated to the visionOS target.
- The mixed RNTester Podfile includes visionOS only in the already-required source-core mode. This uses T2's existing CI/environment contract without changing a default iOS-only installation or forcing source Hermes/RNDeps.
- `RCTAppDelegate` is deprecated upstream but remains the T2 SwiftExtensions contract: it creates the current `RCTReactNativeFactory` and exposes `RCTRootViewFactory` while tracking focused windows. Replacing it independently with a new app-only factory would bypass the shared context/focus implementation.
- The context is obtained through the public environment accessor and shared across scene roots. Its initializer is not public. Swift URL forwarding uses the actual T2 `onOpenURL(url:)` name.
- RNTester release lookup now uses main.jsbundle. The generator uses SDK-relative Foundation and quotes script paths; optional `.xcode.env.local` is not a required Xcode input. Root privacy metadata is reused.
- All example imports use canonical `react-native`, resolved to the fork by the existing workspace alias. The reference mixed scoped imports were removed. Every async operation handles failures; cancelled immersive entry stays visibly false. Secondary counter increments use a functional update.
- Metro keeps ios platform/package conditions and prioritizes `.visionos` source extensions only for the custom resolver option emitted by T2. The resolver is self-contained, avoiding an additional uninstalled Callstack helper. Actual Metro resolver tests and full RNTester bundles validate its fallback path.
- Template UI uses a core-only HelloWorld-style starter with a deterministic accessible heading, omitting RV's unverified new-app-screen/safe-area dependencies. The native smoke test now checks the shipped UI through connected scenes.
- Template's canonical npm alias and direct fork both specify 0.88.0. They may occupy two package-manager paths; Metro/Jest/CLI/Pods/Gradle deliberately choose the direct fork and app React. No upstream runtime dependency is installed by the template manifest.
- The generic visionOS floor is 1.0 from T2, not RV's Viro-specific 26.0. Template removes stale SDK/iOS settings and generated CocoaPods project fragments, uses current 0.88 native startup, and includes a spatial icon. Minimum-runtime compatibility still needs T4.
- Review corrected the template's inherited privacy-resource placement (test target only) and the obsolete unlabeled Swift URL callback. Both app projects were relisted after correction.

## NEW items

| ID | Status | Files | Finding/change |
| --- | --- | --- | --- |
| NEW-1 | done | RT/RNTester-visionOS/RNTester-visionOS.entitlements, project | Empty entitlement dictionary and target signing path, requested by the user but absent from both reference apps. No unnecessary capabilities. |
| NEW-2 | done | RT/RNTester-visionOS/Info.plist | Local-network ATS/usage metadata and RCTNewArchEnabled for current Metro/Fabric startup, absent from reference scene-only plist. |
| NEW-3 | done | RT/metro.config.js, scripts/visionos-resolver.js, tests | RNTester must interpret T2's resolver.platformExtension parameter, not just preserve its workspace alias. Added scoped fallback handling and actual resolver tests. |
| NEW-4 | requested | scripts/e2e/init-project-e2e.js (outside ownership) | Existing local HelloWorld override retains the newly renamed fork registry dependency. Exact cleanup requested; helper was inspected/evaluated read-only. |
| NEW-5 | requested | root .gitignore (outside ownership) | Existing RNTester project-directory rule hides the new shared scheme. Exact narrow exception chain or deliberate orchestrator staging requested. Generator can recreate it. |
| NEW-6 | done | VT/template/ios project and HelloWorldTests | Reference iOS scheme named tests absent from its project. Current 0.88 project/test target and scene-based accessibility smoke now agree. |
| NEW-7 | done | VT/package.json files list | Explicit nested node_modules exclusion prevents temporary caches/dependencies from leaking into packed templates. Final archive has 81 intended files. |

## Requests filed

[requests/T3-apps.md](../requests/T3-apps.md) contains exact changes and rationale for NEW-4/5. Other owners' files were not edited. T2 requests for source-core selection, shared context/scene manifest, matching XR/window IDs, URL forwarding, CLI root, and Metro resolver parameter have been implemented in owned files. Live behavior remains T4 verification.

## JavaScript and workspace checks

All commands ran from repository root unless otherwise stated. Babel cache was disabled on parent JS commands; direct local formatter binary was used rather than the root global-writing script.

1. `BABEL_DISABLE_CACHE=1 node_modules/.bin/jest packages/rn-tester/js/examples/XR/__tests__/XRExample-test.js packages/rn-tester/scripts/__tests__/visionos-resolver-test.js packages/jest-preset/jest/__tests__/setup-test.js --runInBand --watchman=false` — **3 suites / 6 tests passed**. Exercises immersive success/end/cancellation, unsupported scenes, all window actions/errors, prop update/counter preservation, secondary close failure, real Metro extension fallbacks and unchanged iOS/Android resolution, plus existing preset setup. Early drafts failed on deprecated test deep imports/mock timing and overly broad Text queries; test harness corrected to relative imports, post-mock module loading and explicit content selection. No product bug was hidden by weakening assertions.
2. `BABEL_DISABLE_CACHE=1 node_modules/.bin/flow full-check --max-workers 2 --temp-dir /private/tmp/T3-apps-flow` — **Found 0 errors** on final pass; log `/private/tmp/T3-apps-flow-final.log`. Initial pass found only deprecated `mixed` in the new error handler; changed to current `unknown`.
3. Scoped lint (exact command below) — passed, zero warnings. Initial import-order warning in the new test was fixed.

```sh
BABEL_DISABLE_CACHE=1 node_modules/.bin/eslint --max-warnings 0 \
  packages/rn-tester/js/RNTesterApp.ios.js \
  packages/rn-tester/js/utils/RNTesterList.ios.js \
  packages/rn-tester/js/examples/XR packages/rn-tester/js/examples/SecondWindow \
  packages/rn-tester/scripts/visionos-resolver.js \
  packages/rn-tester/scripts/__tests__/visionos-resolver-test.js \
  packages/rn-tester/metro.config.js packages/rn-tester/react-native.config.js
```

4. `node_modules/.bin/prettier --check` with those same paths plus `packages/rn-tester/package.json private/helloworld/package.json` — all matched files passed. Direct `prettier --write` was used only on new example/resolver/test files during implementation.
5. From `packages/rn-tester`: `BABEL_DISABLE_CACHE=1 node ../../packages/react-native/cli.js config > /private/tmp/T3-apps-rntester-cli.json` — passed. visionos/ios select the same RNTesterPods workspace and native source root; run/build/log-visionos are registered.
6. `BABEL_DISABLE_CACHE=1 node /private/tmp/T3-apps-js-integration.js` — passed false/true Platform.isVision menu/module-loading/registration checks by evaluating actual transformed RNTester files, CLI native-root checks and realpath equality of canonical react-native to local fork from RNTester and HelloWorld. Initial mock shape omitted default exports; corrected temporary harness, not source.
7. From `packages/rn-tester`, both bundle commands passed:

```sh
BABEL_DISABLE_CACHE=1 node ../../packages/react-native/cli.js bundle \
  --entry-file js/RNTesterApp.ios.js --platform ios \
  --resolver-option platformExtension=visionos --dev true \
  --bundle-output /private/tmp/T3-apps-rntester-visionos.bundle --max-workers 2
BABEL_DISABLE_CACHE=1 node ../../packages/react-native/cli.js bundle \
  --entry-file js/RNTesterApp.ios.js --platform ios --dev true \
  --bundle-output /private/tmp/T3-apps-rntester-ios.bundle --max-workers 2
```

Logs `/private/tmp/T3-apps-rntester-{visionos,ios}-bundle.log`. Metro emitted existing private-subpath export fallback warnings for ReactNativeFeatureFlags/DOMRectReadOnly, color-env warnings and the expected no-assets-destination notice. JS bundling succeeded; native binaries/runtime not exercised.

8. `node scripts/oot-release.js --new-version 0.88.0 --dry-run` — exit 0, selects both fork/template, `tarballs: []`, `dryRun: true`, `published: false`. No release files, hooks or publication executed.
9. `git diff --check` — passed. `git status --short`, scoped diffs, `git check-ignore -v` were read-only. The latter exposed NEW-5; scheme XML and project listing independently checked.

## RNTester native checks


Ruby commands that require installed gems used:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec \
GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 \
ruby ...
```

1. `ruby packages/rn-tester/scripts/add-visionos-target.rb` with the gem env — passed; created target and shared scheme. Reran successfully, no writes/duplicates. First pre-save development attempt failed because Xcodeproj's `real_path` is a Pathname and was compared with String; corrected to `.to_s`, then successful. No project save occurred in failed attempt. Bare Ruby initially could not find xcodeproj; installed CocoaPods gem env resolves Xcodeproj1.27.0. No gem installation.
2. `xcodebuild -list -project packages/rn-tester/RNTesterPods.xcodeproj` — exit0; lists RNTester, RNTesterUnitTests, RNTesterIntegrationTests, RNTester-visionOS and matching schemes. Xcode emitted sandbox permissions/cache/log warnings, inaccessible CoreSimulatorService warnings, and local provisioning-profile metadata warnings. Listing succeeded, but does not verify compilation or simulator availability.
3. `ruby -c packages/rn-tester/Podfile` and `ruby -c packages/rn-tester/scripts/add-visionos-target.rb` — both Syntax OK.
4. `plutil -lint packages/rn-tester/RNTesterPods.xcodeproj/project.pbxproj packages/rn-tester/RNTester-visionOS/Info.plist packages/rn-tester/RNTester-visionOS/RNTester-visionOS.entitlements packages/rn-tester/PrivacyInfo.xcprivacy` — all OK.
5. `python3 /private/tmp/T3-rntester-validate.py` — eight PASS checks: all upstream project objects preserved, visionOS settings/resource paths, reference privacy equality/shared reference, exact binary+JSON asset equality, scene/deep-link/empty entitlements keys, scheme target identifiers, byte-identical rerun, bundle shell syntax and existing env input. Before-project snapshot at `/private/tmp/T3-rntester-project-before.pbxproj`. This did not modify Git.
6. `ruby /private/tmp/T3-rntester-podfile-check.rb` with gem env — passed for unset/1/0 core env: default iOS targets preserved; source mode adds visionOS; correct platforms; five extra dependencies; OCMock unchanged; source mode visible before first target. Uses actual CocoaPods Podfile DSL with local `use_react_native!`/prepare stubs and intercepted cmake lookup; no installation/codegen/network. Repeated DSL evaluation in one process produced harmless constant-redefinition warnings for upstream USE_FRAMEWORKS.
7. Swift parser checks below — both exit0. Syntax only; not full module import/typecheck or link:

```sh
xcrun --sdk xrsimulator swiftc -parse -target arm64-apple-xros1.0-simulator packages/rn-tester/RNTester-visionOS/App.swift packages/rn-tester/RNTester-visionOS/AppDelegate.swift
xcrun --sdk iphonesimulator swiftc -parse -target arm64-apple-ios15.1-simulator packages/rn-tester/RNTester-visionOS/App.swift packages/rn-tester/RNTester-visionOS/AppDelegate.swift
```

8. Asset compilation:

```sh
mkdir -p /private/tmp/T3-rntester-assets
xcrun actool --compile /private/tmp/T3-rntester-assets --platform xrsimulator --minimum-deployment-target 1.0 --target-device vision --app-icon AppIcon --output-partial-info-plist /private/tmp/T3-rntester-assets-info.plist packages/rn-tester/RNTester-visionOS/Assets.xcassets
plutil -lint /private/tmp/T3-rntester-assets-info.plist
```

Exit0; created Assets.car and valid partial plist. Simulator-service/log permission warnings appeared, but catalog compilation succeeded.

9. Inline Python temporary-fixture test: copied generator/project/helpers into `/private/tmp/T3-rntester-scheme-*`, removed only fixture's visionOS scheme, reran generator, asserted recreated scheme byte-equal and pbxproj byte-unchanged; cleaned fixture — passed.
10. Reviewed all three extra native directories. Screenshot uses RCTKeyWindow (T2's focused-window path), UIGraphicsImageRenderer, drawViewHierarchyInRect and supported UIImage functions. Color overlays/legacy view use ordinary UIView/UIColor APIs; brightness is a color component, not a display API. NativeCxxModuleExample is pure C++ with no UIKit APIs. No additional platform guard required. Actual source syntax checks:

```sh
xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -std=c++20 -target arm64-apple-xros1.0-simulator -I /private/tmp/t2-apis-swift-check/headers -I packages/react-native/ReactCommon/yoga packages/rn-tester/NativeComponentExample/ios/RNTMyNativeViewCommon.mm packages/rn-tester/NativeComponentExample/ios/RNTLegacyView.mm packages/rn-tester/NativeModuleExample/Screenshot.mm
xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-xros1.0-simulator -I /private/tmp/t2-apis-swift-check/headers -I packages/react-native/ReactCommon/yoga packages/rn-tester/NativeComponentExample/ios/RCTInteropTestView.m
```

Both exit0, actual RN headers via T2's symlink staging plus SDK. Initial combined command incorrectly passed `-std=c++20` to the .m source and failed; separated languages then passed. No app compilation/link. Full generated Fabric/Cxx sample headers remain T4 codegen/build work.
11. Evaluated five actual podspecs offline:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 RCT_USE_RN_DEP=0 RCT_USE_PREBUILT_RNCORE=0 ruby -r/private/tmp/T2-build-pod-preload.rb -e 'ARGV.each { |path| s = Pod::Specification.from_file(path); raise "Missing visionOS" unless s.available_platforms.any? { |p| p.name == :visionos && p.deployment_target.to_s == "1.0" }; puts "PASS: #{s.name} #{s.available_platforms.map(&:to_s).join(", ")}" }' packages/rn-tester/NativeModuleExample/ScreenshotManager.podspec packages/rn-tester/NativeComponentExample/MyNativeView.podspec packages/rn-tester/NativeCxxModuleExample/NativeCxxModuleExample.podspec packages/react-native/ReactCommon/react/nativemodule/samples/ReactCommon-Samples.podspec packages/react-native/Libraries/PushNotificationIOS/React-RCTPushNotification.podspec
```

All PASS, iOS15.1/visionOS1.0. Preloader requires CocoaPods and repository react_native_pods.rb only. Environment disables artifact setup for evaluation; does not change production Podfile binary policy.
12. `git diff --check -- packages/rn-tester/Podfile packages/rn-tester/README.md packages/rn-tester/RNTester-visionOS packages/rn-tester/scripts/add-visionos-target.rb packages/rn-tester/RNTesterPods.xcodeproj` — exit0.

## Autolinking fixture and Jest resolver checks


All commands ran from repository root; no network, Git writes, node_modules writes, dependency installs, pod installs, or app builds occurred.

- `node /private/tmp/T3-apps-fixtures-check.js`: passed. Uses installed `@react-native-community/cli-config.loadConfigAsync` on actual RNTester; both fixtures resolve a real podspec for `ios` and `visionos`; confirms old root manifest absent, synthetic peer unchanged, Apple -> Common dependency intact. Uses actual Jest default resolver on both `react-native/src/private/assets/AssetRegistry` and `react-native-mindzone-visionos/src/private/assets/AssetRegistry`, pointing temporary aliases outside node_modules to the real fork source; both resolve the same file. Temporary links are removed in `finally`.
- `node node_modules/jest/bin/jest.js packages/jest-preset/jest/__tests__/setup-test.js --runInBand --watchman=false`: passed, 1 suite / 1 test (`NativeExceptionsManager is a mock`).
- `node node_modules/eslint/bin/eslint.js packages/jest-preset/jest/resolver.js packages/react-native-test-library/apple/react-native.config.js packages/react-native-test-library/common/react-native.config.js --max-warnings 0`: passed, exit 0, no warnings.
- `node node_modules/prettier/bin/prettier.cjs --check packages/jest-preset/jest/resolver.js packages/react-native-test-library/apple/react-native.config.js packages/react-native-test-library/common/react-native.config.js`: passed, all matched files use Prettier code style. Called direct local binary, not root writing script.
- `ruby -c packages/react-native-test-library/apple/TestLibraryApple.podspec`: passed, Syntax OK.
- `ruby -c packages/react-native-test-library/common/TestLibraryCommon.podspec`: passed, Syntax OK.
- `git diff -- packages/jest-preset/jest/resolver.js packages/react-native-test-library/apple/react-native.config.js packages/react-native-test-library/common/react-native.config.js`: read-only review confirms three minimal additions; no other owned source changes.
- Preliminary inline smoke attempts failed because the CLI returned a symlinked workspace podspec path rather than its realpath, and the first chosen private source path did not exist in 0.88. Corrected the verification harness to compare `realpathSync` and use actual `src/private/assets/AssetRegistry.js`; no source changes were needed for those harness corrections.

## Template checks


All commands ran from repository root unless stated. Verification fixtures/logs live under `/private/tmp/T3-template-*`.

- `xcodebuild -list -project packages/visionos-template/template/visionos/HelloWorld.xcodeproj` and the equivalent `ios` project: **exit 0**, app/test targets and HelloWorld scheme listed. Rerun after final project resource fix, logs `/private/tmp/T3-template-{visionos,ios}-xcode-list.log`. Sandbox warns that simulator services/log directories are unavailable; this is project parsing, not a simulator/build result.
- Equivalent `xcodebuild -list` calls on `/private/tmp/T3-template-generated/{visionos,ios}/MyApp.xcodeproj`: **exit 0** after actual Community CLI placeholder renaming of the packed template. Logs `T3-template-generated-{visionos,ios}-xcode-list.log`.
- Python traversal executing `plutil -lint` for every `.plist`, `.xcprivacy`, and `project.pbxproj`: **8/8 passed**. Both final pbxproj files rechecked after privacy change.
- `ruby -c packages/visionos-template/template/{Gemfile,visionos/Podfile,ios/Podfile}` (one call per file): **3/3 Syntax OK**.
- `GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec ruby -r xcodeproj /private/tmp/T3-template-projects.rb`: **passed**, used installed Xcodeproj to reconcile new project configurations. Follow-up Xcodeproj traversal verified all source/resource references exist, actual app privacy resource membership and target IDs.
- `GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec ruby -e 'require "cocoapods"; require "xcodeproj"; puts "Ruby #{RUBY_VERSION}; CocoaPods #{Pod::VERSION}; Xcodeproj #{Xcodeproj::VERSION}"'`: **Ruby 4.0.7, CocoaPods 1.16.2, Xcodeproj 1.27.0**. Plain Ruby initially could not load xcodeproj until the installed GEM_HOME was supplied.
- `node -r /private/tmp/T3-template-alias.cjs node_modules/jest/bin/jest.js --config packages/visionos-template/template/jest.config.js --runInBand --watchman=false --cacheDirectory=/private/tmp/T3-template-jest-cache`: **1 suite/1 test passed**. Fixture intercepts Node resolution of the absent installed direct fork name to local `packages/react-native`; it does not install/edit dependencies. Final test has no SafeAreaView warning.
- `node node_modules/typescript/bin/tsc -p packages/visionos-template/template/tsconfig.json --noEmit`: **exit 2**, only missing `@types/react-test-renderer` in the current installed repo. Template explicitly declares ^19.1.0. `node node_modules/typescript/bin/tsc -p /private/tmp/T3-template-app-tsconfig.json --noEmit`: **passed**, checks actual App.tsx with the template config and existing repo type roots; excludes tests only because of that absent dependency.
- `node node_modules/eslint/bin/eslint.js packages/visionos-template --max-warnings 0`: **passed**. Initial errors were missing monorepo Flow annotations/import order; fixed all new JS to @noflow and sorted imports. No foreign files formatted.
- `node node_modules/prettier/bin/prettier.cjs --check 'packages/visionos-template/**/*.{js,ts,tsx,md,json}'`: **passed**.
- `xcrun --sdk xrsimulator swiftc -frontend -parse -target arm64-apple-xros1.0-simulator packages/visionos-template/template/visionos/HelloWorld/App.swift packages/visionos-template/template/visionos/HelloWorld/AppDelegate.swift`: **passed**, repeated after labeled URL fix. Initial parse omitted the target and warned of host targeting; corrected command above selects visionOS.
- `xcrun --sdk iphonesimulator swiftc -frontend -parse -target arm64-apple-ios15.1-simulator packages/visionos-template/template/ios/HelloWorld/AppDelegate.swift packages/visionos-template/template/ios/HelloWorld/SceneDelegate.swift`: **passed**.
- `xcrun --sdk xrsimulator clang -fsyntax-only -fobjc-arc -fblocks -target arm64-apple-xros1.0-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -F /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/Library/Frameworks packages/visionos-template/template/visionos/HelloWorldTests/HelloWorldTests.m`: **passed against real UIKit/XCTest**, no stubs.
- `node -r /private/tmp/T3-template-alias.cjs /private/tmp/T3-template-metro-check.cjs`: **passed**, actual Metro 0.87.1 bundle with platform ios and platformExtension=visionos. Harness adds the local fork via extraNodeModules (installed name absent), watches existing repo, uses one worker/no Watchman/no cache store, and asserts all react-native/direct-fork resolutions physically target `packages/react-native`. Output `/private/tmp/T3-template-ios-platform-visionos.bundle.js`.
- `BABEL_DISABLE_CACHE=1 npm pack ./packages/visionos-template --ignore-scripts --offline --json --cache /private/tmp/T3-template-npm-cache --pack-destination /private/tmp`: **passed**, final archive `/private/tmp/react-native-mindzone-visionos-template-0.88.0.tgz`, metadata `/private/tmp/T3-template-pack-final.json`; **81 files, no node_modules content**, underscore dotfiles, schemes, gradle wrapper JAR/keystore and executable mode verified.
- `node -r /private/tmp/T3-template-alias.cjs /private/tmp/T3-template-cli-check.cjs`: **passed**; actual CLI config detects direct fork path, ios/visionos projects and run-visionos/build-visionos/run-ios/run-android/start/bundle commands. Actual CLI `changePlaceholderInTemplate` on extracted archive produces MyApp native projects/class names/registered module, Android package folders and renamed dotfiles. This uses installed local tooling, not `init` network/package installation.
- `git check-ignore` on both new scheme paths, Gradle wrapper JAR and debug keystore: no matches. All intended new template files can be included without modifying root ignore rules.

Verification incident: Babel registration during offline verification implicitly wrote one new cache at `packages/visionos-template/template/node_modules/.cache/@babel/register/.babel.7.28.0.development.json`. The first known cache-capable invocation after the earlier clean 81-file pack was `node -r /private/tmp/T3-template-alias.cjs /private/tmp/T3-template-cli-check.cjs` (which changes cwd into the template); `node -r /private/tmp/T3-template-alias.cjs /private/tmp/T3-template-metro-check.cjs` also ran before discovery. The next pack listed 82 files, exposing the cache; the exact producing invocation was not instrumented. I verified it was the only file in that newly created directory and removed that self-created cache/directory; no pre-existing node_modules file was modified. Final CLI placeholder checks were rerun from the final 81-file archive and Jest passed 1/1 again, both with `BABEL_DISABLE_CACHE=1`. Subsequent cache-capable checks use `BABEL_DISABLE_CACHE=1`; final archive explicitly excludes all nested dependency/cache contents. This is recorded rather than claiming zero implicit node_modules writes.


Additional final template asset check: `xcrun actool --compile /private/tmp/T3-template-assets --platform xrsimulator --minimum-deployment-target 1.0 --target-device vision --app-icon AppIcon --output-partial-info-plist /private/tmp/T3-template-assets-info.plist packages/visionos-template/template/visionos/HelloWorld/Images.xcassets` — **exit 0**, Assets.car produced. `plutil -lint /private/tmp/T3-template-assets-info.plist` — OK. Log `/private/tmp/T3-template-actool.log` contains the same sandbox CoreSimulator-service warnings as RNTester; this confirms resource compilation only, not app launch. Final Python traversal parsed all template JSON and confirmed no nested node_modules directory remained.

## Final review and open risks

- An independent sub-agent reviewed template startup, projects, runtime identity, packaging and fixture compatibility. Its privacy-resource finding was fixed and rechecked; no remaining material source finding. The review also identified the out-of-ownership HelloWorld E2E request.
- T4 must install pods/codegen/provider outputs and compile/link/run RNTester and the generated template for xrsimulator, then verify an iOS build. Validate secondary-window open/update/close/focus/resizing, immersive success/cancel/failure/end/reopen, cold/warm links and actual accessibility smoke execution. Neither parser checks nor JavaScript mocks establish these behaviors.
- Empty RNTester immersive content matches both references. The visionOS Swift delegate also retains the reference limitation that it does not reproduce current iOS SceneDelegate's manual NativeCxxModuleExample/FlexibleSize/UpdateProperties example registrations. Their optional JS lookups do not establish those unrelated examples are usable; T4 should record them separately. No iOS native startup changed.
- Source-context/factory integration uses T2's existing APIs; full Swift Observation/module linkage has not been verified by a native build. The deployment floor is a shared declaration, not proof on visionOS 1.0 hardware/runtime.
- Native template tests have valid target/scheme/scene lookup and syntax checks but have not run. Android Gradle/SDK configuration follows current 0.88 source but was not built or downloaded.
- Full template TypeScript including the test file is blocked by the currently absent installed `@types/react-test-renderer`; it is declared in the new template. App.tsx alone passes. No dependency install was permitted/performed.
- Offline pack, CLI substitution, alias-fixture bundling and discovery passed; real package-manager installation from the packed template and published package availability remain unverified. T2's repository URL is still an owner-confirmation placeholder.
- The scheme-ignore and local E2E override requests remain outside this task's ownership. All owned implementation is present locally; the orchestrator must retain the ignored shared scheme when committing.
- No screenshots are supplied because no app was built/launched. No `pod install --verbose`, Xcode app build, simulator execution, signing, push or publish was run.
