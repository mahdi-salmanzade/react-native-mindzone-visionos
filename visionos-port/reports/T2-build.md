# T2-build report

Implemented the build, package, CLI, codegen, release and CI port against the local ReactVision 0.86.4 and Callstack 0.79.6 references. ReactVision was preferred where the ports differed. The upstream base remains React Native 0.88.0. All work was offline; no publishing or full CocoaPods/Xcode app build was attempted.

**Integration remains:** RNTester/template integration belongs to T3 and native builds belong to T4. The requested native status-bar guards and API split-target imports were applied by their owners; the matching source SwiftPM manifest change is complete. The repository/homepage/bugs URLs use the explicitly requested `https://github.com/mindzone/react-native-mindzone-visionos` placeholder, which the owner must confirm.

**Constraint violation during verification:** the existing `setup-apple-spm-test.js` suite was run twice before noticing that three cases create Git fixture repositories. Across those runs it created six temporary repositories, each with `git init`, two `git config` commands, `git add -A`, and `git commit -m init`. These were under `/var/folders/q9/m01f6xm160v_876_2rlfrqbc0000gn/T/spm-safegate-*`; the fixture cleanup removed them and a subsequent scan found none. Random suffixes were not logged. This violated the instruction against any Git writes. This checkout's Git index/history/refs were not written, and no tags, branches, pushes or publishes were performed here. Further runs of those fixture cases were stopped.

## Item-by-item status

`RN` below means `packages/react-native`. “Done” describes implementation or a confirmed disposition, not a successful app build.

