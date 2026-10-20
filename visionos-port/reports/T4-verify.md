# T4-verify report

## Result

RNTester **compiled and linked for both visionOS and iOS simulators**, arm64 and x86_64, by building the real CocoaPods and application projects separately. All four JavaScript gates pass on supported Node **22.23.3**. Both publish-surface dry runs pass. The generated template also compiled and linked for both simulator architectures, and passed dependency installation, CocoaPods installation, TypeScript, Jest, lint and Metro bundling.

**T4 is not fully complete:** every requested `-workspace` invocation is rejected before compilation in this sandbox, and CoreSimulatorService is inaccessible. The successful project builds are actual app builds, but they do not establish that the requested workspace commands or simulator launch pass. No launch, screenshot, XR/SecondWindow interaction or runtime-behavior claim is made. The exact remaining commands are under **Orchestrator must run**.

Read all six existing reports and all four request files before implementation. All source integration requests were audited as implemented; applied the remaining HelloWorld request. The ignored `RNTester-visionOS.xcscheme` was deliberately left for orchestrator force-add, per the current instruction. No Git write commands or publication were run; reference trees remained read-only. Test cases that create Git repositories were excluded without editing tests.

Paths used below:

```sh
R=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos
S=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad
V="$S/T4-verify"
```

## Final gate table

| Gate | Result | Evidence / limits |
| --- | --- | --- |
| 1. Flow | **PASS**, exit 0, zero errors | Node 22.23.3; also passed on Node 26 |
| 1. Full lint | **PASS**, exit 0, zero errors/warnings | Node 22.23.3; also passed on Node 26 |
| 1. Full Jest | **PASS with policy exclusions**, exit 0 | 238 suites, 6,069 tests, all 1,679 snapshots pass. Three Git-writing fixtures excluded; five upstream skips preserved. Node 26 failures reproduced upstream and disappear on Node 22. |
| 1. Generated TypeScript | **PASS**, exit 0 | Normal workspace type suite, no declarations skipped or custom mapping; also passed on Node 26 |
| 2. RNTester visionOS | **Native app build PASS; requested workspace invocation BLOCKED** | Pods project and app project each exit 0; both simulator architectures. Workspace command exits 66 before compilation. |
| 3. RNTester iOS | **Native app build PASS; requested workspace invocation BLOCKED** | Pods project and app project each exit 0; both simulator architectures; no workaround flags needed for Swift or user scripts. Workspace command exits 66. |
| 4. Template app | **Native app build PASS; requested workspace invocation BLOCKED** | Real CLI-generated app with local file runtime/template dependencies. Pods and app project builds exit 0 for arm64/x86_64; workspace command exits 66. |
| 5. Simulator run / screenshot | **BLOCKED** | `xcrun simctl list runtimes` exits 1: CoreSimulatorService connection refused. No simulator created/booted/installed/launched; none needed shutting down. |
| 6. Publish surface | **PASS** | Normal `npm pack --dry-run --json` in both packages; required source/generated files included, no stray build output. Final post-build recheck recorded below. |

## Fixes and generated integration

| Symptom | Cause | Fix / files | Verification |
| --- | --- | --- | --- |
| Local HelloWorld E2E override retained an unresolved registry fork dependency | Helper added the `react-native` local alias without removing the renamed fork key | Exact open request: delete `dependencies['react-native-mindzone-visionos']` only in the local override branch, `scripts/e2e/init-project-e2e.js`; mark request resolved in `visionos-port/requests/T3-apps.md` | Actual helper evaluated in a VM: local fork, no override and upstream manifest cases pass; full lint/Flow/Jest pass. No full E2E registry workflow invoked. |
| Initial RNTester `pod install` rejected ReactNativeDependencies | Tracked lockfile pinned 0.88.0-rc.6, while current spec/package is 0.88.0 | Targeted `pod update ReactNativeDependencies --no-repo-update`, then ordinary `pod install`; generated `packages/rn-tester/Podfile.lock` and `RNTesterPods.xcodeproj/project.pbxproj` | Install passes: 97 dependencies, 96 pods. Native builds pass. No generated output hand-edited. |
| Two new visionOS unused-function warnings in KeyboardObserver | `RCTRectDictionaryValue` and `RCTAnimationNameForCurve` remained defined while their caller body compiles out on visionOS | Add `#if !TARGET_OS_VISION` around those helpers inside existing tvOS guard, `packages/react-native/React/CoreModules/RCTKeyboardObserver.mm` | Both architecture recompiles pass without either warning; iOS builds pass. Two guard lines only; nonvision code unchanged. |

