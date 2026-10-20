# T6-review-fixes

**T8 runtime correction:** the orchestrator subsequently observed two secondary roots after one open and confirmed that JS null props never reach the merge under the default bridge conversion. T8 replaces the per-view subscription/election with a process-wide router and value-identified windows; see [T8-runtime-fixes.md](T8-runtime-fixes.md). The build/probe results below are historical and do not establish the original runtime duplicate-prevention claim.

## Result

All eight defects were confirmed and fixed. All four requested direct project builds **passed** (Pods and RNTester app, both xrsimulator and iphonesimulator, arm64 + x86_64). Focused Jest passed **7 suites / 76 tests / 24 snapshots** across keyboard, WindowManager, XR and codegen. Final Flow and lint passed. The new/updated Ruby regression suites passed; the complete CocoaPods run retains failures in five existing suites, matching T2's recorded upstream baseline. Simulator runtime checks remain for the orchestrator below; no runtime success is claimed.

## Scope and verified findings

All eight T5 findings were confirmed against the starting source. None was dismissed. No Git write, publication, branch, tag, worktree, or reference-tree modification was performed. The pre-existing untracked T5 report and T5/T6 prompts were left intact. The user explicitly expanded T6 ownership to the whole repository.

The changes below are **deliberate improvements over both Callstack 0.79 and ReactVision 0.86**, not attempts to reproduce their defects. Reference trees are the read-only paths from PLAN.md.

| Finding | Evidence before fix | Root correction |
| --- | --- | --- |
| 1. Restored secondary window | `RCTWindow` called `RCTFatal` when optional scene data was nil; a fresh process starts with an empty scene dictionary. Both forks also fatal. | Render the registered module and seed the shared context with default scene data and nil props. A doc comment describes restoration and non-persistence of old props. No restoration-disabling API or raised deployment floor. |
| 2. Window routing tied to main | Only `RCTMainWindow` mounted the modifier; native methods resolved after posting regardless of delivery. Both forks have this design. | T6 added routing to `RCTWindow`, view-ID election, and a synchronous shared request claim. **Superseded by T8:** simulator results did not establish single-window behavior; view-value UUID seeding is fragile and id-only WindowGroup opens do not enforce singleton identity. T8 retains host survivability with one process-wide dispatcher and gives each window a stable String value. |
| 3. XR implicit dismissal | Bridge disappearance dismissed SwiftUI without clearing the module's retained controller; actual immersive-scene closure was unobserved. | Bridge dismissal completion and matching immersive-scene disconnection feed token-guarded, idempotent cleanup. Track pending end calls and settle each request/end promise once. |
| 4. XR reload | Module did not implement `RCTInvalidating`. | Invalidation dispatches to main, rejects pending requests/end calls, waits for pending opening/dismissal, removes the child controller, and posts scene-data dismissal. Old callbacks cannot clear a newer session; a main-queue process owner also prevents a new module from opening before the invalidated owner finishes teardown. |
| 5. Lost partial props | Each handler replaced `sceneData.props` with the latest delta. Both forks do so. | Synchronous shallow merge before SwiftUI can coalesce renders; non-null incoming keys win and unchanged keys survive. **T8 correction:** JS null object values are dropped by the default TurboModule conversion before native merging, so null props do not clear or override old values. Omitted/null whole payloads remain empty updates. |
| 6. Warm URL becomes initial | `onOpenURL` cached the first URL whenever static `initialURL` was nil, without a launch/runtime distinction. Both forks also do so. | Capture the first window scene's connection options exactly once, including nil. `onOpenURL` only emits events, preserving T2-native NEW-5. A visionOS scene delegate installed by RCTAppDelegate forwards launch options; custom delegates must forward the documented method. |
| 7. Wrong dependency exclusions | Autolinking selected `platforms.ios`; codegen reused its `ios` backend identity to filter dependencies. | Select `visionos` config for visionOS CocoaPods targets and pass dependency identity separately from the unchanged iOS generator backend. The Xcode script phase also forwards identity from xros/xrsimulator. A mixed Podfile with incompatible generated dependency sets rejects explicitly instead of silently sharing incorrect providers; matching mixed configurations remain supported. Regression coverage includes opposite iOS/visionOS exclusions. |
| 8. Dropped layout callback | `onLayout` was destructured out of props and never passed to the visionOS View. Both forks have the same branch. | Forward the callback directly on visionOS; Jest verifies one callback with the original event, unchanged style, and no keyboard subscriptions. |

