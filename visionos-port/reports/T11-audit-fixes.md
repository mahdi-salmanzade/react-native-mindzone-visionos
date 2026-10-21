# T11-audit-fixes

Completed 2026-10-21. All requested source fixes are implemented. The three
orchestrator edits were retained. No Git writes, commits, publication, or reference
tree edits were performed.

## Results

| Check | Result |
| --- | --- |
| Full `yarn flow-check` | PASS, 0 errors |
| Full `yarn lint` | PASS |
| Focused Jest, including template | PASS, 8 suites / 84 tests / 24 snapshots |
| New podspec regression | PASS, 1 test / 2 assertions; bad pre-fix podspec fails |
| RNTester Podfile DSL | PASS, 6 tests / 17 assertions |
| Existing CocoaPods Ruby suite | FAIL, existing harness/expectation problems reproduced without new tests and against upstream; details below |
| Swift 5 and 6, xros 1.0 simulator target | PASS, all added Swift targets; extra module-emission and iOS-guard checks also pass |
| Linking host probe | PASS, 8 independent launch scenarios |
| Existing window-routing host probe | PASS, synchronous claims, one host, reentrancy and host removal |
| RNTester visionOS Pods + app | BUILD SUCCEEDED, Debug xrsimulator, arm64 and x86_64 |
| RNTester iOS Pods + app after plain install | BUILD SUCCEEDED, Debug iphonesimulator, arm64 and x86_64 |
| Template iOS and visionOS projects | `plutil -lint` and `xcodebuild -list` PASS |
| Prepack and npm pack dry runs | PASS, 4,565 runtime paths / 82 template paths |

No public JS signatures or types changed, so `yarn build-types` and
`yarn test-generated-typescript` were not required or rerun. No full SwiftPM
package link, device/Release/framework-mode build, fresh registry install,
Android build, simulator interaction, or screenshots are claimed in this task.

## Changes, provenance, and deviations

These are fixes to the existing Callstack 0.79.6 / ReactVision 0.86.4 port, based
on the two T10 audits and the orchestrator's consumer-install evidence, rather
than new reference transplants.

- **A:** `React.podspec` remains byte-for-byte upstream. The new regression
  discovers visionOS-only pods from `use_react_native!`, scans all runtime
  podspecs for platform-scoped dependencies on them, and was proved to fail with
  the original four offending declarations in a separate temporary tree.
- **B:** Kept the template's `!Platform.isVision` StatusBar guard. The existing
  welcome-content test and new iOS/visionOS rendering cases all pass.
- **C / 8:** Kept the visionOS project fix and removed the same four target-level
  overrides from the iOS project. Both retain their two project-level C++20
  settings, matching upstream private/helloworld. Both project formats/listings
  validate; no other template project changes were made.
- **1:** `RCTSceneContextKey.defaultValue` is a shared
  `nonisolated(unsafe) static let`, preserving singleton identity. Module
  emission exposed a second Swift 6 error, fixed with a local
  `nonisolated(unsafe)` notification binding in the already visionOS-guarded
  synchronous router callback. No actor hop, language-mode downgrade, or
  off-platform change was introduced. The existing `MainActor.assumeIsolated`
  runtime check remains. See the full Swift checks below.
- **2:** Removed both `scripts/ios-prebuild` publish entries. No shipped
  CocoaPods/CLI/SwiftPM consumer caller requires them. Source SwiftPM preparation
  is checkout-only; consumers download separately produced artifacts. The
  workspace's `plist` 3.1.0 is therefore a maintainer dependency, not a new runtime
  dependency. Updated maintainer docs and release content assertions. The root
  README documents the boundary; prepack copied it to the package README.
- **3:** A visionOS-only process capture flag permits the first restored-session
  `onOpenURL` to seed initial URL only before any new-session capture, first read,
  or first application-role scene activation. New-session no-URL capture seals
  null permanently; all subsequent URL events still emit. An early constructor
  registers the activation observer. A first attempt using `+load` collided with
  `RCT_EXPORT_MODULE`; the native build caught it, and the permanent probe now
  compiles the actual registration macro. This intentionally differs from the
  reference forks' unbounded first-URL capture/event suppression and preserves
  T7's null and event-delivery guarantees.