The helper guard is a small additional 0.88 build adaptation to the ReactVision-preferred port, rather than a copied reference hunk. The E2E change is the exact T3 request. CocoaPods generated integration adds visionOS xcconfigs/library/phases and updates local pod versions/checksums; its serialization also removes empty input/output arrays from existing phases, with no phase behavior change. These generated changes were retained, not hand-trimmed. No sandbox workaround was committed to projects, package settings or scripts.

All other requests (codegen isolation/output, source API pods/header exports, SwiftPM conditional imports, focused-window notifications, URL/scene wiring, Metro resolver, alias snapshot fix and Set annotation) are present. Evidence: `T4-verify/pack/audit.md`. The withdrawn hover API remains absent. `Platform.OS` remains `ios`.

## Toolchain and preparation

- System CocoaPods 1.16.2 (`/opt/homebrew/bin/pod`), Xcode 27.1 build 27A9275, xrsimulator27.0 and iphonesimulator27.1.
- Original Yarn 1.22.22 on PATH throughout. Initial Node was v26.0.0. An isolated, script-free `node-bin-darwin-arm64@22.23.3` archive supplied only a Node binary under scratch for final JS gates. No repository dependencies or lockfile were changed to select Node 22. Setup commands, metadata and SHA256: `T4-verify/node22/setup.md`.
- `BABEL_DISABLE_CACHE=1 yarn --cwd packages/react-native-codegen build` from repository root: **exit 0**, `native/codegen-build.log`. Normal npm prepack generated both actual native spec libraries before pod installation; generated output was never hand-edited.
- The initial version-only `xcodebuild -version` probe had no derived-data argument; it creates no build products. Every build/list invocation used the required scratch `-derivedDataPath`. CocoaPods' generated project sets SYMROOT, so its products still land in RNTester's ignored `build` directory; separate command-line OBJROOT paths avoid concurrent build databases.
- Binary archive plists inspected after pod install confirm real xros device/simulator slices in both Hermes and ReactNativeDependencies. No source-Hermes fallback or dependency disabling used.

## JavaScript gates and upstream separation

All commands ran from repository root. Exact final commands and results:

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH BABEL_DISABLE_CACHE=1 DOTSLASH_CACHE=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/dotslash-cache yarn test --runInBand --watchman=false --forceExit --testNamePattern='^(?!shouldAutoDeintegrate (?:false for a CocoaPods project whose Podfile has third-party pods|false when the pbxproj has uncommitted edits|true despite an unrelated dirty file)).*$' --json --outputFile=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/jest-node22.json
```

Exit **0**: 238 suites pass, 1 suite skipped; 6069 tests pass, 8 skipped; all 1679 snapshots pass. 148.404 seconds. Log: `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/jest-node22.log`.

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/flow-node22
```

Exit **0**: Found 0 errors; 16.42s Log: `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/flow-node22.log`.

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH BABEL_DISABLE_CACHE=1 yarn lint
```

Exit **0**: No errors/warnings; 12.39s Log: `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/lint-node22.log`.

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH BABEL_DISABLE_CACHE=1 yarn test-generated-typescript
```

Exit **0**: 3.19s Log: `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/js/typescript-node22.log`.


The negative `testNamePattern` excludes exactly three `setup-apple-spm-test.js` cases that invoke `gitInitAndCommit`. Five additional skips already exist upstream. No tests were deleted, weakened or edited. `--forceExit` handles existing lingering test-process handles after the complete result is written; it does not suppress assertion failures. The first full Node 26 run finished assertions but was interrupted after retaining handles (exit 130), so it is not represented as a clean process exit.

