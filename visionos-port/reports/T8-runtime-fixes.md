# T8-runtime-fixes

## Result

Implemented single-dispatch window routing and explicit single-window identity. Corrected WindowManager's null-prop contract without changing the upstream feature flag. Focused Jest, the new host routing probe, Flow, lint, type generation, and generated TypeScript checks passed. All four requested direct project builds passed: Pods and RNTester for xrsimulator and iphonesimulator, arm64 + x86_64.

No simulator execution is claimed. The orchestrator's rerun must confirm one secondary window/root and the lifecycle scenarios below.

## Diagnosis and changes

### Window routing and identity

The supplied simulator evidence establishes two secondary roots after one JS open. It does not by itself establish which SwiftUI observer invoked an action or exclude a restored/pre-existing window. The T6 claim was already set before mutation/action. A fresh macOS Foundation/Combine probe confirmed that three subscribers receive the same NSMutableDictionary and see the preceding claim; ordinary bridging alone was not reproduced as the cause. SwiftUI scene delivery was not instrumented here.

Two weaknesses were removed:

- T6 subscribed every view to the same notifications and seeded `@State` with a UUID at modifier construction. A copied view value is not a reliable source of distinct mount identities. New `RCTWindowRouter.swift` owns exactly one synchronous NotificationCenter observer for each event, with main-actor isolation. It selects only the first mounted host. `register` allocates a fresh UUID when each view appears; disappearance unregisters it and promotes the next host. No task/queue hop delays the native acceptance ACK. The shared request claim is still consumed before props mutation or a SwiftUI action, including reentrant delivery and host handover.
- `RCTWindow` previously declared an id-only WindowGroup, and every open unconditionally invoked `openWindow(id:)`. There was no repeated-ID guard. `RCTWindow` now uses `WindowGroup(id: id, for: String.self)` with `defaultValue { id }`, paired with `openWindow(id: id, value: id)`. Equal associated values identify the same window; this uses SwiftUI's own identity across opening, existing and restored scenes, without an application-side pending-window cache that can become stale after manual closure. [Apple's WindowGroup documentation](https://developer.apple.com/documentation/swiftui/windowgroup) documents reuse of a window presenting an equal value.

One accepted open/close request invokes exactly one corresponding SwiftUI action, regardless of host count. Update performs one synchronous scene-data merge. Native promise resolution still means the host accepted the operation, not that SwiftUI presentation completed. Missing hosts leave requests unclaimed and native code rejects; update of absent scene data still rejects.

Repeated `open(props)` shallowly merges supplied props into existing scene data and requests the same window. Omitted/null props do not reset existing values. `close()` keeps the existing dismissal and scene-data removal behavior. Every surviving RCTMainWindow/RCTWindow remains eligible to route, including a secondary after main closes. XR scene-data notifications use the same elected host, without the WindowManager-only claim requirement.

**Reference comparison/deviations:** inspected the read-only Callstack 0.79 and ReactVision 0.86 sources listed in PLAN.md. Both attach routing only to main and unconditionally invoke id-only `openWindow`. Neither implements an explicit repeated-ID singleton guard. T8 restores the observed pre-T6 one-call/one-window experience and adds the requested repeated-ID guarantee, rather than claiming that the references contain this implementation. Multiple-host survivability, synchronous ACK/rejection and shallow merging retain T6 improvements. Repeated-open merging is deliberate so null/omitted props cannot erase existing values.

**Custom scene compatibility:** custom scenes hosting routing can still apply `WindowHandlingModifier`. A custom window targeted by WindowManager must now declare the same String-valued WindowGroup identity/default as RCTWindow; an id-only custom target must migrate. Both READMEs document the exact declaration. No deployment target was raised; the visionOS builds compile this against a 1.0 deployment target.

### Null prop contract

`RCTTurboModule.mm` returns nil for null when `enableModuleArgumentNSNullConversionIOS` is false and skips nil dictionary values. The flag remains **false**, unchanged. Native dictionary-merge tests from T2/T6 bypassed this conversion and never established a JS-null round trip.

- `WindowManager.js` now explicitly drops top-level null/undefined prop entries for open/update, using a small normalization helper. Null/omitted whole payloads still become `{}`. False, zero and empty string survive; inputs are not mutated. No encoding or recursive serializer was added.
- Flow and deprecated TypeScript declarations, root/package READMEs and T2-apis/T6 reports now say null values do not clear or override existing root props. `update({nullable: null})` keeps `nullable: 'old'`.
- Nested objects retain upstream conversion: null-valued object keys are omitted, while null array slots remain. Updates are shallow, so a supplied nested object replaces the old nested value rather than recursively merging it. The README explicitly distinguishes this from root-prop omission.
- Jest checks the actual arguments forwarded to native, including null-only update → `{}`, rather than a mocked bridge that pretends null survives.

This extends T2's whole-payload normalization and deliberately makes the root-prop contract stable even if an app changes the shared flag. All other module argument conversion remains upstream. Type generation ran normally; generated WindowManager declarations contain the corrected comments, while the tracked API snapshot has no delta because signatures did not change. No generated file was hand-edited.

### Scope and isolation

T8 edits: `Libraries/SwiftExtensions/{RCTMainWindow,RCTWindow}.swift`, new `RCTWindowRouter.swift`, its SwiftPM source list in `Package.swift`, WindowManager wrapper/test/type documentation, both READMEs, corrections in T2/T6 reports, this report and `visionos-port/tests/window-routing-probe.py`.

All changed Swift implementation is inside `#if os(visionOS)`. The extra SwiftPM source belongs to the existing visionOS integration target. Actual rebuilt app symbols contain RCTWindowRouter in both visionOS architectures and exclude it from both iOS architectures. WindowManager's native implementation remains visionOS-only; unavailable-module behavior is unchanged elsewhere. `Platform.OS` remains `ios`.

All pre-existing T6/T7 work was preserved. No Git writes, commits, branches, worktrees, publication or reference-tree edits occurred. Pod regeneration changed no tracked app project/lockfile.

## Verification environment

Commands ran from the repository root unless specified. Paths used below:

```sh
R=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos
S=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad
V="$S/T8-runtime-fixes"
```

JS checks use T4's Node 22 installation and Yarn 1.22.22. Native checks use Xcode 27.1, xrsimulator27.0 and iphonesimulator27.1. `$V/run.py` records argv, cwd, explicit environment overrides, timestamps, exit status and output in matching JSON/log files. `$V/builds.py` replays the T6 build command records in sequence with fresh T8 logs, reusing the existing T6 derived-data/OBJROOT paths for incremental builds.

### JS and public types

All commands exited **0**:

```sh
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/WindowManager --runInBand --watchman=false
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn build-types
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn test-generated-typescript
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/T8-flow
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn lint
```

| Check | Result | Recorder/log |
| --- | --- | --- |
| Focused Jest | 1 suite / 5 tests passed | delegated command output |
| build-types | Generated declarations and API snapshot successfully | `$V/build-types.{json,log}` |
| Generated TypeScript | tsc passed | `$V/generated-typescript.{json,log}` |
| Flow | Found 0 errors | `$V/flow.{json,log}` |
| Lint | 0 ESLint errors/warnings | `$V/lint.{json,log}` |

Yarn printed its existing suitable-global-folder warning. Full-repository Jest, unrelated Ruby suites and legacy TypeScript checking were not rerun.

### Automated routing regression probe

```sh
python3 visionos-port/tests/window-routing-probe.py
```

**PASS**, exit 0. This durable script extracts the actual router source, removing only its outer visionOS guard, and compiles it unchanged with a host harness using `xcrun --sdk macosx swiftc -swift-version 5 -module-cache-path <temporary-directory>/module-cache <temporary-directory>/main.swift -o <temporary-directory>/window-routing-probe`, then runs that executable. The script prints exact temporary paths and commands; its temporary directory is removed afterward.

Real Foundation NotificationCenter and NSMutableDictionary cover 64 distinct mount IDs; one elected receiver and synchronous ACK for open/update/close; repeated/reentrant consumption; unregister-and-repost during an action; the next independent request reaching the survivor; removal of a non-elected host; all hosts absent; remount; a missing claim object; and XR scene-data delivery/handover. Source integration assertions check the matching String window/action identity, shared-router installation and claim-before-mutation ordering.

These are host logic and source checks, **not execution of SwiftUI window creation, pending-open deduplication, restoration or close/reopen timing**. No invented native-null survival test is included.

The diagnostic three-observer Foundation/Combine probe also passed:

```sh
xcrun swift -module-cache-path /private/tmp/T8-routing/module-cache /private/tmp/T8-routing/bridge.swift
```

Output: first subscriber sees handled=0, subsequent subscribers see handled=1, all three report identical request object identity, and the original request ends handled=1. This rules out a simple Foundation/Combine dictionary-copy explanation on the host, not every SwiftUI delivery path.

### CocoaPods and native builds

All commands here ran in `$R/packages/rn-tester`, exited **0**, and each build reported **BUILD SUCCEEDED**. `pod install` ran first to discover the new router source and installed 97 dependencies / 96 pods. `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` was supplied only on the command line in all four builds; no source/project workaround was added.

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

Log/record: `$V/pod-install.{json,log}`.

**visionos-pods — PASS**, log/record `$V/visionos-pods.{json,log}`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**visionos-app — PASS**, log/record `$V/visionos-app.{json,log}`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-pods — PASS**, log/record `$V/ios-pods.{json,log}`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-app — PASS**, log/record `$V/ios-app.{json,log}`.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

Both architectures of RCTMainWindow, RCTWindow and the new router compiled in the visionOS Pods build, followed by app relinking. Build logs retain existing deprecation, nullability, run-script and CoreSimulator-service diagnostics; successful builds are not claimed warning-free. No simulator launch was attempted.

Updated unsigned Debug artifacts:

- `$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app`
- `$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app`

### Integration and artifact checks

All commands below exited **0**:

```sh
swift package --package-path packages/react-native --cache-path /private/tmp/T8-spm-cache --scratch-path /private/tmp/T8-spm-build --disable-sandbox dump-package
python3 "$V/artifact-check.py"
git diff --check
```

Manifest evaluation includes the new Swift source. SwiftPM user-cache warnings did not prevent evaluation; no source SwiftPM app build is claimed. `artifact-check.py` checks whole-file visionOS guards, the evaluated source list, and runs these commands for each app executable and `.debug.dylib`:

```sh
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app/RNTester-visionOS"
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app/RNTester-visionOS.debug.dylib"
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app/RNTester"
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app/RNTester.debug.dylib"
```

All four report `x86_64 arm64`. For each of `arm64` and `x86_64`, `xcrun nm -arch <architecture> <app>.debug.dylib` finds RCTWindowRouter only in visionOS, absent on iOS. Exact expanded commands/results are in `$V/artifact-check.log`, with its recorder JSON. Manifest output/record: `$V/swiftpm-manifest.{log,json}`.

## Orchestrator simulator handoff

Use the rebuilt visionOS app above with Metro and rootTag logging in SecondWindow. First close any pre-T8 duplicate windows so the count starts known; test restoration separately with windows created by this build.

```js
const second = WindowManager.getWindow('SecondWindow');
await second.open({unchanged: 1, nullable: 'old'});
await Promise.all([
  second.update({title: 'A'}),
  second.update({count: 1}),
  second.update({nullable: null}),
  second.update(null),
  second.update(),
]);
await second.open({reopened: true, nullable: null});
```

Expected: exactly **one SecondWindow window and one mounted React root**. Updates and repeated opens keep that rootTag; rerenders do not imply another root. Final props include `unchanged: 1`, `nullable: 'old'`, `title: 'A'`, `count: 1`, `reopened: true`. No null value clears the existing root prop. Repeated open requests target/bring forward the same window, with no second root.

Also verify:

1. Two immediately issued `open` requests for SecondWindow before the first appears still result in one window/root; their non-null prop deltas accumulate.
2. Close main manually while SecondWindow survives. From that survivor, update and repeated open still act on the same secondary root. With several distinct/custom mounted React hosts, each WindowManager request produces one action. Custom destination windows must use the documented String-valued group identity.
3. `second.close()` dismisses the secondary and removes its scene data. A later open from a surviving host produces one new secondary root; a new rootTag after an actual close is expected. Test manual close/reopen, immediate close/open and open/close/open ordering as lifecycle edge cases.
4. Restore a secondary window after process relaunch, including with main closed. It renders without persisted props; opening its ID again must reuse the restored window, and updates must work.
5. Keep the passing XR race/reopen/invalid-ID/no-session/reload scenarios from the prior probe, especially with main closed, because XR scene-data delivery now shares the central router. No XR lifecycle implementation or T7 scene-delegate fix was changed.

No SwiftUI runtime outcome above is marked passed by T8. Device/Release builds, framework-mode Pods, template/source SwiftPM app builds, tvOS/macOS/Android builds and simulator screenshots were not run; they are outside this requested verification set.

## Orchestrator simulator results (2026-10-21; Apple Vision Pro simulator, visionOS 27.0)

Build under test: an RNTester-visionOS workspace build outside the sandbox, containing T6, T7 and T8. A temporary probe (`js/__vos_probe2.js`, imported from `RNTesterApp.ios.js`) drove the APIs; afterwards the file was deleted and `RNTesterApp.ios.js` was restored to HEAD. The probe temporarily re-registered `SecondWindow` with a component that logs and renders every prop it receives.

| Scenario | Result |
| --- | --- |
| Launch without URL → `Linking.getInitialURL()` | `null` ✓ |
| `open({unchanged: 1, nullable: 'old'})` | resolved. **One** window and one React root (`rootTag 21`), confirmed by screenshot ✓ |
| `Promise.all` of `update({title:'A'})`, `update({count:1})`, `update({nullable:null})`, `update(null)`, `update()` | all resolved. Final props `{unchanged:1, nullable:'old', title:'A', count:1}`. The partial updates merged, and null left `nullable` unchanged, which is the documented bridge behaviour ✓ |
| A second `open({reopened:true})` on the already-open window | resolved. Same `rootTag 21`, no second window, props merged ✓ |
| `requestSession` plus two `endSession` calls without awaiting | request rejected "Immersive Space ended before opening"; both ends resolved ✓ |
| Reopen after the race, then end | resolved / resolved ✓ |
| `endSession` with no session | resolved ✓ |
| `requestSession('NoSuchSpace')` | rejected "Immersive Space failed to open…"; the next end resolved ✓ |
| Open a space, then `second.close()`, then request again | close resolved. The request rejected "already opened or closing", because the space was hosted by the main window, not the closed one. So implicit dismissal was not exercised by this ordering |
| `DevSettings.reload()` with a space open, then end and request after reload | end resolved; **request after reload resolved**, so the old space was torn down by invalidation ✓ |
| Crash reports and process health | no new crash report; the app stayed alive through the whole run ✓ |

**History:** the T6 build crashed on immersive-scene connection (SwiftUI `AppSceneDelegate` recursion), which T7 fixed. The T6/T7 build opened two SecondWindow roots for one `open()`, which T8 fixed. Both regressions were caught only by this simulator probe, not by the review or the unit tests.

**Still not verified at runtime:**
- window restoration after relaunch;
- closing the main window by hand, then routing from a surviving window;
- leaving the immersive space with the Digital Crown;
- cold and warm deep links (visionOS shows a system prompt that this machine cannot tap);
- pointer, hover and keyboard interaction;
- Release, device and framework-mode builds.