- **4:** RNTester requires explicit `RCT_ENABLE_VISIONOS=1` plus source core.
  Source core alone stays iOS-only. Only the CI pod-install env changed. Root and
  RNTester READMEs explain the opt-in. Real plain install used prebuilt core and
  produced no visionOS targets or exclusive pods.
- **5:** Added the six requested shared-surface exceptions to the root README's
  Compatibility contract; prepack copied it into the runtime README. The simple
  codegen filter now omits `FBReactNativeSpec_visionOS` for ordinary iOS apps,
  retaining it for an explicit visionOS dependency platform and library/prepack
  generation. Actual-generation tests prove both paths.
- **6:** The XR example disables/guards Open while opening and preserves open
  state on rejection. Open remains available after a successful request because
  Digital Crown dismissal has no JS state event; disabling it for all `isOpen`
  time would prevent reopening. Tests cover pending duplicate calls, a rejected
  duplicate while open, retained state, and another successful request.
- **7:** Added generated-app `template/LICENSE`, identical to the wrapper license.
  Both retain react-native-community and include Meta, Callstack and ReactVision
  MIT notices. Release validation now requires the generated-app license, with a
  missing-license regression.

All changed native logic is within existing `TARGET_OS_VISION` / `os(visionOS)`
guards. Linking's off-visionOS token comparison against upstream also passes.
Shared packaging, documentation, build, example and test changes implement the
explicitly requested exceptions. No unrelated upstream refactoring was done.

## Exact command journal

Commands ran from the repo root unless a different cwd is given. The local
recorder `/private/tmp/T11-audit-fixes/run.py` saved each command's exit code,
duration and complete output as `<name>.json` / `<name>.log` in that directory.
Below, path substitutions shorten those recorded commands:

```sh
R=$REPO
S=$SCRATCH
V=/private/tmp/T11-audit-fixes
NODE22=$S/T4-verify/node22/bin
```

Xcode 27.1 (27A9275), xrsimulator SDK 27.0, Apple Swift 6.4, CocoaPods 1.16.2,
Yarn 1.22.22. Flow/lint/codegen-release tests use T4's Node 22.23.3; template/XR
checks and CocoaPods codegen also work with the default Node 26 here.

### JavaScript, probes, packaging, and project inspection

```sh
PATH=$NODE22:$PATH BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir $V/flow
PATH=$NODE22:$PATH BABEL_DISABLE_CACHE=1 yarn lint
BABEL_DISABLE_CACHE=1 yarn test packages/rn-tester/js/examples/XR/__tests__/XRExample-test.js packages/react-native/Libraries/XR packages/react-native/Libraries/WindowManager --runInBand --watchman=false
BABEL_DISABLE_CACHE=1 node -r /private/tmp/T3-template-alias.cjs node_modules/jest/bin/jest.js --config packages/visionos-template/template/jest.config.js --runInBand --watchman=false --cacheDirectory=$V/template-jest-cache
PATH=$NODE22:$PATH yarn test packages/react-native/scripts/codegen/__tests__ scripts/__tests__/oot-release-test.js --runInBand --watchman=false
python3 visionos-port/tests/linking-launch-probe.py
python3 visionos-port/tests/window-routing-probe.py
BABEL_DISABLE_CACHE=1 yarn --cwd packages/react-native prepack
npm pack ./packages/react-native --dry-run --ignore-scripts --offline --json
npm pack ./packages/visionos-template --dry-run --ignore-scripts --offline --json
BABEL_DISABLE_CACHE=1 npx -y react-doctor@latest . --verbose --diff
```

All exit 0. Final Flow/lint logs: `flow-final.log`, `lint-final.log`; final XR log:
`jest-xr-final.log` (3 suites/12 tests); template log: `jest-template.log` (1 suite/3
tests); codegen/release log: `/private/tmp/T11-codegen-release-jest-node22.log`
(4 suites/69 tests/24 snapshots). React Doctor exits 0, score 98/100 for the runtime,
with one existing array-lookup warning at codegen executor line 131. No setup or
project dependency was installed by React Doctor.

The template's Node preload maps the absent installed direct fork name to
`$R/packages/react-native` in this checkout; it does not mock React rendering or
edit dependencies. Fresh installed-package testing remains the orchestrator's
consumer gate. Initial codegen Jest attempts hit Watchman sandbox access, then
Node 26's removed `fs.rmdirSync({recursive:true})` in existing test cleanup; the
Node 22 retry above passed and cleaned its temporary fixture trees.