Final Node 26 run with writable DotSlash cache: **exit 1**, 236 suites pass / 2 fail / 1 skipped; 6,068 tests pass / 1 fails / 8 skipped; all 1,679 snapshots pass. Causes:

1. Unchanged codegen `afterAll` hooks call `fs.rmdirSync(..., {recursive: true})`, removed in Node 26. All 46 assertions / 24 snapshots in that suite pass before cleanup fails.
2. Unchanged HTTPS debugger source-fetch test passes the installed Undici 6.23.0 Agent to Node 26's bundled Undici 8.0.2 fetch; diagnostic is `InvalidArgumentError: invalid onError method`.

Both failures reproduce against untouched upstream source in `/private/tmp/T2-fixup-generated-base-pf2nmwop`, after byte comparison with the prescribed read-only upstream tree: 40 codegen/config inputs, 45 dev-middleware files and 29 debugger-shell files match. Baseline commands, exit codes and logs are retained in `T4-verify/js/commands.json` / `handoff.md`; no reference tree was modified. Node 22 passes both without production/test/dependency changes.

An earlier DotSlash snapshot failure also reproduces upstream: its default cache write to `~/Library/Caches/dotslash/88` is denied. Command-local writable DOTSLASH_CACHE resolves it. Electron's upstream loader logs a denied user-cache creation in a passing spawn test; no Electron installation/run is claimed. Failed Node 26 cleanup left test-created fixture temp directories; only those directories were removed, with exact paths/file lists recorded in `js/fixture-cleanup.json`. Node 22 cleanup succeeds normally.

## Native build results and sandbox diagnosis

From `packages/rn-tester`, documented source-core installation used system CocoaPods as instructed:

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod update ReactNativeDependencies --no-repo-update
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

Results: first **exit 1** due to the stale lock pin; update **exit 0**; final install **exit 0**. Full transcripts and exact cwd/argv/env are in `native/rntester-pod-*.{log,json}`.

Both requested workspace builds exit **66** with `xcodebuild: error: 'RNTesterPods.xcworkspace' is not a workspace file.` The workspace exists, its XML parses, and both referenced projects exist. A newly generated minimal scratch workspace reproduces the same error; direct `-project ... -list` succeeds and lists both schemes. This supports an environment/workspace-loader blocker rather than a project syntax defect; the precise underlying Xcode service cause is not proven. No project file was changed to hide the failure.

Direct builds compile and link the actual app through two normal Xcode project invocations. BUILD_DIR points the application to the actual CocoaPods products; no mocked dependencies or compiler output were used:

| Invocation record under `native/` | Exit / result |
| --- | --- |
| `rntester-visionos-pods-build-1` | 65 after 1,434 C/ObjC/C++ compile steps; Swift Observation macro process cannot start |
| `rntester-visionos-pods-build-2` | **0, BUILD SUCCEEDED**, with command-line Swift workaround and helper-warning fix |
| `rntester-visionos-app-build-1` | **0, BUILD SUCCEEDED**, same command-line Swift workaround |
| `rntester-ios-pods-build-1` | 65, shared generated build database locked by concurrent visionOS build; invocation issue |
| `rntester-ios-pods-build-2` | **0, BUILD SUCCEEDED**, isolated command-line OBJROOT; 1,424 C/ObjC/C++ compile steps |
| `rntester-ios-app-build-1` | **0, BUILD SUCCEEDED**; neither Swift nor user-script sandbox workaround needed |