All native behavior changes are inside `TARGET_OS_VISION` / `os(visionOS)` guards, including the new `RCTVisionSceneDelegate` files. The original non-visionOS Swift factory signature/fallback is preserved. JS changes only affect `Platform.isVision === true`. `Platform.OS` remains `ios`. The source SwiftPM graph adds a visionOS-conditional AppDelegate dependency on Linking for the new delegate. No public Flow/TypeScript declarations changed, so `yarn build-types` and `yarn test-generated-typescript` were not required or run.

The launch-link delegate uses Apple's documented SwiftUI UIApplicationDelegateAdaptor scene-delegate integration: https://developer.apple.com/documentation/SwiftUI/UIApplicationDelegateAdaptor . SwiftUI still owns scene/window construction. No app-active timing heuristic or swizzling is used. A custom RCTAppDelegate subclass that overrides scene configuration must preserve this delegate or forward the connection callback to RCTLinkingManager itself.

## Verification environment

Commands run from the repository root unless a different cwd is specified:

```sh
R=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos
S=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad
V="$S/T6-review-fixes"
```

Xcode 27.1, xrsimulator27.0 and iphonesimulator27.1; CocoaPods 1.16.2. Root JS gates used the existing T4 Node 22.23.3 binary via `PATH="$S/T4-verify/node22/bin:$PATH"`, Yarn 1.22.22, and `BABEL_DISABLE_CACHE=1`. The recorder `$V/run.py` records actual argv, cwd, environment, timestamps, exit status and full output in matching JSON/log files. Native builds use direct projects, command-line-only `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'`, and separate required `T6-*` derived/OBJROOT paths. No sandbox workaround was added to source or project settings.

## Root checks

- `PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/Components/Keyboard/__tests__ --runInBand --watchman=false`: **PASS**, 2 suites / 9 tests. This includes the new KeyboardAvoidingView regression.
- `PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/T6-flow`: **PASS**, exit 0, zero errors; `$V/flow.{json,log}`. Repeated after final codegen changes: **PASS**, zero errors; `$V/flow-final.{json,log}`.
- `PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn lint`: **PASS**, exit 0, zero errors/warnings; `$V/lint.{json,log}`. Repeated after final codegen changes: **PASS**; `$V/lint-final.{json,log}`.
- `RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install`, cwd `$R/packages/rn-tester`: **PASS**, exit 0, 97 dependencies / 96 pods; `$V/pod-install.{json,log}`. No podspec changed; installation was rerun to discover the new scene-delegate source file. No tracked generated project/lockfile delta resulted.

### Linking smoke check

A scratch Foundation harness extracts the actual new visionOS connection handler, `onOpenURL`, and `getInitialURL` method bodies from RCTLinkingManager. Minimal scene/connection-option objects stand in for UIKit; NSNotificationCenter and NSUserActivity are real Foundation classes. The three separate process runs verify a URL-less launch stays nil even when the first warm event precedes getInitialURL, a custom-scheme launch URL remains stable, a universal launch URL remains stable, later scene connection options cannot replace the initial value, creating a new module instance preserves it, and both warm events emit exactly once.

```sh
xcrun --sdk macosx clang++ -fobjc-arc -fblocks -fmodules -fmodules-cache-path=/private/tmp/T6-linking-clang-cache -framework Foundation "$V/linking-smoke.mm" -o "$V/linking-smoke"
"$V/linking-smoke" empty
"$V/linking-smoke" cold
"$V/linking-smoke" universal
```

Final compile and all three modes **PASS**, exit 0. The first harness version used `rntester://cold` for NSUserActivity.webpageURL; Foundation correctly rejected that invalid universal-link fixture. Correcting it to `https://example.com/cold` passed. An initial macro-redefinition warning was removed in the harness. These are host-side logic checks, not SwiftUI lifecycle or simulator tests.

### Formatting and diff checks

`node_modules/.bin/prettier --write packages/react-native/Libraries/Components/Keyboard/__tests__/KeyboardAvoidingView-test.js` formatted only the new test. `git diff --check` passed during review.