The pack assertions verified: zero ios-prebuild paths; generated vision header,
implementation and JSI header retained; consumer SPM scripts retained;
`template/LICENSE` present; both README copies and both license copies identical;
React.podspec bytes identical to upstream. One scratch assertion initially used a
non-nested generated-header path; correcting it to the actual nested path passed.
Prepack generated specs from source; none were hand-edited.

The `template-projects` recorder invoked these exact child commands, all exit 0:

```sh
plutil -lint packages/visionos-template/template/ios/HelloWorld.xcodeproj/project.pbxproj
plutil -lint packages/visionos-template/template/visionos/HelloWorld.xcodeproj/project.pbxproj
xcodebuild -project packages/visionos-template/template/ios/HelloWorld.xcodeproj -list
xcodebuild -project packages/visionos-template/template/visionos/HelloWorld.xcodeproj -list
```

Both list HelloWorld/HelloWorldTests targets and the HelloWorld scheme. Simulator
service warnings under the sandbox do not prevent these project checks or the
builds below; no simulator launch is inferred from build success.

### Native install and build commands

All `-disable-sandbox` settings below are command-line-only. No persisted build
settings were added. Direct projects and T4's existing DerivedData directories
were used; these were incremental compile/link builds, not clean builds.

**visionos-pod-install** — cwd `$R/packages/rn-tester`, exit **0**, log `visionos-pod-install.log`.

```sh
env RCT_ENABLE_VISIONOS=1 RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

**visionos-pods-build** — cwd `$R/packages/rn-tester`, exit **65**, log `visionos-pods-build.log`.

```sh
env BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath $S/derived/rntester-visionos-pods -jobs 4 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**visionos-pods-build-final** — cwd `$R/packages/rn-tester`, exit **0**, log `visionos-pods-build-final.log`.

```sh
env BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath $S/derived/rntester-visionos-pods -jobs 4 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**visionos-app-build** — cwd `$R/packages/rn-tester`, exit **0**, log `visionos-app-build.log`.

```sh
env BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug -destination 'generic/platform=visionOS Simulator' -derivedDataPath $S/derived/rntester-visionos-app -jobs 4 BUILD_DIR=$R/packages/rn-tester/build OBJROOT=$S/derived/rntester-visionos-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-pod-install** — cwd `$R/packages/rn-tester`, exit **0**, log `ios-pod-install.log`.

```sh
env -u RCT_ENABLE_VISIONOS -u RCT_USE_PREBUILT_RNCORE -u RCT_USE_RN_DEP -u USE_FRAMEWORKS pod install
```

**ios-pods-build** — cwd `$R/packages/rn-tester`, exit **0**, log `ios-pods-build.log`.