Swift macro diagnosis is explicit: `sandbox-exec: sandbox_apply: Operation not permitted`, followed by `ObservationMacros.ObservableMacro ... could not be found` / malformed `swift-plugin-server` response. The unchanged macro source compiles with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` passed **only on the xcodebuild command line**. This confirms the observed macro failure came from nested sandboxing. `ENABLE_USER_SCRIPT_SANDBOXING=NO` was not needed as an added command-line workaround; existing upstream/CocoaPods settings were not changed by hand.

Artifacts:

- `packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app`: arm64 + x86_64 executable/debug dylib, minimum 1.0, bundle ID `com.meta.RNTester.localDevelopment.RNTester-visionOS`, Assets.car present. Actual linked classes include RCTXRModule, RCTWindowManager and RCTReactViewController.
- `packages/rn-tester/build/Debug-iphonesimulator/RNTester.app`: arm64 + x86_64 executable/debug dylib, minimum 15.1, bundle ID `com.meta.RNTester.localDevelopment`. The three visionOS classes and `RCTAppDelegate._lastFocusedWindow` ivar are absent from the iOS binary.

Exact lipo/nm commands and outputs: `native/rntester-{visionos,ios}-artifact.json`. Binary symbols establish linkage/isolation, not successful runtime module lookup or scene behavior.

Warning audit: 17 unique iOS warning locations in changed source files map to exact unchanged upstream statements; iOS app source warnings occur in unchanged files. Existing app script-output warnings are from unchanged upstream phases. The two new keyboard unused-helper warnings are gone on both simulator architectures. Remaining new-code visionOS warnings concern the deliberately retained deprecated RCTAppDelegate compatibility path; no broad suppression or delegate redesign was introduced. Reproducible audit and line mapping: `native/warnings-audit.{md,json,py}`.

## Generated template

App root: `$V/TemplateVerify`. The retained `$V/generate-template.cjs` uses real Community CLI 20.2.0 `copyTemplate` and `changePlaceholderInTemplate`: native projects/schemes, Android package paths, app registration and underscore dotfiles are renamed by the actual CLI logic. No CLI Git initialization occurs.

```sh
# Cwd: repository root
BABEL_DISABLE_CACHE=1 node "$V/generate-template.cjs"
# Cwd: $V/TemplateVerify
yarn install --non-interactive
BABEL_DISABLE_CACHE=1 yarn react-native config
BABEL_DISABLE_CACHE=1 yarn typecheck
BABEL_DISABLE_CACHE=1 yarn test --runInBand --watchman=false
BABEL_DISABLE_CACHE=1 yarn lint
BABEL_DISABLE_CACHE=1 yarn react-native bundle --entry-file index.js --platform ios --dev true --bundle-output ../template-visionos.bundle.js --resolver-option platformExtension=visionos --max-workers 2 --reset-cache
# Cwd: $V/TemplateVerify/visionos
RCT_USE_PREBUILT_RNCORE=0 pod install
```

All final commands above exit **0**; Jest 1 suite / 1 test; pod install 90 dependencies / 89 pods. Both `react-native` and direct fork dependencies are local `file:$R/packages/react-native`, and the local template is `file:$R/packages/visionos-template`. Babel/ESLint/Jest/TypeScript tooling uses actual local 0.88 package copies. Metro config uses the authored registry 0.88.0 distribution; copying its raw monorepo source outside the repo lacks the monorepo Babel-register script. The final generated app has no custom resolver mocks, watch folders or source config changes. Both runtime names are physical copies, and authored Metro/CLI/CocoaPods selection consistently uses the direct fork.

The initial `link:` install failed with ENOENT on source RN `node_modules/semver`; switching scratch dependencies to `file:` isolated installation. Existing source dependency-directory timestamps predate that attempt; no repository dependency-tree change was observed or cleanup performed. Only the final keyboard source fix was synchronized byte-for-byte into both app runtime copies before supplemental compilation. Setup deviations, failed attempts and exact expanded commands are retained in `template-handoff.md` and `template-dependency-substitutions.json`.

The exact requested template workspace build exits **66** before compilation with the same workspace-loader/CoreSimulator errors. Supplemental Pods and app project builds both **exit 0 / BUILD SUCCEEDED**. The Pods build records 1,428 native/Swift compile commands. Both architectures link; assets, privacy files, RN resources and frameworks are present. No added user-script sandbox workaround was needed. The app's warnings include imported upstream React headers and the intentional RCTAppDelegate compatibility deprecation; it is not claimed warning-free.

Cwd for both exact supplemental commands: `$V/TemplateVerify/visionos`.

```sh
xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-TemplateVerify -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/template-visionos-pods -jobs 2 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/template-visionos-pods/Build/Intermediates.noindex build > ../../template-pods-xcodebuild.log 2>&1
```

```sh
xcodebuild -project TemplateVerify.xcodeproj -scheme TemplateVerify -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/template-visionos-app -jobs 2 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/template-visionos-app/Build/Intermediates.noindex BUILD_DIR=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/TemplateVerify/visionos/build CODE_SIGNING_ALLOWED=NO build > ../../template-app-project-xcodebuild.log 2>&1
```

Artifact: `$V/TemplateVerify/visionos/build/Debug-xrsimulator/TemplateVerify.app`, bundle ID `org.reactjs.native.example.TemplateVerify`, arm64+x86_64, xrsimulator27.0, declared minimum 1.0. Logs: `T4-verify/template-pods-xcodebuild.log` and `template-app-project-xcodebuild.log`. The app is an unsigned Debug simulator build intended to load Metro; it has not been launched.

## Live Metro

Normal RNTester CLI server initially exits 1 with `EMFILE ... watch`; Watchman separately fails `fchmod` of its user state with `Operation not permitted`. Installed Metro supports `CI=1` to disable filesystem watching. With that environment only, the normal server serves the actual visionOS debug entrypoint:

```sh
# Cwd: $R/packages/rn-tester
CI=1 BABEL_DISABLE_CACHE=1 yarn start --port 8091 --max-workers 2 --no-interactive
curl --max-time 5 --silent --show-error http://localhost:8091/status
curl --fail --silent --show-error --max-time 120 --dump-header "$V/metro/visionos.headers" --output "$V/metro/RNTesterApp-visionos.bundle" 'http://localhost:8091/js/RNTesterApp.ios.bundle?platform=ios&dev=true&resolver.platformExtension=visionos'
```

Status returns `packager-status:running`; bundle request **exit 0 / HTTP 200**, 6,131,558 bytes. Response contains XR, WindowManager, both examples and TestImmersiveSpace. Only the server started on port 8091 was stopped afterward; final connection refusal verifies cleanup. No existing server was terminated. File watching/hot reload and execution inside a native app remain unverified. Logs/exact commands: `metro/audit.md`.

## Publish surface

```sh
# Cwd: $R/packages/react-native
npm pack --dry-run --json
# Cwd: $R/packages/visionos-template
npm pack --dry-run --json
```

Both normal lifecycle commands exit **0**; prepack generates both native specs. Initial inventories: **4,581 core files**, **81 template files**. Compared with read-only ReactVision npm packages: all 25 applicable core visionOS runtime/build paths retained; two historical declaration paths now ship under current generated and legacy type directories. All 131 explicitly audited core build/source/type paths present. Template retains 68/69 reference paths; the old flat icon is replaced by its complete spatial icon stack. Projects, schemes, privacy files, executable scripts and Gradle payload are included.

No node_modules, Pods, DerivedData, .cxx, .git, user state, object/archive/tarball/log output appears in either inventory. Intended generated React specs ship. Exact commands/file lists/comparisons: `pack/audit.md`, `required-files-check.json`, `reference-comparison.json`. Final post-build recheck: **both exit 0**, core 4,581 files / 4,262,046 projected archive bytes / 21,505,029 unpacked bytes; template 81 files / 270,870 projected archive bytes / 391,602 unpacked bytes. Neither inventory gains or loses a path or changes an executable mode. The only core file-size delta is the keyboard helper source (+29 bytes), and the template is unchanged. All 131 required-file assertions still pass. Details and final inventories: `pack/final-audit.md`, `final-delta.json`, `final-*-files.txt`. Dry-run creates no distributable archive and does not publish.

## Orchestrator must run

### Workspace builds

Inside this sandbox, commands below were attempted with the exact cwd/schemes/SDK/configurations and required derived paths; all exited 66 with “is not a workspace file” before compilation. Logs: `native/rntester-visionos-build-1.log`, `native/rntester-ios-build-1.log`, `template-xcodebuild.log`. Rerun outside this sandbox to close the literal workspace gates:

```sh
cd "$R/packages/rn-tester"
xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath "$S/derived/rntester-visionos" -jobs 4 CODE_SIGNING_ALLOWED=NO build
xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath "$S/derived/rntester-ios" -jobs 4 CODE_SIGNING_ALLOWED=NO build
cd "$V/TemplateVerify/visionos"
xcodebuild -workspace TemplateVerify.xcworkspace -scheme TemplateVerify -sdk xrsimulator -configuration Debug -derivedDataPath "$S/derived/template-visionos" build
```

If running within another nested sandbox, add the documented Swift flag only on the command line after confirming the same macro error. Do not commit it. Current RNTester and template app/Pods project builds have already succeeded as detailed above.

### Simulator and scene checks

Attempted from repository root:

```sh
xcrun simctl list runtimes
```

**Exit 1:** `CoreSimulatorService connection became invalid`, `Unable to locate device set`, NSPOSIXErrorDomain Code 61 `Connection refused`; also simulator-log `Operation not permitted`. Exact record: `native/simctl-runtimes-final.{log,json}`. Stopped this step as instructed; no subsequent simulator commands were attempted.

Outside the sandbox, list available runtimes/devices, create or boot an Apple Vision Pro simulator using its actual runtime ID, start Metro on 8081, then install and launch one of the built apps. For RNTester, use the artifact above and bundle ID `com.meta.RNTester.localDevelopment.RNTester-visionOS`. Capture `xcrun simctl io <udid> screenshot "$V/RNTester-visionOS.png"`, open XR and SecondWindow, and shut that simulator down afterward. No screenshot currently exists or is claimed.

Runtime checks still open: native XR module lookup and open/cancel/failure/end/reopen; secondary-window open/update/close/focus/resizing; initial/focused dimensions; cold/warm links; pointer/hover/text/keyboard behavior. Compile/link, JS mocks and delivered bundles do not prove these. Source SwiftPM integration, framework-mode pods, Release/device builds, and execution on minimum-version hardware were not tested in this CocoaPods simulator gate.

### Remaining integration

The orchestrator must retain the ignored RNTester-visionOS shared scheme when committing. No ignore rule or Git index was changed. All open source changes requested in requests/ have been applied or already existed; runtime verification remains open as listed. No publish/release action was taken.

## Exact native command journal

Each entry below is generated from the actual completed command recorder JSON. Full logs retain compiler output and explicit environment, cwd, timestamps and exit codes. The recorder itself is `$V/run.py`. Diagnostic invocations are included so failures and workarounds are reproducible.

### simctl-runtimes-final

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos`. Exit **1**. Log: `T4-verify/native/simctl-runtimes-final.log`.

