# T7-scene-crash-fix

## Result

Fixed the T6 scene-configuration recursion hazard. `RCTAppDelegate` now captures launch options directly and returns a fresh, nil-name configuration for every scene role without assigning a delegate. Removed `RCTVisionSceneDelegate.h/.mm`. All four requested direct project builds passed for **arm64 + x86_64**: RNTester Pods and app for both xrsimulator and iphonesimulator. Focused Jest, Ruby, Flow, lint, and six host-side launch-link/configuration scenarios passed.

**Simulator execution remains for the orchestrator.** No claim is made that T7 has run in SwiftUI or that the crash has been reproduced and eliminated on a simulator in this task. Native build logs still show the sandbox's CoreSimulator service connection failures, but direct project compilation/linking succeeds.

## Diagnosis and change

The supplied `shots/RNTester-visionOS-2026-10-21-024255.ips` records main-thread `EXC_BAD_ACCESS`, excessive recursion/stack exhaustion, `originalLength = 18498`, and recursion depths of 4607 for `AppSceneDelegate.responds(to:)` and 4622 for `AppSceneDelegate.scene(_:willConnectTo:options:)`. UIKit's scene-delegate installation appears between those recursive paths.

The starting T6 code copied `connectingSceneSession.configuration` for every role and replaced `delegateClass` only for `UIWindowSceneSessionRoleApplication`. Thus a non-application connection could return SwiftUI's own existing delegate class as its user forwarding target. This source defect and crash signature support the supplied diagnosis; private SwiftUI internals were not instrumented. Apple's [UIApplicationDelegateAdaptor documentation](https://developer.apple.com/documentation/swiftui/uiapplicationdelegateadaptor) uses a fresh configuration and explains that SwiftUI manages the supplied user delegate and forwards callbacks to it.

Changes relative to the starting T6 worktree:

- `Libraries/AppDelegate/RCTAppDelegate.mm`: under `TARGET_OS_VISION`, forward session/options to `+[RCTLinkingManager sceneSession:willConnectWithOptions:]`, then return `[[UISceneConfiguration alloc] initWithName:nil sessionRole:connectingSceneSession.role]`. Never read/copy the session configuration or install a scene delegate.
- `Libraries/LinkingIOS/RCTLinkingManager.{h,mm}`: replace the unused-scene forwarding API with a session/options API. Keep the application-role filter **before** `dispatch_once`. Capture URLContexts first, otherwise a browsing-web user activity with a nonnil webpageURL. Skip browsing activities whose webpageURL is nil so they cannot hide a later valid universal link.
- Keep the process-wide once token even when the first application-role connection has no URL. Later connections, module recreation, and warm callbacks cannot replace that initial value. `onOpenURL:` still posts every notification, including repeated URLs identical to the initial URL, preserving T2-native NEW-5.
- Both `RCTAppDelegate.h` and `RCTLinkingManager.h` document the subclass contract: an override of `application:configurationForConnectingSceneSession:options:` must call super or forward the same session and options to the capture helper, including URL-less connections, and return a fresh configuration without SwiftUI's own delegate class.
- Delete the two T6-only `RCTVisionSceneDelegate` files. They were untracked at task start, so their removal does not appear as tracked deletions in `git diff`. Regenerate Pods to remove their source/header references.
- `Package.swift`: retain the **visionOS-only** AppDelegate → Linking dependency because `RCTAppDelegate` now calls Linking directly; update its comment. There was no explicit scene-delegate filename wiring to remove. The evaluated manifest confirms that the dependency condition is only `visionos`.

This is a correction to the T6 finding-6 redesign, not a new code transplant. Both read-only reference forks (`gh/callstack-0.79` and `gh/reactvision-0.86` under PLAN.md's reference directory) cache the first SwiftUI `onOpenURL` value and suppress its event. T7 intentionally retains the T6/T2 improvements over that reference behavior: launch-only capture, permanent null for an empty launch, and unsuppressed warm notifications. No other T6 source behavior was changed.

All new Objective-C declarations/imports/behavior are inside `TARGET_OS_VISION`; no public JS API or generated output was edited. No Git writes, publication, branch/worktree creation, or reference-tree edits occurred. Other pre-existing T6 modifications remain intact. Pod installation introduced no tracked app project or lockfile delta.

## Environment and exact commands

Commands below ran from the repository root unless a different cwd is stated. Variables abbreviate these exact paths:

```sh
R=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos
S=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad
V="$S/T7-scene-crash-fix"
```

Native builds reuse the existing T6 derived-data/OBJROOT directories for incremental rebuilds, using T4's direct-project approach. Both Pods logs show `RCTAppDelegate.mm` and `RCTLinkingManager.mm` recompiled for both architectures, followed by successful app links. The refreshed archives were checked for removal of `RCTVisionSceneDelegate`. `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` is command-line-only in **all four** builds; no project/source build setting was changed for the sandbox. Xcode is 27.1, SDKs xrsimulator27.0 and iphonesimulator27.1. Existing deprecation/nullability warnings and CoreSimulator diagnostics remain; these are successful builds, not warning-free builds.

`$V/run.py` records argv, cwd, explicit environment overrides, timestamps, exit status and full output in matching `.json`/`.log` files. `$V/builds.py` replays the four T6 command records sequentially and records fresh T7 results. JS/Ruby records live under `$V/checks/`, and the native-method probe has its own `$V/scene-probe/runs.json`.

### CocoaPods and native builds

All commands in this section ran in `$R/packages/rn-tester` and **exited 0**. Pod install reported **97 dependencies / 96 installed pods**. Each xcodebuild reported **BUILD SUCCEEDED**.

**pod-install** — log `$V/pod-install.log`, exit 0.

```sh
RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

**visionos-pods** — log `$V/visionos-pods.log`, exit 0.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**visionos-app** — log `$V/visionos-app.log`, exit 0.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-visionos-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-pods** — log `$V/ios-pods.log`, exit 0.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods -jobs 2 OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-app** — log `$V/ios-app.log`, exit 0.

```sh
BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app -jobs 4 BUILD_DIR=/Users/intzero/Documents/Pingroom/react-native-mindzone-visionos/packages/rn-tester/build OBJROOT=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-ios-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

Updated unsigned Debug simulator artifacts:

- `$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app`
- `$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app`

Both commands below exited 0 and reported `x86_64 arm64`:

```sh
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-xrsimulator/RNTester-visionOS.app/RNTester-visionOS"
xcrun lipo -archs "$R/packages/rn-tester/build/Debug-iphonesimulator/RNTester.app/RNTester"
```

### Jest, Ruby, Flow, lint

Node **22.23.3** from the T4 scratch installation and Yarn **1.22.22** were verified with `node --version` / `yarn --version` under the same JS environment below. All commands exited **0**. No Linking Jest suite exists; the native capture path is checked separately by the extracted-method probe.

```sh
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/Components/Keyboard/__tests__ packages/react-native/Libraries/WindowManager/__tests__ packages/react-native/Libraries/XR/__tests__ packages/react-native/scripts/codegen/__tests__ --runInBand --watchman=false
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/T7-flow
PATH="$S/T4-verify/node22/bin:$PATH" BABEL_DISABLE_CACHE=1 yarn lint
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 ruby packages/react-native/scripts/cocoapods/__tests__/autolinking_utils-test.rb
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 ruby packages/react-native/scripts/cocoapods/__tests__/codegen_utils-test.rb
```

| Check | Result | Log under `$V/checks/` |
| --- | --- | --- |
| Focused Jest | 7 suites / 76 tests / 24 snapshots passed | `jest.log` |
| Flow | 0 errors | `flow.log` |
| Lint | 0 ESLint errors/warnings | `lint.log` |
| Ruby autolinking | 3 tests / 9 assertions, 0 failures/errors | `ruby-autolinking.log` |
| Ruby codegen | 14 tests / 37 assertions, 0 failures/errors | `ruby-codegen.log` |

Yarn emitted its existing global-folder warning. Full-repository Jest and all CocoaPods Ruby suites were not rerun; the relevant suites above were run as requested.

### Native scene/linking logic probe

Cwd: `$V/scene-probe`. Every command below exited **0**:

```sh
python3 "$V/scene-probe/generate.py"
xcrun --sdk macosx clang++ -fobjc-arc -fblocks -fmodules -fmodules-cache-path="$V/scene-probe/module-cache" -Wall -Wextra -Werror -framework Foundation "$V/scene-probe/probe.mm" -o "$V/scene-probe/probe"
"$V/scene-probe/probe" empty
"$V/scene-probe/probe" cold
"$V/scene-probe/probe" universal
"$V/scene-probe/probe" universal-skip-nil
"$V/scene-probe/probe" precedence
"$V/scene-probe/probe" nonweb
```

The generator extracts the actual app-delegate configuration method plus Linking's capture, onOpenURL, notification-posting and getInitialURL methods without changing their bodies. `extraction.json` records source locations and hashes. Foundation notifications and NSUserActivity are real; UIKit session/configuration/options types are minimal test containers. An ordered NSSet fixture makes the nil-then-valid activity case deterministic.

All six modes passed. Each verifies seven distinct fresh configurations with nil name/delegate, unchanged role, and **zero reads** of a poisoned existing session configuration. Immersive/external role fixtures before the first app-role connection do not consume capture. Cases cover empty launch, custom URL, universal URL, nil/irrelevant activities before a valid universal link, URLContexts precedence, and ignoring unrelated activity types. Later scene callbacks and new module/app-delegate instances preserve the initial value. Three warm callbacks each post once, including duplicate URLs and URLs identical to the initial URL; warm delivery before the first post-connection initial-URL read cannot turn null into a URL.

This is a host logic check, not UIKit/SwiftUI lifecycle execution or proof that the simulator no longer recurses. Full results/commands/limitations are in `$V/scene-probe/summary.md`, with per-mode logs and `runs.json`.

### Non-visionOS isolation and source integration

Commands from `$R`, all final runs **exit 0**:

```sh
python3 "$V/nonvisionos-source-check.py"
swift package --package-path packages/react-native --cache-path /private/tmp/T7-spm-cache --scratch-path /private/tmp/T7-spm-build --disable-sandbox dump-package
python3 "$V/artifact-check.py"
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/AppDelegate/RCTAppDelegate.h packages/react-native/Libraries/AppDelegate/RCTAppDelegate.mm packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.h
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror --lines=147:181 packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm
git diff --check
```

- **Local preprocessing comparison:** for `RCTAppDelegate.{h,mm}` and `RCTLinkingManager.{h,mm}`, preprocess with `TARGET_OS_VISION=0` and `TARGET_OS_SIMULATOR=1`, preserving import/include identities as inert tokens instead of loading dependencies. The resulting local source is identical to both `HEAD` and `base/upstream-v0.88.0`. The scene-configuration method is absent. Full dependency compilation is supplied by the iOS project build, not claimed by this local comparison.
- **Compiled symbols:** `artifact-check.py` runs `xcrun nm -m <object>` against both architectures' actual AppDelegate and Linking objects. The scene-configuration implementation and launch-capture helper are present only on visionOS and absent on iOS. It also checks both AppDelegate archives and the regenerated Pods project contain no `RCTVisionSceneDelegate`.
- **SwiftPM:** evaluated manifest retains AppDelegate → Linking only for `visionos`; no removed delegate path is listed. SwiftPM user-cache access warnings did not prevent manifest evaluation. A source SwiftPM application build was not run.
- **Formatting:** complete touched AppDelegate files and Linking header pass. Only the changed Linking implementation range was checked to avoid the unrelated pre-existing formatting diagnostics documented by T6.

Logs: `$V/nonvisionos-source-check-final.log`, `swiftpm-manifest.log`, `artifact-check-final.log`, `clang-format.log`, `clang-format-linking.log`, and `diff-check.log`. The first local preprocessing run passed but warned about redefining SDK target macros; the final script explicitly undefines them first and passes without those warnings. An initial scratch SwiftPM assertion used the wrong JSON array index; inspection corrected it. The first artifact check used an archive name without CocoaPods' platform suffix and exited 1; correcting the test path to the actual `libReact-RCTAppDelegate-visionOS.a` / `-iOS.a` produced the final pass. These were probe issues, not source/build failures; the failed artifact log is retained.

## Orchestrator runtime handoff

Use the rebuilt visionOS app above with Metro. Re-run the requested immersive open/close, request/end race, close-hosting-window, reload, and launch-URL-null scenarios. No simulator commands/UI interactions were attempted here. In addition:

1. **First/repeated immersive connections:** open and end `XR.requestSession('TestImmersiveSpace')` repeatedly, including after opening `SecondWindow`, closing main, and restoring sessions across process termination. Confirm no AppSceneDelegate recursion for any non-window connection and each promise settles once.
2. **Cold custom URL:** terminate and launch through `rntester://cold-one`; `Linking.getInitialURL()` must return that URL before/after SwiftUI's URL callback. Open a different warm URL and the same cold URL again while listeners are mounted; each delivered callback must emit and the initial value must stay cold-one.
3. **Empty launch before first JS read:** launch with no URL, register a URL listener, deliver the first warm URL before calling getInitialURL, then read it. It must be null and stay null after background/foreground, later windows, scene reconnection, and React reload.
4. **Universal links:** use an entitled host and a real associated-domain URL for cold and warm launches. Cold userActivities must populate the initial URL, warm deliveries must emit, and later scenes must not replace the process launch value. RNTester's custom-scheme fixture alone cannot establish this delivery path.
5. **Restoration/secondary launch:** cold-start with restored secondary windows, including main previously closed, then open immersive space. Confirm SwiftUI invokes the configuration callback for the first application-role connection and capture occurs before the first JS read. Also test a URL that opens another window while the process is already running: it must emit through runtime delivery without replacing the initial URL.
6. **Subclass forwarding:** test an app subclass that overrides scene configuration and calls super, and a custom implementation that forwards session/options directly as documented. Include URL-less options and non-application roles. A custom user delegate, if the app supplies one, must never be SwiftUI's internal delegate class.

These runtime checks establish lifecycle ordering, restoration, system URL confirmation and universal-link delivery that host probes and compilation cannot prove. Device/Release, minimum-version execution, framework-mode CocoaPods, source SwiftPM app integration, macOS/tvOS/Android builds, and simulator execution were not run in T7. The guarded source/preprocessing evidence and iOS builds establish no iOS-visible change in the touched code; no broader runtime claim is made.