```sh
env BABEL_DISABLE_CACHE=1 xcodebuild -project Pods/Pods.xcodeproj -scheme Pods-RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath $S/derived/rntester-ios-pods -jobs 2 OBJROOT=$S/derived/rntester-ios-pods/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-app-build** — cwd `$R/packages/rn-tester`, exit **0**, log `ios-app-build.log`.

```sh
env BABEL_DISABLE_CACHE=1 xcodebuild -project RNTesterPods.xcodeproj -scheme RNTester -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath $S/derived/rntester-ios-app -jobs 4 BUILD_DIR=$R/packages/rn-tester/build OBJROOT=$S/derived/rntester-ios-app/Build/Intermediates.noindex 'OTHER_SWIFT_FLAGS=$(inherited) -disable-sandbox' CODE_SIGNING_ALLOWED=NO build
```

**ios-pods-scope-final** — cwd `$R/packages/rn-tester`, exit **0**, log `ios-pods-scope-final.log`.

```sh
env GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/opt/ruby/bin/ruby -rxcodeproj -e 'p = Xcodeproj::Project.open("Pods/Pods.xcodeproj"); bad = p.targets.select { |t| t.name.include?("visionOS") || %w[React-RCTSwiftExtensions React-RCTXR React-RCTWindowManager React-RCTFBReactNativeSpecVisionOS].include?(t.name) }; abort bad.map(&:name).join("\n") unless bad.empty?; puts "PASS: no visionOS targets or exclusive pods in plain iOS install"'
```

**restore-mixed-pod-install** — cwd `$R`, exit **0**, log `restore-mixed-pod-install.log`.

```sh
env RCT_ENABLE_VISIONOS=1 RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install --project-directory=packages/rn-tester
```

**restore-mixed-pod-install-final** — cwd `$R/packages/rn-tester`, exit **0**, log `restore-mixed-pod-install-final.log`.

```sh
env RCT_ENABLE_VISIONOS=1 RCT_USE_PREBUILT_RNCORE=0 BABEL_DISABLE_CACHE=1 pod install
```

The first Pods build failed on duplicate `+load`; the constructor fix and
strengthened host probe preceded the passing native build. Both final app builds
and both final Pods builds reported `BUILD SUCCEEDED`. The plain iOS install
explicitly unset visionOS/source-core/framework selectors and installed 94
dependencies / 93 pods. A real Xcodeproj inspection confirmed no visionOS targets
or exclusive pods. That inspection initially used system Ruby without xcodeproj;
the recorded Homebrew Ruby retry passed.

The mixed install has 97 dependencies / 96 pods. After the iOS build, the
plain-install project/manifest/lock outputs were saved as `$V/plain-ios-*`.
Only our temporary generated project and manifest changes were restored from
their unchanged initial `HEAD` contents using read-only `git show`, then CocoaPods
regenerated the final mixed installation. This avoids incidental UUID and privacy
ordering churn; the final project and privacy manifest have no diff. A restoration
attempt with `--project-directory` from repo root changes RNTester's `Dir.pwd`
app-path input; it was superseded by `restore-mixed-pod-install-final` from the
RNTester directory. The final install uses T4's correct working directory.

The regenerated lockfile removes React's four bad dependency edges, changes
React's checksum, refreshes checksums for the four existing visionOS podspecs
(none of those four podspec files was edited by T11), and records the new Podfile
checksum. Pod versions and the mixed set remain the
same. It is intentionally the mixed source-core lock, as in T4. A future plain
install legitimately regenerates it for upstream-default iOS prebuilt core.

## CocoaPods regression tests and existing-suite baseline


From repository root, unless otherwise stated:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/bin/ruby packages/react-native/scripts/cocoapods/__tests__/visionos_podspec_dependencies-test.rb
```

Exit 0: 1 test, 2 assertions. The package scan passes with the orchestrator fix preserved.

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec ruby packages/rn-tester/scripts/__tests__/visionos_podfile-test.rb
```

Exit 0: 6 tests, 17 assertions. Ruby is Homebrew 4.0.7, CocoaPods 1.16.2. Only installed colored2 future-frozen-literal warnings.

Negative regression proof: copied the new regression and current react_native_pods.rb to `/private/tmp/T11-podspec-negative-probe`, and wrote `git show HEAD:packages/react-native/React.podspec` into that temporary tree (HEAD has all four bad dependencies; working file was never edited). Ran the same regression command from that temporary root. Exit 1 as expected: 1 test / 2 assertions / 1 failure, listing all four forbidden dependencies. Log `/private/tmp/T11-podspec-negative-probe.log`.

```sh
# cwd packages/react-native/scripts
PATH=/opt/homebrew/bin:$PATH GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec bash run_ruby_tests.sh
```

Exit 1 before assertions: existing `spm-test.rb` loads real CocoaPods after `PodMock.rb`, whose `Pod::Executable` is a Class; real CocoaPods needs a Module (`wrong argument type Class (expected Module)`). Log `/private/tmp/T11-cocoapods-aggregate-tests.log`. This is not caused by either new test: the new RNTester real-DSL test is outside this runner, and the podspec regression requires only test/unit. An initial invocation without explicit PATH selected macOS Ruby 2.6 inside bash and could not load the Homebrew gems; the recorded retry above uses the intended Ruby.

```sh
# cwd packages/react-native/scripts
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/bin/ruby -Itest -e 'Dir.glob("**/*-test.rb").reject { |path| path.end_with?("/spm-test.rb") }.each { |path| require_relative path }'
```

Exit 1: 118 tests / 313 assertions / 8 failures / 1 error. Log `/private/tmp/T11-cocoapods-mock-tests.log`. Existing failures: codegen FileUtils cleanup mock; missing rncore_pod spy in Fabric; two stale new-architecture header-path expectations; three stale script-phase snapshots; Hermes macro expectation; expanded header-search expectation.

```sh
# same cwd; exclude the new test as a pre-T11 control
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/bin/ruby -Itest -e 'Dir.glob("**/*-test.rb").reject { |path| path.end_with?("/spm-test.rb", "/visionos_podspec_dependencies-test.rb") }.each { |path| require_relative path }'
```

Exit 1: 117 tests / 311 assertions / exactly the same 8 failures / 1 error. Log `/private/tmp/T11-preexisting-cocoapods-mock-tests.log`. Both lists of failing test names match exactly.

Upstream baseline: extracted only tracked `base/upstream-v0.88.0` scripts into `/private/tmp/T11-upstream-ruby-baseline` using read-only git archive and added the needed `sdks/hermes-engine/hermes-utils.rb` using read-only git show. No git writes. From that snapshot's `packages/react-native/scripts`, ran the same aggregate command excluding spm. Exit 1: 102 tests / 258 assertions / 7 failures / 1 error. All failures/errors match current tree except the current fork's codegen FileUtils load-order failure. Log `/private/tmp/T11-upstream-cocoapods-mock-tests.log`. The initial incomplete snapshot run stopped because the Hermes helper was absent; it was rerun after adding the helper from the same upstream revision.

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec /opt/homebrew/bin/ruby packages/react-native/scripts/cocoapods/__tests__/spm-test.rb
```