`/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror` passed for the AppDelegate and new delegate files and RCTLinkingManager.h. The same command also included RCTLinkingManager.mm and found six pre-existing formatting diagnostics in its untouched canOpenURL rejection branch. Running it against `git show HEAD:packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm` saved to `/private/tmp/T6-linking-before.mm`, with `--style=file:$R/.clang-format`, reproduced all six. That unrelated upstream formatting was left alone.

## Runtime checks for orchestrator

No simulator commands or UI interactions were attempted: this sandbox cannot reach CoreSimulator. Native compilation and host-side probes do not prove scene restoration, SwiftUI delivery timing, or Digital Crown behavior. Run these scenarios outside the sandbox with RNTester-visionOS and Metro. Its registered IDs are `SecondWindow` and `TestImmersiveSpace`. For props checks, temporarily log/display all props in the SecondWindow React component.

```js
import {WindowManager, XR, Linking, DevSettings} from 'react-native';
const second = WindowManager.getWindow('SecondWindow');
const settle = (name, promise) => promise.then(
  () => console.log(name, 'resolved'),
  error => console.log(name, 'rejected', error.message),
);
```

1. **Restoration:** `await second.open({oldProp: 'previous process'})`; leave it open, terminate/relaunch through visionOS window restoration (also test main already closed). Observe no fatal error, the registered secondary module renders without oldProp, then `await second.update({restored: true})` reaches it.
2. **Host handover and duplicate prevention:** open the secondary, manually close main, and from surviving React call `await second.update({afterMainClosed: true})`, `await second.open({openedFromSecondary: true})`, then `await second.close()`. Observe one accepted action per call. Repeat with several mounted hosts and close whichever host first handled routing. A temporary custom React WindowGroup or ImmersiveSpace should apply `.modifier(WindowHandlingModifier())`; with only that scene surviving, registered window operations should still work. Without any modifier host, calls reject `No React scene could handle the window operation`. Updating an unopened ID also rejects.
3. **Coalesced props and null:** `await second.open({unchanged: 1, nullable: 'old'}); await Promise.all([second.update({title: 'A'}), second.update({count: 1}), second.update({nullable: null}), second.update(null), second.update()]);`. **T8-corrected expectation:** observe final unchanged=1, title=A, count=1 and nullable='old'. Null props do not clear or override existing values. No field disappears because SwiftUI coalesced updates.
4. **Implicit XR dismissal:** focus a window, `await XR.requestSession('TestImmersiveSpace')`, then manually close that hosting window while another React window survives. After the space closes, `await XR.requestSession('TestImmersiveSpace')` from the survivor must succeed; `await XR.endSession()` must resolve. Repeat by exiting via Digital Crown instead of closing the window; reopen must work without “already opened”.
5. **XR promise races:** call `settle('open', XR.requestSession('TestImmersiveSpace')); settle('end1', XR.endSession()); settle('end2', XR.endSession());` without awaiting between calls. Each operation must settle once; an opening request ended early rejects, both ends resolve after closing, and another request can open. Also test user cancellation, invalid scene ID/system failure, repeated end with no session, and a duplicate request while already open. Observe no leaked child controller/scene props.
6. **Reload:** open immersive space, then `DevSettings.reload()`. Observe the space dismisses and the old child controller/scene data is removed. After JS reconnects, `await XR.endSession()` is harmless and `await XR.requestSession('TestImmersiveSpace')` succeeds. Repeat reload while requestSession is awaiting system response and while endSession is pending. Native pending operations must be rejected once during invalidation (old JS may already be disconnected); late old callbacks must not clear a new session.
7. **Links:** install `Linking.addEventListener('url', e => console.log('url-event', e.url))`. Launch without a URL, check `await Linking.getInitialURL()` is null, open `rntester://warm-one`, observe exactly one event and initial URL still null. Repeat the first warm URL before the first JS initial-URL read, background/foreground delivery, a new window connection and React reload. Then terminate and cold-launch via `rntester://cold-one`; initial URL must be that cold URL, including when SwiftUI delivers onOpenURL after JS startup. Later warm URLs must emit and never replace it. Test a universal link with an entitled test host too. Confirm system Open prompts as needed. Also test restored scene sessions and custom scene delegates forwarding the documented callback.
8. **Layout:** render `<KeyboardAvoidingView onLayout={e => console.log('layout', e.nativeEvent.layout)} behavior="padding" style={{height: 200}} />`, resize its parent and observe layout callbacks without keyboard padding/position adjustments. Repeat the component on iOS to confirm normal keyboard avoidance.