```sh
xcrun simctl list runtimes
```

### rntester-pod-install-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **1**. Log: `T4-verify/native/rntester-pod-install-1.log`.

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

### rntester-pod-update

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-pod-update.log`.

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod update ReactNativeDependencies --no-repo-update
```

### rntester-pod-install-final

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-pod-install-final.log`.

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

### rntester-visionos-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **66**. Log: `T4-verify/native/rntester-visionos-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-visionos -jobs 4 CODE_SIGNING_ALLOWED=NO build
```

### rntester-ios-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **66**. Log: `T4-verify/native/rntester-ios-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios -jobs 4 CODE_SIGNING_ALLOWED=NO build
```

### rntester-project-list

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-project-list.log`.

```sh
xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-project-list -list
```

### workspace-probe

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos`. Exit **66**. Log: `T4-verify/native/workspace-probe.log`.

```sh
xcodebuild -workspace /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/workspace-probe/Probe.xcworkspace -scheme RNTester-visionOS -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/workspace-probe -list
```

### rntester-visionos-pods-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **65**. Log: `T4-verify/native/rntester-visionos-pods-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-visionos-pods -jobs 4 CODE_SIGNING_ALLOWED=NO build
```

### rntester-ios-pods-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **65**. Log: `T4-verify/native/rntester-ios-pods-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios-pods -jobs 2 CODE_SIGNING_ALLOWED=NO build
```

### rntester-ios-pods-build-2

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-ios-pods-build-2.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios-pods/Build/Intermediates.noindex CODE_SIGNING_ALLOWED=NO build
```