Ran both in current repository and upstream snapshot. Both exit 1: 3 tests / 0 assertions / 3 errors, all `InstallerStub` missing `aggregate_targets`. Logs `/private/tmp/T11-ruby-spm-test.log`, `/private/tmp/T11-upstream-spm-tests.log`.

Also ran every `*-test.rb` under packages/react-native/scripts individually. Exact per-file commands, counts, exits and log paths are in `/private/tmp/T11-ruby-file-results.json`. Individually, autolinking (3/9), codegen (14/37), local podspec patch (5/11), Maven mirror (3/6), RN dependencies (6/7), visionOS (7/34), and new regression (1/2) pass. Others fail on existing missing shared setup and/or stale expectations. The aggregate/mock run above provides the more meaningful shared-context result.

`git diff --check -- packages/rn-tester/Podfile packages/rn-tester/README.md .github/actions/test-visionos-rntester/action.yml`: exit 0.

No JS or types changed in this subtask. Native installs and builds are recorded above. No existing Ruby harness, mocks, snapshots, or production code was changed to hide unrelated failures.


## Swift verification detail


`xcrun swiftc --version` reports Apple Swift 6.4 (swiftlang-6.4.0.34.1); SDK `/Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk`.

Repeatable preparation/execution script: `/private/tmp/T11-swift-check.py`; full per-command stdout/exit metadata: `/private/tmp/T11-swift-check/results.json`. The script creates a temporary include tree of symlinks to actual repository headers plus minimal Clang modules `React` and `RCTSwiftExtensionsObjC`. It does not stub Swift types or SDK APIs. The adapter imports an emitted RCTSwiftExtensions module built from all real sources. This verifies Swift source/ObjC boundary compilation, not full SwiftPM package dependency resolution/linking. `-disable-sandbox` is supplied only on compiler command lines to allow the Observation macro process under this sandbox; no build settings changed.

Initial short checks using the identical `/private/tmp/t2-apis-swift-check/headers` tree also passed for both SwiftExtensions language modes and XR modes; the final harness recreates its own include tree and repeats all checks. An initial full harness failed at Swift 6 extension module emission, exposing the router error described above; corrected harness then passes every positive check.

Exact final Swift commands and results:

### extensions-typecheck-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -D DEBUG -D SWIFT_PACKAGE -I /private/tmp/T11-swift-check/headers -module-name RCTSwiftExtensions $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift
```

Exit 0 (expected 0).

### xr-typecheck-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -module-name RCTXR $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

Exit 0 (expected 0).

### xr-emit-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/RCTXR-5.swiftmodule -module-name RCTXR $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

Exit 0 (expected 0).

### extensions-module-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/modules-5/RCTSwiftExtensions.swiftmodule -D DEBUG -D SWIFT_PACKAGE -I /private/tmp/T11-swift-check/headers -module-name RCTSwiftExtensions $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift
```