Device/Release, framework-mode CocoaPods, source SwiftPM linkage, tvOS and macOS app builds were not run. Minimum visionOS 1.0 source typechecks and the requested simulator builds are recorded separately; they are not minimum-version device execution.

## Source SwiftPM manifest check

```sh
swift package --package-path packages/react-native --cache-path /private/tmp/T6-spm-cache --scratch-path /private/tmp/T6-spm-build --disable-sandbox dump-package > /private/tmp/T6-spm-package.json
```

**PASS**, exit 0. JSON assertion confirms the AppDelegate dependency on React-RCTLinking has `platformNames: ["visionos"]`. Non-visionOS dependency selection is unchanged. SwiftPM reported inaccessible user-level cache directories and disabled those caches; the manifest still evaluated. This is a manifest check, not a source SwiftPM build.

## Focused window verification


From repository root:

```sh
BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/WindowManager --runInBand --watchman=false
```

PASS, exit 0: 1 suite / 4 tests, verifying handles/IDs, optional props, native failure propagation, module availability. Yarn emitted its existing suitable-global-folder warning.

```sh
xcrun --sdk xrsimulator swiftc -typecheck -disable-sandbox -swift-version 5 -D DEBUG -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T6-windows-swift-cache -I /private/tmp/t2-apis-swift-check/headers -import-objc-header packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h packages/react-native/Libraries/SwiftExtensions/*.swift
```

PASS, exit 0, no diagnostics. Uses the existing T2 local header fixture; this is a focused typecheck, not an app build. Main agent owns project build verification. `-disable-sandbox` was command-line-only.

```sh
xcrun clang++ -fsyntax-only -fobjc-arc -fblocks -std=c++20 -DRN_BUILDING=1 -DRCT_NEW_ARCH_ENABLED=1 -Werror -Wno-deprecated-declarations -Wno-nullability-completeness -target arm64-apple-xros1.0-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -I/private/tmp/t2-apis-native-headers -I/private/tmp/T2-apis-codegen -Ipackages/react-native/ReactCommon -Ipackages/react-native/ReactCommon/jsi -Ipackages/react-native/ReactCommon/callinvoker -Ipackages/react-native/ReactCommon/react/nativemodule/core -Ipackages/react-native/ReactCommon/react/nativemodule/core/platform/ios packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
```

PASS, exit 0, no diagnostics; uses actual generated T2 spec headers.

```sh
/opt/homebrew/opt/llvm/bin/clang-format -i packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
git diff --check -- packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift packages/react-native/Libraries/WindowManager/RCTWindowManager.mm
```

PASS, each exit 0.

```sh
xcrun --sdk macosx swift -module-cache-path /private/tmp/T6-windows-macos-cache /private/tmp/T6-window-semantics.swift
```

PASS, final exit 0: standalone Foundation/Combine semantic probe verified synchronous notification delivery, shared mutable request identity, sequential shallow property merges, unchanged keys, and native NSNull. **T8 correction:** this probe bypasses the TurboModule conversion, which drops JS null object values by default; it does not prove that JS null reaches native. This probe does not mount SwiftUI views or prove runtime window behavior. First probe invocation failed to compile because its assertion compared `AnyHashable?` to unwrapped primitive literals; corrected probe assertions to `AnyHashable(...)`, reran successfully. Production typecheck was already passing.


## Focused XR verification


All run from repository root, all exit 0:

