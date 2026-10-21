# Final validation: release-readiness audit (2026-10-21)

The orchestrator ran every check below outside the agent sandbox, on macOS with Xcode 27.1 and Node 22.23.3. Codex ran gpt-6-astra at `ultra` reasoning, as recorded in its session files.

## Audit findings and their fixes

| # | Severity | Finding | Found by | Fix |
| --- | --- | --- | --- | --- |
| 1 | **blocker** | Any **iOS-only** `pod install` failed with "Unable to find a specification for `React-RCTSwiftExtensions`", because `React.podspec` had `s.visionos.dependency` lines. CocoaPods resolves those even for iOS-only targets. | real consumer install (both code reviews missed it) | `React.podspec` restored byte-for-byte to upstream, plus a regression test |
| 2 | major | CI never built: `sudo xcodebuild -downloadPlatform visionOS` exits 70 | GitHub run | download as the runner user, only when the runtime is missing |
| 3 | major | SwiftPM source builds fail Swift 6 concurrency checks (`RCTReactContext.defaultValue`) | Codex T10 + Claude T10b | `nonisolated(unsafe) static let` |
| 4 | major | the published `scripts/ios-prebuild` needs an undeclared `plist` | Codex T10 | no longer published (upstream doesn't publish it either), plus a mutation-tested packaging test |
| 5 | major | a cold-launch link was lost if a scene session is restored. T11's activation cutoff didn't fix it: SwiftUI delivers `onOpenURL` about 100 ms after `didActivate`, measured | Claude T10b, then Claude re-review | the first `onOpenURL` seeds the initial URL unless capture, a JS read or a JS listener came first |
| 6 | major | the consumer **Android** app could not build: `new File(reactNativeDir, …)` was given a Gradle `DirectoryProperty` | real consumer build | resolve the directory into a local variable first |
| 7 | minor | a new app opened with a StatusBar LogBox warning on visionOS | real run | the template skips `<StatusBar>` on visionOS |
| 8 | minor | the template's Xcode projects overrode `CLANG_CXX_LANGUAGE_STANDARD` at target level, which made CocoaPods warn | real `pod install` | project-level only, matching upstream HelloWorld |
| 9 | minor | `RCT_USE_PREBUILT_RNCORE=0` alone added the visionOS target to RNTester | Codex T10 | explicit `RCT_ENABLE_VISIONOS=1` opt-in |
| 10 | minor | the XR example showed "closed" after a duplicate open | Codex T10 | state preserved |
| 11 | minor | generated apps had no `LICENSE` | Codex T10 | `template/LICENSE` with all notices |
| 12 | minor | the intended shared-surface differences were undocumented | Codex T10 | a "Compatibility contract" section in the README |
| 13 | test | the T11 packaging test could not detect a regression | Codex T12 | it now reads the real package with `npm pack --dry-run`; mutation-checked |

## Final matrix (all run on the final tree)

| Area | Result |
| --- | --- |
| `yarn flow-check`, `yarn lint`, `yarn test-generated-typescript` | pass |
| `yarn test` (full) | 240 suites, 6,090 tests, 1,679 snapshots: pass |
| CocoaPods Ruby tests | all fork suites pass (31 new tests). Pre-existing failures match upstream 0.88.0 exactly, file by file (Ruby 4.0 environment) |
| Linking launch-policy host probe | 9/9 scenarios pass |
| RNTester-visionOS, `RCT_ENABLE_VISIONOS=1 RCT_USE_PREBUILT_RNCORE=0 pod install` + workspace build | pass |
| RNTester iOS, plain `pod install` (upstream prebuilt default, 0 visionOS pods) + workspace build | pass |
| RNTester Android `assembleDebug`, run on a throwaway emulator | pass; launches |
| GitHub CI "Test visionOS" Debug + Release at `1cac7d8` | pass |
| **Consumer flow:** both packages packed by `scripts/oot-release.js`, published to a local Verdaccio (never npm), app created with the documented `npx @react-native-community/cli init … --template react-native-mindzone-visionos-template`, `react-native` resolving through the npm alias | pass. Tarball integrity matched across the pack, the registry and the app lockfile |
| consumer visionOS `pod install` (no warnings) + build + run | pass: renders, no LogBox warning |
| consumer iOS-only `pod install` (no warnings, no missing spec) + build | pass |
| consumer Android build + run on an emulator | pass; renders (the first cold-Metro load needed one relaunch, which is normal React Native behaviour) |
| visionOS runtime probe (RNTester) | `Platform.isVision`; one SecondWindow root; open, update and merge; a repeated open targets the same window; XR open/end races, reopen, invalid ID, no-session end; reload with a space open, then reopen; no crash |
| visionOS deep links, opened from a launcher app on the simulator | cold launch with a prior session: initial URL correct, and the screen navigated. Fresh-install cold launch: correct. Warm link: event only. No URL: null |
| iOS runtime probe (RNTester) | `isVision=false`; XR and WindowManager reject as unavailable; Keyboard and StatusBar unchanged; warm and cold deep links work |

## Still not verified

- Window restoration across relaunch. No launch in this run produced a restored session without the configuration callback.
- Closing the main window by hand.
- Leaving the immersive space with the Digital Crown.
- Pointer, hover and keyboard interaction.
- Release builds, device builds, `use_frameworks!` builds, and the full SwiftPM source graph, beyond Swift 6 module checks.