Exit 0 (expected 0).

### adapter-typecheck-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -I /private/tmp/T11-swift-check/modules-5 -I /private/tmp/T11-swift-check/headers -module-name ReactVisionOS $REPO/packages/react-native/scripts/spm/visionos/ReactVisionOS.swift
```

Exit 0 (expected 0).

### swiftui-typecheck-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -module-name RCTSwiftUI $REPO/packages/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift
```

Exit 0 (expected 0).

### swiftui-emit-5

```sh
xcrun --sdk xrsimulator swiftc -swift-version 5 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/RCTSwiftUI-5.swiftmodule -module-name RCTSwiftUI $REPO/packages/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift
```

Exit 0 (expected 0).

### ios-guards-typecheck-5

```sh
xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 5 -disable-sandbox -target arm64-apple-ios15.1-simulator -module-cache-path /private/tmp/T11-swift-check/cache-ios $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift $REPO/packages/react-native/scripts/spm/visionos/ReactVisionOS.swift
```

Exit 0 (expected 0).

### extensions-typecheck-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -D DEBUG -D SWIFT_PACKAGE -I /private/tmp/T11-swift-check/headers -module-name RCTSwiftExtensions $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift
```

Exit 0 (expected 0).

### xr-typecheck-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -module-name RCTXR $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

Exit 0 (expected 0).

### xr-emit-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/RCTXR-6.swiftmodule -module-name RCTXR $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift
```

Exit 0 (expected 0).

### extensions-module-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/modules-6/RCTSwiftExtensions.swiftmodule -D DEBUG -D SWIFT_PACKAGE -I /private/tmp/T11-swift-check/headers -module-name RCTSwiftExtensions $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift
```

Exit 0 (expected 0).

### adapter-typecheck-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -I /private/tmp/T11-swift-check/modules-6 -I /private/tmp/T11-swift-check/headers -module-name ReactVisionOS $REPO/packages/react-native/scripts/spm/visionos/ReactVisionOS.swift
```

Exit 0 (expected 0).

### swiftui-typecheck-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -typecheck -module-name RCTSwiftUI $REPO/packages/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift
```

Exit 0 (expected 0).

### swiftui-emit-6

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/RCTSwiftUI-6.swiftmodule -module-name RCTSwiftUI $REPO/packages/react-native/ReactApple/RCTSwiftUI/RCTSwiftUIContainerView.swift
```

Exit 0 (expected 0).

### ios-guards-typecheck-6

```sh
xcrun --sdk iphonesimulator swiftc -typecheck -swift-version 6 -disable-sandbox -target arm64-apple-ios15.1-simulator -module-cache-path /private/tmp/T11-swift-check/cache-ios $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindowRouter.swift $REPO/packages/react-native/Libraries/XR/ImmersiveBridge.swift $REPO/packages/react-native/scripts/spm/visionos/ReactVisionOS.swift
```

Exit 0 (expected 0).

### context-before-swift6

```sh
xcrun --sdk xrsimulator swiftc -typecheck -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache /private/tmp/T11-swift-check/RCTReactContext-before.swift
```