```sh
BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/XR --runInBand --watchman=false
xcrun swiftc -typecheck -target arm64-apple-xros1.0-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -module-name RCTXR -module-cache-path /private/tmp/T6-xr-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
xcrun swiftc -typecheck -target arm64-apple-ios15.1-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator27.1.sdk -module-name RCTXR -module-cache-path /private/tmp/T6-xr-ios-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
xcrun swiftc -typecheck -module-name RCTXR -module-cache-path /private/tmp/T6-xr-macos-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
/opt/homebrew/opt/llvm/bin/clang-format -i packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/XR/RCTXRModule.h
xcrun swiftc -emit-module -emit-objc-header -emit-objc-header-path /private/tmp/T6-RCTXR-Swift.h -emit-module-path /private/tmp/T6-RCTXR.swiftmodule -target arm64-apple-xros1.0-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -module-name RCTXR -module-cache-path /private/tmp/T6-xr-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
mkdir -p /private/tmp/T6-xr-headers
xcrun swiftc -emit-module -emit-objc-header -emit-objc-header-path /private/tmp/T6-xr-headers/RCTXR-Swift.h -emit-module-path /private/tmp/T6-RCTXR.swiftmodule -target arm64-apple-xros1.0-simulator -sdk /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -module-name RCTXR -module-cache-path /private/tmp/T6-xr-module-cache packages/react-native/Libraries/XR/ImmersiveBridge.swift
xcrun clang++ -fsyntax-only -fobjc-arc -fblocks -std=c++20 -DRN_BUILDING=1 -DRCT_NEW_ARCH_ENABLED=1 -Werror -Wno-deprecated-declarations -Wno-nullability-completeness -target arm64-apple-xros1.0-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk -I/private/tmp/T6-xr-headers -I/private/tmp/t2-apis-native-headers -I/private/tmp/T2-apis-codegen -Ipackages/react-native/ReactCommon -Ipackages/react-native/ReactCommon/jsi -Ipackages/react-native/ReactCommon/callinvoker -Ipackages/react-native/ReactCommon/react/nativemodule/core -Ipackages/react-native/ReactCommon/react/nativemodule/core/platform/ios packages/react-native/Libraries/XR/RCTXRModule.mm
xcrun clang++ -fsyntax-only -target arm64-apple-ios15.1-simulator -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator27.1.sdk packages/react-native/Libraries/XR/RCTXRModule.mm
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/XR/RCTXRModule.mm packages/react-native/Libraries/XR/RCTXRModule.h
git diff --check -- packages/react-native/Libraries/XR
```

Jest: 1 suite/3 tests passed (existing JS forwarding/error coverage, not native lifecycle runtime). Yarn emitted a harmless no-global-folder warning. Final visionOS source recompiled through the last header-emission command after adding scene fallback. Actual React Native headers and actual retained generated visionOS specs used with freshly emitted Swift header; no stubs. Parent runs full project builds, lint and Flow.


### Reload overlap and native-body executable


Added a main-queue-only weak process owner for the single immersive session. A replacement React module rejects a new request as already opened or closing while old invalidation is still dismissing. Ownership is released only after the old scene-data dismissal has been posted. This prevents the old module's asynchronous cleanup deleting the new module's same-ID scene data and prevents overlapping SwiftUI operations. It is another deliberate improvement over both reference forks, within findings 3/4.

Created temporary host harness files under `/private/tmp/T6-xr-harness` (not repo tests). `RCTXRModule-under-test.mm` is the actual source with only the enclosing TARGET_OS_VISION guard replaced with `#if 1` for macOS execution. Mock headers/implementations provide UIKit child containment, SwiftUI callbacks and minimal codegen protocol/types; all actual Objective-C++ request/end/invalidate/cleanup method bodies are unchanged. This exercises native state/promise logic but does not validate real UIKit/SwiftUI lifecycle notification delivery.

Exact source preparation:

```sh
python3 - <<'PY'
from pathlib import Path
source=Path('packages/react-native/Libraries/XR/RCTXRModule.mm').read_text()
Path('/private/tmp/T6-xr-harness/RCTXRModule-under-test.mm').write_text(source.replace('#if TARGET_OS_VISION', '#if 1'))
PY
```

Exact compile/run:

```sh
xcrun clang++ -std=c++20 -fobjc-arc -fblocks -framework Foundation -I/private/tmp/T6-xr-harness /private/tmp/T6-xr-harness/RCTXRModule-under-test.mm /private/tmp/T6-xr-harness/main.mm -o /private/tmp/T6-xr-harness/test
/private/tmp/T6-xr-harness/test
```