| ID | Status | Files | Notes |
| --- | --- | --- | --- |
| B-01 | done | RN/package.json | Exact fork name/version; public publish config; upstream version 0.88.0; requested placeholder metadata. Existing Hermes compiler version retained. |
| B-02 | done | RN/package.json; RN/scripts/prepack.js call chain | Ships local-cli, visionos_modules, source Package.swift and its ios-prebuild helpers; existing Libraries/React globs include Swift/API/generated spec files; packed file set inspected against RV. |
| B-03 | done | RN/cli.js; RN/package.json, unchanged bin | Confirmed existing react-native executable delegates to Community CLI; no replacement executable. |
| B-04 | done | RN/react-native.config.js; RN/local-cli/**; packages/community-cli-plugin/src/commands/{codegen,spm}.js | Apple CLI run/build/log factories, optional independent resolution, alias-aware platform identity, retained 0.88 command metadata and fork-local codegen/SPM dispatch. |
| B-05 | done | RN/scripts/{react_native_pods.rb,cocoapods/helpers.rb} | Shared visionOS 1.0 floor; unchanged iOS 15.1. Source podspecs inherit map. |
| B-06 | done | RN/React-Core.podspec | visionOS-scoped XR/window header subspecs and separate generated spec exclusion. |
| B-07 | done | RN/React.podspec; RN/scripts/react_native_pods.rb | Four API/spec pods installed only on visionOS; scoped umbrella dependencies and modular headers. |
| B-08 | done | RN/scripts/react_native_pods.rb | Confirmed source fmt already uses modular headers; no fmt-specific edit. |
| B-09 | done | RN/scripts/cocoapods/utils.rb | All four new first-party pods listed for header search-path handling. |
| B-10 | done | RN/scripts/cocoapods/autolinking.rb | visionOS uses installation_root for manifest and relative paths; iOS root selection unchanged. |
| B-11 | done | RN/package.json; RN/scripts/cocoapods/new_architecture.rb; RN/scripts/react_native_pods.rb; RN/React-Core-prebuilt.podspec; RN/third-party-podspecs/ReactNativeDependencies.podspec | Artifact setup and replacement phases use upstream version with package-version fallback; pod identity remains fork version. |
| B-12 | done | RN/scripts/cocoapods/rncore.rb; RN/scripts/react_native_pods.rb; RN/React-Core-prebuilt.podspec; READMEs | User-permitted explicit env policy: require RCT_USE_PREBUILT_RNCORE=0 before first target, reject cached prebuilt mode/local core override. RNDeps/Hermes prebuilds retained. |
| B-13 | done | RN/scripts/cocoapods/rndeps_facades.rb; RN/scripts/react_native_pods.rb | Seven dependency facades generated from shared platform map. Core facade path remains iOS-only and cannot be selected on visionOS. |
| B-14 | done | RN/sdks/hermes-engine/** | Confirmed upstream visionos1.0, xros/universal hermesvm mappings, XROS_DEPLOYMENT_TARGET and xros dummy-framework support. No forced source-Hermes policy. |
| B-15 | done | RN/sdks/hermes-engine/hermes-engine.podspec | SDK-conditioned source output uses actual build/$(PLATFORM_NAME)/lib/hermesvm.framework/hermesvm; preserves legacy iOS declaration. |
| B-16 | done | RN/sdks/hermes-engine/utils/build-hermesc-xcode.sh | Quoted CMake version check >=3.28 only on xros/xrsimulator, before host SDK reset. |
| B-17 | done | RN/scripts/react-native-xcode.sh | Adds resolver option only for xros/xrsimulator; bundle platform stays ios. |
| B-18 | done | RN/package.json; RN/scripts/codegen/generate-artifacts-executor/index.js | Separate module library; Android filter before schema parsing, including all-platform generation. |
| B-19 | done | RN/scripts/codegen/generate-artifacts-executor/{constants,generateFBReactNativeSpecIOS,generateNativeCode}.js | Optional second core generation through existing prepack hook; dedicated output mapping/skip logic; actual files regenerated. |
| B-20 | done | RN/scripts/codegen/generate-artifacts-executor/utils.js | Both discovery paths inspect resolved package identity, skip coinstalled upstream duplicate core, retain npm alias and unrelated libraries. |
| B-21 | done, native build unverified | RN/Package.swift; RN/scripts/spm/visionos/ReactVisionOS.swift | Source graph and conditional visionOS aggregate added; final manifest evaluation passed. T2-native applied destination guards and T2-apis applied Swift/ObjC imports. No source build claimed. |
| B-22 | done, binary path explicitly unsupported | RN/scripts/setup-apple-spm.js; RN/scripts/spm/**; RN/scripts/codegen/templates/Package.swift*; CLI adapters | Explicit visionOS selection, platform-aware generated manifests/config; binary consumer rejects missing xros core before downloads/migration. Source graph compilation remains a T4 check. |
| B-23 | done | RN/scripts/ios-prebuild/{cli,types,setup}.js | Opt-in visionOS device/simulator destinations; default iOS/Catalyst set retained. No xros archive produced. |
| B-24 | done | .gitignore | Ignores fork tarballs/generated visionOS spec; npm pack includes generated output. |
| B-25 | done, skip confirmed | .gitignore | No obsolete CS .circleci/.yarn cache policy imported. |
| B-26 | done | package.json; yarn.lock | Adds only root react-native link dependency and its lock stanza; tooling versions retained. |
| B-27 | done, obsolete confirmed | jest.config.js, unchanged | Removed legacy mock path does not exist; preserved current specific mappings. |
| B-28 | done | .github/workflows/test-visionos.yml; .github/actions/test-visionos-rntester/action.yml | Separate read-only workflow, cancellation, Debug/Release, SDK validation, source core/prebuilt dependencies, codegen/prepack, generic simulator build and diagnostics/app artifacts. |
| B-29 | done, skip confirmed | Existing upstream workflows/actions unchanged | No historical Ruby patch, repository gating or upstream job suppression imported. |
| B-30 | done; real two-package release awaits T3 | scripts/oot-release.js; scripts/new-github-release-url.js; scripts/monorepo/for-each-package.js; scripts/__tests__/oot-release-test.js | Two-package allowlist; stable/nightly version planning; staged tarballs, contents checks, dry-run, explicit publish flag, fail on missing/failed package. No real publish. |
| B-31 | done, skip confirmed | Existing release workflows unchanged | No upstream bot/release-recovery changes imported. |
| B-32 | done, already-upstream confirmed | scripts/releases/upload-release-assets-for-dotslash.js, unchanged | Existing owner=react/repo=react-native constants already implement migration. |
| B-33 | done, existing config retained | scripts/e2e/verdaccio.yml, unchanged | Existing unscoped wildcard covers fork/template; upstream @react-native handling retained. No local registry or publish run. |
| B-34 | done | README.md; RN/README.md | Alias/direct installation, CLI/Metro configuration, platform identity/APIs, minimum/version policy, source-core env/mixed targets, RNTester and release preparation; factual attribution/MIT notice. |
| B-35 | done, skip confirmed | READMEs/metadata | No reference promotional branding or unsupported integration promises copied. |
| B-36 | done, skip confirmed | Android version literals and unrelated snapshots unchanged | No 0.86 version-only drift imported. |

## Reference choices and deviations

- visionOS **1.0** matches both reference core helpers and upstream 0.88 Hermes. RV's template floor of 26.0 was Viro-specific and does not justify raising this generic fork. This is a declaration, not proof every dependency runs at 1.0; T4 must validate it.
- The references modify some Apple behavior globally. New API pods, autolinking root, deployment settings, bundle resolver and CMake gate are scoped to visionOS here. New core header subspecs expose sources only on visionOS.
- Source-core mode is process-global in 0.88. Rather than silently switching an iOS target, the supported policy requires `RCT_USE_PREBUILT_RNCORE=0` before **any** target in a mixed installation. The early diagnostic rejects late mutation after cached prebuilt initialization. This is the user's explicitly allowed documented-env option. Ordinary iOS installations retain upstream defaults.
- Unlike RV's old policy, working Hermes and ReactNativeDependencies prebuilds are retained. React-Core-prebuilt and core facades deliberately stay iOS-only.
- Source Hermes output declarations follow 0.88's actual `lib/hermesvm.framework` copy source for xros/xrsimulator instead of the reference's always-present simulator output entry. The old nonvision declaration is retained to avoid an unrelated upstream fix.
- Codegen uses the Apple `ios` backend and separately filters the visionOS library out of Android. It does not advertise an unsupported codegen `visionos` backend. Both autolinking-first and fallback discovery are covered.
- Installed command adapters retain 0.88 Community CLI metadata while routing Codegen/SPM to the configured fork. Source plugin edits alone would not ship in this two-package release. Direct-install documentation selects the fork commands explicitly to avoid coinstalled upstream command precedence. Alias installs resolve the platform's package name as react-native.
- SwiftPM adds explicit source targets and separate Swift/Objective-C boundaries. The binary consumer path explicitly refuses visionOS because the supplied React archive lacks xros; adding platform declarations alone would conceal that limitation.
- CI follows RV's separate workflow, preserves all upstream workflows, uses a configurable latest installed stable Xcode rather than the old Xcode15 pin, and checks both xros SDKs at runtime. Hosted runner availability has not been verified offline.
- Release tooling selects the new two-package names, stages version changes, uses no Git operations, and never publishes unless `--publish` is passed. The placeholder repository is not silently used for release creation; a confirmed URL is an explicit optional draft-link input.

## NEW items

| ID | Files | Change and reason |
| --- | --- | --- |
| NEW-1 | RN/scripts/xcode/asset-catalog.sh | visionOS bundles retain platform=ios, so the new upstream asset catalog path incorrectly supplied an iOS deployment version. xros/xrsimulator now pass XROS_DEPLOYMENT_TARGET; other arguments remain unchanged. |
| NEW-2 | RN/sdks/hermes-engine/hermes-engine.podspec; RN/third-party-podspecs/ReactNativeDependencies.podspec | Read the package owning the podspec instead of resolving a potentially coinstalled upstream react-native package. Also fixes the dependency spec's incorrect fallback parent directory. Necessary for the documented direct-install layout. |
| NEW-3 | RN/scripts/cocoapods/utils.rb; RN/scripts/react_native_pods.rb; RN/scripts/cocoapods/__tests__/visionos-test.rb | Post-install handling for visionOS pod/resource/test/app and user targets: minimum XROS deployment target, supported platforms, family 7, no Catalyst. Preserve higher values/build-setting expressions and iOS behavior. References primarily supplied these settings in app projects. |
| NEW-4 | RN/scripts/codegen/generate-artifacts-executor/utils.js | Source SwiftPM/codegen paths now use the executing fork's root rather than a coinstalled upstream react-native package. |
| NEW-5 | RN/scripts/ios-prebuild/setup.js | Header staging adds the XR/window/SwiftExtensions React headers, AppDelegate alias and dedicated generated-spec namespace required by the new source graph; six actual include mappings checked. |
| NEW-6 | RN/scripts/codegen/generate-artifacts-executor/utils.js | Deduplicates core libraries by real path/name when both alias and declared identities refer to the same package; preserves unrelated library conflict handling. |
| NEW-7 | RN/package.json | Ships the source Package.swift and ios-prebuild helpers needed to prepare its header graph in an installed package, extending the reference's publish set for 0.88. |
| NEW-8 | RN/local-cli/coreCommands.js; packages/community-cli-plugin/src/commands/{codegen,spm}.js; RN/react-native.config.js | Routes commands to the selected native root even when upstream is coinstalled, and packages that correction with the fork rather than requiring a separate community-plugin release. |
| NEW-9 | scripts/oot-release.js | Accepts and validates both older npm array and npm12 name-keyed object pack JSON formats; actual offline fixture tarballs exercise the installed npm version. |

## Requests filed

`visionos-port/requests/T2-build.md` contains exact changes and reasons:

1. T2-native: mutually exclusive platform guards around both status-bar implementations, then remove the original stub exclusion in Package.swift. T2-native applied the guards during this task; T2-build then removed the exclusion. The stub additionally retains CocoaPods tvOS/macOS behavior outside SWIFT_PACKAGE.
2. T2-apis: SwiftPM-specific imports for split SwiftExtensions and XR language targets, retaining CocoaPods imports. Observed applied by T2-apis during this task.
3. T3-apps: source-core env before the first Podfile target; RNTester scheme/workspace agreement with CI; Metro resolver option support; template identity/required release files.

Incoming T2-native N-08 and T2-apis A-13/A-16/A-20–22 build requests were read and addressed by the owned bundle/codegen/package/pod changes. No other owner's source files were edited to resolve these requests.

## Checks and results

Verification details are recorded below. Native compilation, simulator launch, full dependency installation and real publication remain outside this task's checks.

### CocoaPods and Ruby

Tools: Ruby 4.0.7; Homebrew CocoaPods 1.16.2. For Ruby tests, use:

```
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec \
GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 \
ruby <test-file>
```

1. `bundle check` and same with CocoaPods GEM_HOME: failed at existing Gemfile `require 'logger'`; bundled pinned gems unavailable. No installation attempted.
2. `ruby -c <file>`: Syntax OK for all 12 touched Ruby/podspec files: autolinking.rb, helpers.rb, new_architecture.rb, rncore.rb, rndeps_facades.rb, utils.rb, react_native_pods.rb, new visionos-test.rb, React-Core.podspec, React.podspec, React-Core-prebuilt.podspec, ReactNativeDependencies.podspec.
3. `ruby packages/react-native/scripts/cocoapods/__tests__/visionos-test.rb` with gem environment above: **7 tests, 34 assertions, 0 failures/errors**. Covers default rejection without iOS env mutation, both mixed source target orders, stale cached prebuilt state, local core override, upstream version fallback, deployment preservation, and platform isolation.
4. `ruby /private/tmp/T2-build-cocoapods-integration.rb` with gem environment: **33 PASS checks** using real CocoaPods objects, temporary local fixtures, and a network prohibition. Validates generated seven RNDeps facades, platform-scoped API graph/header exports, fork 0.88.4/upstream 0.88.0 replacement phases, alias/direct native dependency/RN relative paths and generated manifests, unchanged iOS root selection. Initial harness used CocoaPods `script_phases` getter which failed under Ruby4/CocoaPods; adjusted harness to inspect serialized attributes, not production code. Final exit 0.
5. Exact requested `pod ipc spec <file> | python3 -c 'import json,sys; print(json.load(sys.stdin).get("platforms"))'`, with `RUBYOPT=-r/private/tmp/T2-build-pod-preload.rb RCT_USE_RN_DEP=0 RCT_USE_PREBUILT_RNCORE=0`, for all four changed podspecs and five unchanged samples: **all exit 0**. Preloader contains only `require 'cocoapods'` and absolute require of repository react_native_pods.rb, needed because upstream standalone specs expect Podfile-defined helpers. Bare command initially failed on undefined use_hermes; preload resolves it. Outputs:
   - React-Core, React, ReactNativeDependencies: ios15.1 + visionos1.0.
   - React-Core-prebuilt: ios15.1 only, intentional.
   - Unchanged AppDelegate, RCTSwiftUI, Yoga, boost, React-Fabric: ios15.1 + visionos1.0.
   Full output: `/private/tmp/T2-build-pod-ipc.log`.
6. Ran **every existing** `packages/react-native/scripts/cocoapods/__tests__/*-test.rb` individually using installed gem environment. Compared each with identical commands on read-only `git archive base/upstream-v0.88.0` extracted to `/private/tmp/T2-build-ruby-baseline-rpgekib9` (scripts, sdks, package.json). Existing test/assertion/failure/error counts **all identical to base**:

| Test | Tests/assertions | Failures/errors | Outcome |
| --- | --- | --- | --- |
| codegen_utils | 9 / 25 | 0 / 0 | pass |
| fabric | 1 / 0 | 0 / 1 | existing missing rncore_pod helper |
| jsengine | 1 / 0 | 0 / 1 | existing nil installation_root |
| local_podspec_patch | 5 / 11 | 0 / 0 | pass |
| maven_mirror_flag | 3 / 6 | 0 / 0 | pass |
| new_architecture | 10 / 9 | 2 / 4 | existing expected config drift, Ruby4 Pathname/mock argument errors |
| rndependencies | 6 / 7 | 0 / 0 | pass |
| spm | 3 / 0 | 0 / 3 | existing InstallerStub lacks aggregate_targets |
| utils | 64 / 149 | 1 / 13 | existing expected config drift/missing ReactNativeCoreUtils |

   Logs: `/private/tmp/T2-build-<test-name>.log`, `/private/tmp/T2-build-baseline-<test-name>.log`. An aggregate runner additionally fails because global PodMock::Executable is a Class while loaded CocoaPods expects Module; no unrelated test/mock changes made. Initial bare `ruby -e 'require "test/unit"; puts RUBY_VERSION'` auto-discovered tests and exposed these pre-existing harness/snapshot failures; subsequent commands deliberately selected files.
7. `git diff --check -- packages/react-native/scripts/cocoapods packages/react-native/scripts/react_native_pods.rb packages/react-native/React-Core.podspec packages/react-native/React.podspec packages/react-native/React-Core-prebuilt.podspec packages/react-native/third-party-podspecs/ReactNativeDependencies.podspec`: pass.

### Codegen, SwiftPM and prebuild

- `node node_modules/jest/bin/jest.js packages/react-native/scripts/codegen/__tests__/visionos-codegen-test.js --runInBand --watchman=false` — initial5 tests passed (actual android/all generation, direct/alias/autolinking/fallback discovery).
- `node node_modules/jest/bin/jest.js packages/react-native/scripts/codegen/__tests__ packages/react-native/scripts/spm/__tests__/setup-apple-spm-test.js packages/react-native/scripts/spm/__tests__/generate-spm-autolinking-test.js packages/react-native/scripts/spm/__tests__/generate-spm-autolinking-config-test.js --runInBand --watchman=false --silent > /private/tmp/T2-build-codegen-spm-tests.log 2>&1` — **213 tests +24 snapshots passed**, but **1 suite failed /5 passed** because unchanged upstream cleanup uses `fs.rmdirSync(outputDir, {recursive:true})`, removed by Node26. Generated fixture temp dirs were then removed with Python (`test-app/temp`, `test-app-legacy/temp`). This run includes the first git-writing fixture incident above.
- `node node_modules/jest/bin/jest.js packages/react-native/scripts/codegen/__tests__/visionos-codegen-test.js packages/react-native/scripts/spm/__tests__ --runInBand --watchman=false --silent > /private/tmp/T2-build-spm-all-tests.log 2>&1` — **23 suites /1014 tests passed** (6 new codegen tests,3 new SPM tests included). This run includes the second git-writing fixture incident above. No later setup-suite rerun.
- Initial `swift package --package-path packages/react-native --cache-path /private/tmp/T2-build-swift-cache --scratch-path /private/tmp/T2-build-swift-scratch --disable-sandbox dump-package > /private/tmp/T2-build-Package.json` — failed because default Clang module cache under `/Users/intzero/.cache` is not writable.
- `CLANG_MODULE_CACHE_PATH=/private/tmp/T2-build-clang-cache SWIFTPM_MODULECACHE_OVERRIDE=/private/tmp/T2-build-swift-module-cache swift package --package-path packages/react-native --cache-path /private/tmp/T2-build-swift-cache --scratch-path /private/tmp/T2-build-swift-scratch --disable-sandbox dump-package > /private/tmp/T2-build-Package.json` — passed. JSON confirms visionos1.0/ios15.0/maccatalyst13.0 and the `RCTSwiftExtensions` aggregate dependency conditional on visionos. User cache warnings only. This parses the manifest; it is not a native build.
- `node -e "require('./packages/react-native/scripts/ios-prebuild/cli').getCLIConfiguration().then(x=>console.log(JSON.stringify(x.destinations)))"` — outputs unchanged `["iOS","iOS Simulator","macOS,variant=Mac Catalyst"]`.
- A first `node -e ... -- --platforms visionos visionos-simulator` invocation incorrectly forwarded argv for yargs and returned defaults; corrected check below.
- `node -e "process.argv=['node','cli','--platforms','visionos','visionos-simulator']; require('./packages/react-native/scripts/ios-prebuild/cli').getCLIConfiguration().then(x=>console.log(JSON.stringify(x.destinations)))"` — outputs `["visionOS","visionOS Simulator"]`.
- Inline Node harness invoked `createHeaderLinker` on actual XR/WindowManager/SwiftExtensions/AppDelegate/generated visionOS spec folders into `/private/tmp/T2-build-source-headers-*`, asserted six expected paths, then removed staging — passed.
- Scoped format/lint/syntax: file list in `/private/tmp/T2-build-codegen-js-files.json` (18 files). Python invoked `node node_modules/prettier/bin/prettier.cjs --write <18 paths>`, `node node_modules/eslint/bin/eslint.js --max-warnings 0 <18 paths>`; initial lint found2 sortable-import warnings, fixed with `node node_modules/eslint/bin/eslint.js --fix packages/react-native/scripts/setup-apple-spm.js packages/react-native/scripts/spm/__tests__/visionos-spm-test.js`. Final ESLint max-warnings0, Prettier --check and node --check on each18 files — all passed. No global formatter ran from this worker.
- `git diff --check -- packages/react-native/Package.swift packages/react-native/scripts/codegen packages/react-native/scripts/ios-prebuild packages/react-native/scripts/spm packages/react-native/scripts/setup-apple-spm.js` — passed. All git commands explicitly invoked by this worker outside the fixture incident were read-only status/diff/ls-files.

Actual main and visionOS core specs were generated with:

```sh
node -e "require('./packages/react-native/scripts/codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS').generateFBReactNativeSpecIOS('./packages/react-native')"
```

The generated visionOS header and implementation are nested under `React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS/`; the JSI header is in the parent output directory. They were generated from the current specs, not copied from either reference.

During final review, the original status-bar stub exclusion was temporarily retained pending native guards. T2-native then applied the guards and the final manifest includes both implementations. The binary SwiftPM diagnostic was also tightened to recommend the supported CocoaPods source-core command. The focused `visionos-spm-test.js` suite then passed 3 tests; scoped ESLint and Prettier on `spm/apple-platform.js` passed.

The same cache-overridden `swift package ... dump-package` command was rerun after the final manifest adjustment, writing `/private/tmp/T2-build-Package-final.json`: passed, with only unavailable user-cache warnings.

### Bundling, Hermes and CI

- `bash -n packages/react-native/scripts/react-native-xcode.sh packages/react-native/scripts/xcode/asset-catalog.sh packages/react-native/sdks/hermes-engine/utils/build-hermesc-xcode.sh`: passed.
- `ruby -c packages/react-native/sdks/hermes-engine/hermes-engine.podspec`: Syntax OK.
- From `packages/react-native`, `RCT_BUILD_HERMES_FROM_SOURCE=true pod ipc spec --silent sdks/hermes-engine/hermes-engine.podspec | python3 -c 'import json,sys; print(json.load(sys.stdin).get("platforms"))'`: passed; osx10.13, ios15.1, visionos1.0, tvos15.1. Uses the local pinned Hermes tag without downloading it.
- Same `pod ipc spec` command with `HERMES_ENGINE_TARBALL_PATH=/private/tmp/T2-build-checks/hermes-placeholder.tar.gz`: passed with the same platforms; serialized prebuilt subspec points at universal/hermesvm.xcframework for visionOS. The empty temporary file exercises podspec source selection only, not archive validity/download/extraction.
- `python3 /private/tmp/T2-build-checks/shell_checks.py`: passed 17 cases: 8 CMake version/platform cases (including an executable path with spaces), 5 actual bundling-script invocations with a local fake bundler, 4 asset-catalog deployment cases with a stubbed compiler. Verified xros/xrsimulator resolver flag, ios bundle platform, no changed iOS/macOS args, output copying, xros source CMake>=3.28 and unchanged iOS gate.
- Node `yaml.parseDocument` for both new GitHub YAML files: passed, including Debug/Release matrix, read-only permissions and explicit Bash shells. Extracted composite-action scripts passed `bash -n`.
- `node node_modules/prettier/bin/prettier.cjs --check .github/actions/test-visionos-rntester/action.yml .github/workflows/test-visionos.yml`: passed.
- `git diff --check`: passed. Final scoped check across all T2-build-owned changed paths also passed after review.
- `cmp README.md packages/react-native/README.md`: passed; published README matches the authoritative root README.
- Read-only second-agent review of all parent-owned code and CI: no material correction identified.

Initial validation failures corrected or bounded: one syntax command used repo-root-relative paths while cwd was the RN package; rerun from root passed. Initial Hermes podspec evaluation exposed that CocoaPods has no pod_target_xcconfig getter; changed to its supported attributes_hash representation and reevaluated successfully. `xcrun actool --help` was unsupported and reported a sandbox CoreSimulator connection failure; consulted installed actool manpage and used mocked argument checks instead. No actool compilation or app build is claimed.

### Package, CLI and release


Final meaningful checks:

1. `node_modules/.bin/jest scripts/__tests__/oot-release-test.js packages/react-native/local-cli/__tests__/localCommands-test.js packages/community-cli-plugin/src/commands/__tests__/appleRouting-test.js --runInBand --watchman=false` — **3 suites, 16 tests passed**. Includes real installed Apple CLI factory construction; optional Apple/iOS routing; alias/direct specifier resolution; configured native-root Codegen/SPM dispatch with visionOS args; release allowlist/base/semver policy; no-operation dry run; stable/nightly dependency alignment; actual offline two-package fixture packing with executable mode/nested manifest inspection; missing-file gate before any publication; simulated second-publication failure. Publish tests intercept `npm publish` and never execute it. No test invokes git.
2. `node_modules/.bin/eslint scripts/oot-release.js scripts/new-github-release-url.js scripts/monorepo/for-each-package.js scripts/__tests__/oot-release-test.js packages/react-native/react-native.config.js packages/react-native/local-cli packages/community-cli-plugin/src/commands/spm.js packages/community-cli-plugin/src/commands/codegen.js packages/community-cli-plugin/src/commands/__tests__/appleRouting-test.js --max-warnings 0` — **passed**.
3. `node_modules/.bin/prettier --check README.md packages/react-native/README.md packages/react-native/package.json package.json packages/react-native/react-native.config.js scripts/oot-release.js scripts/new-github-release-url.js scripts/monorepo/for-each-package.js scripts/__tests__/oot-release-test.js packages/react-native/local-cli packages/community-cli-plugin/src/commands/codegen.js packages/community-cli-plugin/src/commands/spm.js packages/community-cli-plugin/src/commands/__tests__/appleRouting-test.js` — **passed**. Used direct binaries, never root `yarn prettier` script.
4. From `packages/react-native`: `npm pack --dry-run --json --ignore-scripts --offline --cache /private/tmp/mindzone-pack-cache > /private/tmp/T2-build-pack-list.json` — **passed**; inspected manifest list. Then `npm pack --json --ignore-scripts --offline --cache /private/tmp/mindzone-pack-cache --pack-destination /private/tmp/T2-build-packed > /private/tmp/T2-build-packed/result.json` — **passed**, actual core tarball created. Final repetition captures parent's last SwiftPM source/diagnostic adjustments. Archive path `/private/tmp/T2-build-packed/react-native-mindzone-visionos-0.88.0.tgz`.
5. Used `tar -tzf`, `tar -xOf <archive> package/package.json`, and `tar -tvf <archive> package/cli.js`, with release `validateContents` and additional assertions — **passed** before final parent-only source repack; final archive revalidated afterwards. Coverage: Swift/XR/window sources, nested generated .h/.mm and top-level JSI, local CLI adapters, both type surfaces, Package.swift/prebuild helpers, correct bin and executable permissions. 4,581 files at prior inspection (final size recorded below).
6. `node packages/react-native/cli.js --help` — **passed**, shows run/build/log-visionos and retained Codegen/SPM. `node packages/react-native/cli.js spm --help` — **passed**, exposes `--platform`.
7. `node /private/tmp/T2-build-coinstall-check.js` — **passed**. A temporary app configuration supplies explicit dependency roots for a fake upstream package and this fork, invokes real Community CLI `loadConfig`, and confirms documented explicit command configuration selects fork Codegen/SPM/run/build implementations. No node_modules tree or dependency install used.
8. Isolated Python fixture invoked `yarn install --offline --ignore-scripts --ignore-engines --modules-folder ./modules` with only the local RN link — **passed**; generated lock entry matches the sole B26 root lock addition. Temporary fixture removed; no repo install/network/node_modules edits.
9. `node --check` for `scripts/{oot-release,new-github-release-url,monorepo/for-each-package}.js`, `packages/react-native/react-native.config.js`, and `local-cli/{localCommands,coreCommands,resolvePackageName}.js` — **passed**. Flow source plugin files parsed by ESLint/Jest.
10. `node scripts/oot-release.js --new-version 0.88.0 --dry-run` — expected **exit 1**, `Missing release packages: react-native-mindzone-visionos-template`. Refuses partial production releases until T3 supplies template. No scripts/packing/publishing executed in this dry run.
11. `git check-ignore packages/react-native/example.tgz packages/react-native/React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOSJSI.h` — **both ignored**. Read-only `git diff --check` over owned tracked changes — **passed**. LICENSE diff empty; `rg 'Copyright|Meta' LICENSE packages/react-native/LICENSE` confirms retained notices. Node identity assertions confirm name/version/bin/Hermes value and absence of old Jest mock.

Initial validation failures were fixed and rerun: npm 12 pack result shape; nightly tag prefix parsing; one test-only relative import typo; ESLint import ordering warnings. An exploratory coinstall check first used a nonexistent named `loadConfig` export, then referential function equality across config loader reloads; corrected to the real default API and implementation comparison. An extra archive assertion initially used `scripts/spm/ReactVisionOS.swift` instead of actual `scripts/spm/visionos/ReactVisionOS.swift`; corrected assertion passes. These were verification harness issues, not hidden passing claims.

Final core archive: `/private/tmp/T2-build-packed/react-native-mindzone-visionos-0.88.0.tgz` — **4,581 files, 4,262,797 bytes**. Repacked after the final coordinated native guards/SwiftPM manifest edits and revalidated, including archived source guards and manifest contents. This is a core-only archive, not a completed two-package release.

## Open risks

- B-21 source wiring and cross-owner guards/imports are implemented, but SwiftPM must still compile and link for xros in T4. Manifest evaluation and header staging do not prove native compilation, module retention or runtime registration.
- T3 must provide the RNTester visionOS scheme/target and template. Full real two-package release preparation cannot succeed without the template; failing early is intentional.
- T4 must run actual pod installation, mixed-target integration, source core with prebuilt RNDeps/Hermes, source-Hermes fallback if required, template/RNTester builds, simulator launch and iOS regression builds.
- The 1.0 deployment floor, SDK-specific source-Hermes output tracking and Swift/Objective-C SwiftPM boundaries need toolchain/build confirmation.
- Hosted CI and downloads were not run. The workflow validates the installed SDKs but cannot guarantee future runner/Xcode availability.
- Available Ruby4/CocoaPods1.16.2 differs from the unavailable bundled gem setup; existing Ruby failures matched baseline. Existing JS test cleanup also has a Node26 compatibility failure, detailed above.
- Source package copyright/license was retained. Placeholder remote URLs must be confirmed before release. The preinstall-resolved Hermes compiler line was left unchanged.