Exit 1 (expected 1). Diagnostic: static property 'defaultValue' is not concurrency-safe because it is nonisolated global shared mutable state [#MutableGlobalVariable]

### router-before-swift6-emission

```sh
xcrun --sdk xrsimulator swiftc -swift-version 6 -disable-sandbox -target arm64-apple-xros1.0-simulator -module-cache-path /private/tmp/T11-swift-check/cache -emit-module -emit-module-path /private/tmp/T11-swift-check/before-router.swiftmodule -D DEBUG -D SWIFT_PACKAGE -I /private/tmp/T11-swift-check/headers -module-name RCTSwiftExtensions $REPO/packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTReactContext.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTRootViewRepresentable.swift $REPO/packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift /private/tmp/T11-swift-check/RCTWindowRouter-before.swift
```

Exit 1 (expected 1). Diagnostic: sending 'notification' risks causing data races [#RegionIsolation::SendingRisksDataRace]

## Specific orchestrator follow-up

- Fresh consumer tarballs should omit every ios-prebuild path while retaining generated vision spec and shipped SwiftPM consumer scripts. Source SwiftPM setup is a repository checkout workflow; no consumer `plist` install should be required.
- Plain iOS app codegen should not print "Generating Native Code for FBReactNativeSpec_visionOS" or add it to app providers; visionOS pod/codegen with dependencyPlatform=visionos must still select it. Packed generated specs must remain present even for a package produced on an iOS host.
- SwiftPM source package compilation should exercise Swift 6 module emission (not only `-typecheck`); both observed errors are now fixed and local real-source module emission passed. Full source SwiftPM graph/linking remains unrun by this subtask.

## Linking probe detail

The new `visionos-port/tests/linking-launch-probe.py` extracts real production
method bodies and startup observer, compiles the actual `RCT_EXPORT_MODULE`
registration macro, and uses real Foundation notifications with minimal UIKit
scene/session/options containers. Each of these runs in a fresh host process:
`new-url`, `new-empty`, `new-universal`, `new-url-precedence`, `restored-url`,
`restored-after-read`, `restored-after-activation`, `restored-other-role`.
Every case also checks later scene connections/module instances and repeated warm
URL events without overwriting the original value. The probe prints exact compile
and executable commands, retained in `$V/linking-probe.log`; all eight exit 0.
It proves the capture policy, not UIKit/SwiftUI lifecycle ordering.

Additional exact checks, all exit 0:

```sh
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.h
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror --lines=149:202 --lines=263:269 packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm
python3 /private/tmp/T11-linking-offvision.py
git diff --check
```

The offvision probe compares both native files' preprocessed tokens against
`base/upstream-v0.88.0` with `TARGET_OS_VISION=0`; they match. There is no Linking
Jest suite or changed Linking JS. T8's window-routing host probe also passed
against the Swift router change, including 64 mount registrations, synchronous
claim visibility, reentrant delivery, removal during action, absent/remounted
hosts, and XR routing.

Final formatting checks also passed (exit 0):

```sh
node_modules/.bin/prettier --check README.md packages/react-native/README.md packages/rn-tester/README.md packages/react-native/package.json packages/react-native/scripts/codegen/__tests__/visionos-codegen-test.js packages/react-native/scripts/codegen/generate-artifacts-executor/index.js packages/rn-tester/js/examples/XR/XRExample.js packages/rn-tester/js/examples/XR/__tests__/XRExample-test.js packages/visionos-template/template/App.tsx packages/visionos-template/template/__tests__/App.test.tsx scripts/__tests__/oot-release-test.js scripts/oot-release.js
node_modules/.bin/prettier --check visionos-port/reports/T11-audit-fixes.md
```

## Orchestrator consumer checks

- Repack both packages, use the documented fresh CLI init flow, and confirm the
  generated root LICENSE includes all notices. The runtime tarball must omit
  ios-prebuild and retain all three generated visionOS spec artifacts.
- Run the template's plain iOS pod install with no environment overrides: no
  missing SwiftExtensions spec, and neither platform should warn about target
  `CLANG_CXX_LANGUAGE_STANDARD` overrides. Confirm the first visionOS render has
  no StatusBar LogBox warning.
- Recheck fresh visionOS and iOS app build/run, and Android build as planned.
  RNTester's mixed install now needs both `RCT_ENABLE_VISIONOS=1` and
  `RCT_USE_PREBUILT_RNCORE=0`; a source-core-only iOS install must stay iOS-only.
- Exercise a restored application-role scene cold-launched with a custom URL.
  `onOpenURL` before first getInitialURL/foreground activation must seed the
  initial URL even before JS listeners attach. New-session URL launch must
  retain its URL; new-session no-URL launch must remain null after warm URLs.
  Restored no-URL launch must remain null after activation/read. Repeated warm
  URLs must still emit without replacing the initial value. Include non-application
  scenes first and entitled universal links. Delivery ordering remains unproven
  by host tests and is the key runtime follow-up.
- In XR, try Open twice and confirm the second rejection leaves open state true;
  dismiss with Digital Crown and reopen. Open is intentionally disabled only
  while opening, because no JS lifecycle event currently clears the display on
  system dismissal.

Full source SwiftPM dependency-graph/link testing, Release/device/framework-mode
builds, and real scene-restoration ordering remain outside this completed build
and host-test pass. No additional source fix is known to be pending from T11.