Exit 0 on initial implementation and after adding reload ownership. Assertions passed for implicit/repeated/stale dismissal, concurrent end (one dismiss action, two resolutions), invalidate during pending opening, invalidate during multiple pending end operations, calls after invalidation rejecting, cancellation/error cleanup, cross-module request rejecting until old dismissal completes, successful replacement opening, and stale old dismissal preserving replacement child. Every expected resolve/reject sequence is checked exactly; no child controllers remain. Final real-headers ObjC++ -Werror syntax command from the earlier section was rerun after ownership addition and passed.

Runtime scenario addition: trigger reload while opening/closing, attempt an immediate new `XR.requestSession('TestImmersiveSpace')` during old cleanup; it may reject `Immersive Space already opened or closing`. Retry once cleanup finishes; it must work and preserve new props. No automatic retry is introduced.

`BABEL_DISABLE_CACHE=1 node packages/react-native/scripts/codegen/validate-apple-codegen.js packages/rn-tester packages/rn-tester`: **PASS**, exit 0. RNTester's mixed-platform dependency set passes the new compatibility validation.

## CocoaPods and codegen verification


Run from repository root unless noted.

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH BABEL_DISABLE_CACHE=1 yarn test packages/react-native/scripts/codegen/__tests__ --runInBand --watchman=false --silent > /private/tmp/T6-codegen-jest.log 2>&1
```

PASS: 3 suites, 60 tests, 24 snapshots. Includes actual CLI native generation with opposing ios/visionos exclusions; actual Xcode script invocation for iphonesimulator, xrsimulator and xros; matching and differing mixed-target codegen sets. The unchanged 24 snapshots cover existing iOS app provider output. Initial run before adding the script/mixed checks passed 55 tests; one development run with a mismatched legacy library name in the new mixed-target fixture failed one assertion, corrected to the modern single-codegenConfig fixture and rerun successfully.

```sh
ruby packages/react-native/scripts/cocoapods/__tests__/autolinking_utils-test.rb
ruby packages/react-native/scripts/cocoapods/__tests__/codegen_utils-test.rb
```

PASS: 3 tests / 9 assertions, and 14 tests / 37 assertions. Includes opposite platform exclusions, exact original iOS command arguments, tvOS/macOS/nil defaults, target order, and same-platform reuse.

```sh
python3 /private/tmp/T6-run-cocoapods-tests.py > /private/tmp/T6-cocoapods-tests.log
```

The saved runner executes every cocoapods `*-test.rb` individually as `ruby <path>`, with:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 ruby <path>
```

| Suite | Tests/assertions | Failures/errors |
| --- | --- | --- |
| autolinking_utils | 3 / 9 | 0 / 0 |
| codegen_utils | 14 / 37 | 0 / 0 |
| fabric | 1 / 0 | 0 / 1 |
| jsengine | 1 / 0 | 0 / 1 |
| local_podspec_patch | 5 / 11 | 0 / 0 |
| maven_mirror_flag | 3 / 6 | 0 / 0 |
| new_architecture | 10 / 9 | 2 / 4 |
| rndependencies | 6 / 7 | 0 / 0 |
| spm | 3 / 0 | 0 / 3 |
| utils | 64 / 149 | 1 / 13 |
| visionos | 7 / 34 | 0 / 0 |