### rntester-visionos-pods-build-2

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-visionos-pods-build-2.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-visionos-pods -jobs 4 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

### rntester-visionos-app-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-visionos-app-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-visionos-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-visionos-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

### rntester-ios-app-build-1

Cwd: `/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester`. Exit **0**. Log: `T4-verify/native/rntester-ios-app-build-1.log`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/rntester-ios-app/Build/Intermediates.noindex CODE_SIGNING_ALLOWED=NO build
```


## Final diff checks

`git diff --check` passed after the fixes. Final source diff consists of the exact HelloWorld dependency deletion, two native guard lines, generated CocoaPods lock/project integration, request status and this report. Root package.json/yarn.lock, generated API snapshot, platform identity and scheme-ignore policy were not changed by T4. Final report and modified request file were checked with the direct local Prettier binary; no repository-wide writing formatter was used.

## Orchestrator results (steps run outside the Codex sandbox, 2026-10-21)

**Workspace builds** (the exact commands from "Orchestrator must run", with no sandbox workaround flags):

| Build | Result |
| --- | --- |
| `xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug` | **BUILD SUCCEEDED**, exit 0 |
| `xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester -sdk iphonesimulator -configuration Debug` | **BUILD SUCCEEDED**, exit 0 |
| Template `TemplateVerify.xcworkspace`, scheme `TemplateVerify`, `-sdk xrsimulator` | **BUILD SUCCEEDED**, exit 0 |

The in-sandbox "is not a workspace file" error therefore came from the sandbox, not the project. Swift macros (`@Observable`) compiled without `-disable-sandbox` outside the sandbox.

**Simulator run.** Device: Apple Vision Pro, visionOS 27.0 (24M362), simulator `D6B93A33-…`. Metro was started with `yarn start` from the repo root on port 8081.

- RNTester-visionOS installed, launched and rendered its main window, with the debug reload/dev-menu ornament from `RCTRootViewRepresentable`. A cold relaunch after a simulator reboot rendered again.
- **Runtime probe:** a temporary `js/__vos_probe.js`, imported from `RNTesterApp.ios.js`. It was removed afterwards and `git diff` confirmed `RNTesterApp.ios.js` matches HEAD. Device-log output (`com.facebook.react.log:javascript`):
  - `Platform.OS=ios`, `isVision=true`, `interfaceIdiom=vision`, `window={"width":1280,"height":720,"scale":2,"fontScale":1}`, `supportsMultipleScenes=true`
  - `WindowManager.getWindow('SecondWindow').open({title})`: resolved. A second visionOS window appeared, showing the passed props and its SwiftUI ornament.
  - `.update({title})`: resolved. The window re-rendered with the new props.
  - `XR.requestSession('TestImmersiveSpace')`: resolved. A full immersive space opened.
  - `XR.endSession()`: resolved. It returned to the shared space, and SecondWindow kept its props.
- **Screenshots:** `scratchpad/shots/rntester-visionos-1.png`, `probe-t12.png` (SecondWindow), `probe-t24.png` (immersive), `probe-t34.png` (ended).
- **Not verified:**
  - *Deep links:* `xcrun simctl openurl` shows visionOS's "Open in RNTester-visionOS?" system prompt. No tool here can confirm it: AXe cannot map visionOS coordinates, and this Xcode install has no Simulator.app. The cold and warm deep-link paths are therefore still unverified.
  - *Interaction:* pointer, hover, text input and keyboard were not exercised interactively.
  - *Other configurations:* Release, device, framework-mode pods and the SwiftPM source graph were not built.