The five failing suites have exactly the same tests/assertions/failures/errors and causes recorded against upstream in T2-build.md: missing rncore_pod helper; nil installation_root; stale expected configuration and Ruby4 Pathname/mock argument errors; SPM InstallerStub lacks aggregate_targets; missing ReactNativeCoreUtils. Logs: `/private/tmp/T6-<suite>-test.rb.log`. An initial aggregate attempt `ruby -Itest -e 'Dir.glob("./packages/react-native/scripts/cocoapods/__tests__/*-test.rb").sort.each { |path| require_relative path }'` failed loading CocoaPods from the default Ruby gem path, so all suites were rerun separately in the installed gem environment, matching the prior T2 approach.

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 ruby /private/tmp/T6-autolinking-integration.rb
```

PASS using real CocoaPods and temporary podspecs: actual `list_native_modules!` selects Shared + VisionOnly on visionOS, and its iOS result JSON is byte-identical to upstream 0.88.0's actual method. Both generated autolinking manifests are byte-identical to CLI input. The baseline method was evaluated from the read-only reference source without editing it.

```sh
PATH=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/T4-verify/node22/bin:$PATH NODE_PATH=$PWD/node_modules node /private/tmp/T6-codegen-ios-parity.js > /private/tmp/T6-codegen-ios-parity.log 2>&1
```

PASS: six generated iOS native files byte-identical to upstream 0.88.0 for shared, iOS-only and visionOS-only dependencies. Probe uses the upstream executor from the read-only reference with the installed same-version compiler via NODE_PATH, disables only its install/build helper, and compares full generated file paths and bytes. No reference files were written.

```sh
node_modules/.bin/prettier --check packages/react-native/scripts/codegen/__tests__/visionos-codegen-test.js packages/react-native/scripts/codegen/generate-artifacts-executor/index.js packages/react-native/scripts/codegen/validate-apple-codegen.js packages/react-native/scripts/generate-codegen-artifacts.js
bash -n packages/react-native/scripts/react_native_pods_utils/script_phases.sh
ruby -c packages/react-native/scripts/cocoapods/codegen_utils.rb
git diff --check -- packages/react-native/scripts
```

PASS. Root handles full Flow/lint/native builds. No simulator checks specific to this build-system fix are needed beyond orchestrator installing an app fixture with `ios: null`/enabled `visionos`, then the inverse, and confirming the corresponding pod and generated provider are included/excluded on device builds as in the automated fixtures.

Tooling incident: `yarn prettier --write <three files>` expanded the repository's broad prettier script; interrupted with Ctrl-C. `git diff --name-only` immediately afterward showed only expected T6 modified paths, with no unrelated tracked changes. Follow-up formatting used the direct `node_modules/.bin/prettier` executable. A first attempt to create the /private/tmp parity probe with apply_patch was rejected as outside its project root; the same permitted temporary file was created with the shell instead. No permission escalation or Git mutation occurred.

## Final review

A second read of the XR lifecycle found the cross-module scene-data race and prompted the process-owner gate described above. The linking review confirmed documented SwiftUI delegate forwarding and identified the required visionOS-only SwiftPM dependency, which is included and manifest-checked. Window restoration/routing/merging and callback semantics were reviewed separately from their implementation.

## Native project builds

All four commands below finished with exit 0 and **BUILD SUCCEEDED**. Commands are reproduced from their actual recorder JSON, with cwd `$R/packages/rn-tester`. Both architectures were compiled/linked. The final XR Objective-C++ objects are newer than the final source in both architecture directories, confirming the reload-owner fix was included. CocoaPods' generated BUILD_DIR puts final products under RNTester's ignored build directory; every derived-data and OBJROOT path is under the requested scratch `derived/T6-*` prefix.

| Build | Result | Log / command record |
| --- | --- | --- |
| visionos-pods | PASS, arm64 + x86_64 | `$V/visionos-pods.log`, `$V/visionos-pods.json` |
| visionos-app | PASS, arm64 + x86_64 | `$V/visionos-app.log`, `$V/visionos-app.json` |
| ios-pods | PASS, arm64 + x86_64 | `$V/ios-pods.log`, `$V/ios-pods.json` |
| ios-app | PASS, arm64 + x86_64 | `$V/ios-app.log`, `$V/ios-app.json` |

### visionos-pods

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

### visionos-app

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

### ios-pods

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

### ios-app

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

Artifacts:

- `$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app`
- `$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app`

Warnings include existing RCTAppDelegate deprecation and script-output warnings. The new visionOS-only delegate compiles to an empty object on iOS, producing a harmless no-symbols libtool warning. No compiler errors or unguarded-availability failures occurred. The Swift sandbox flag was supplied on the command line only. CoreSimulator connection messages in the logs did not prevent project compilation/linking; no simulator launch or workspace command was attempted.

Final artifact checks:

```sh
xcrun lipo -archs packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app/RNTester-visionOS.debug.dylib
xcrun lipo -archs packages/rn-tester/build/Debug-iphonesimulator/RNTester.app/RNTester.debug.dylib
node_modules/.bin/prettier --write visionos-port/reports/T6-review-fixes.md
git diff --check
git status --short
```

Both lipo commands exit 0 and print `x86_64 arm64`. Report formatting and final diff check pass. Final status contains only the intended T6 source/test/report changes plus the three pre-existing untracked T5/T6 prompt/report files. No generated code, lockfile, project, package version, or sandbox build-setting changes are included.
