You are task **T11-audit-fixes** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`). You are the only agent running now, and you may edit any file in the repo. Follow `AGENTS.md` exactly: no git writes, guard every visionOS change, no behaviour change off visionOS.

The orchestrator ran a release-readiness audit. Sources:

- the Codex audit, `visionos-port/reports/T10-audit.md`;
- an independent Claude native audit, `visionos-port/reports/T10b-claude-native-audit.md`;
- the orchestrator's own real-install testing, which is the ground truth. It published both packages to a local Verdaccio, generated an app with the documented `npx @react-native-community/cli init … --template react-native-mindzone-visionos-template`, and built and ran it.

The working tree already contains three uncommitted orchestrator fixes. **Keep them**, verify them, and add tests where possible:

- **A. Blocker:** `packages/react-native/React.podspec` is restored byte-for-byte to upstream. Its four `s.visionos.dependency` lines broke `pod install` for every **iOS-only** Podfile: "Unable to find a specification for `React-RCTSwiftExtensions (= 0.88.0)` depended upon by `React`". That includes the template's own `ios/` app. CocoaPods resolves platform-scoped dependencies even for targets of another platform, and those pods only get a source inside visionOS targets. `use_react_native!` already adds them for visionOS targets.
  - Add a regression test under `packages/react-native/scripts/cocoapods/__tests__`, or another fast test, that fails if any podspec under `packages/react-native` declares a `visionos`-scoped dependency on a pod that `use_react_native!` installs only for visionOS. Text or DSL inspection is fine.
- **B.** `packages/visionos-template/template/App.tsx` no longer renders `<StatusBar>` on visionOS. On visionOS it logged "StatusBar is not available on visionOS platform", and a freshly generated app opened with a LogBox warning. Make sure the template's Jest test still passes.
- **C.** The template's `visionos/HelloWorld.xcodeproj` target-level `CLANG_CXX_LANGUAGE_STANDARD` overrides are removed; only the project-level ones remain, like upstream `private/helloworld`. CocoaPods had warned that "The `X` target overrides the `CLANG_CXX_LANGUAGE_STANDARD` build setting".

## Fix these, verifying each against the code first

1. **Major: Swift 6 mode in source SwiftPM.** `Libraries/SwiftExtensions/RCTReactContext.swift:48` (`static var defaultValue`) fails Swift 6 strict concurrency.
   - Prefer `nonisolated(unsafe) static let defaultValue: RCTReactContext = RCTReactContext()`, keeping the shared-singleton semantics that RNTester and the template rely on. Or set Swift 5 language mode on the added Swift SwiftPM targets, matching the pods' `swift_version`.
   - Typecheck all SwiftExtensions and XR Swift files in both `-swift-version 5` and `-swift-version 6` for `arm64-apple-xros1.0-simulator`.
   - Also check any other Swift target `Package.swift` adds.
2. **Major: published `scripts/ios-prebuild` needs an undeclared `plist`** (`scripts/ios-prebuild/framework-resources.js`).
   - Determine whether any shipped consumer flow (CocoaPods, SwiftPM consumer scripts, CLI) requires `scripts/ios-prebuild`. Upstream 0.88 does **not** publish it.
   - If nothing shipped requires it, drop `scripts/ios-prebuild*` from `files` and document it as a repo-only maintainer tool.
   - Otherwise declare `plist` as a dependency at the version the workspace uses.
   - Justify the choice.
3. **Major, medium confidence: restored-scene cold launch loses its deep link.** See T10b #2.
   - `application:configurationForConnectingSceneSession:options:` is not called for restored sessions, so `RCTLinkingManager`'s launch capture never runs. The URL then arrives through SwiftUI `onOpenURL` as an event, possibly before any JS listener exists.
   - Implement: if no new-session capture happened in this process, the first `+onOpenURL:` seeds the initial URL, but only before the first `getInitialURL` read or before the first application-role scene becomes foreground-active, whichever comes first.
   - It must never let a genuine warm URL overwrite an initial URL, and must keep T7's "no URL means null forever" for new-session launches.
   - Add host-side tests or probes covering new-session-with-URL, new-session-without-URL, restored-session-with-URL, and a warm URL after activation.
4. **Minor: `packages/rn-tester/Podfile:74`.** `RCT_USE_PREBUILT_RNCORE=0` alone now adds the `RNTester-visionOS` target and its pods to iOS RNTester installs. Upstream iOS source-core CI jobs would then need the visionOS SDK.
   - Add an explicit opt-in, `RCT_ENABLE_VISIONOS=1`, that adds the target and requires source core.
   - Without it, the Podfile and `pod install` must behave exactly as upstream for iOS.
   - Update `.github/actions/test-visionos-rntester/action.yml` (only the env for pod install), the RNTester README and the root README.
   - `packages/rn-tester/Podfile.lock` may change; regenerate it the same way T4 did, then explain the delta.
5. **Minor: undocumented shared-surface exceptions** (T10 #4). Add a short "Compatibility contract" section to the root README. Copy it to `packages/react-native/README.md` if prepack doesn't already. It must list exactly what differs off visionOS:
   - additive JS exports and types (XR, WindowManager);
   - CLI/platform registration;
   - codegen of `FBReactNativeSpec_visionOS` during prepack and iOS app builds;
   - SwiftPM manifest additions;
   - package identity and metadata;
   - coinstalled-runtime dedupe.

   Also, if it is simple and safe, generate `FBReactNativeSpec_visionOS` in an **iOS app's** build only when the dependency platform is visionOS. Prepack must still ship the generated spec. If it isn't simple, document it and leave it.
6. **Minor:** `packages/rn-tester/js/examples/XR/XRExample.js:43`. A duplicate "Open" flips `isOpen` to false while the native session is still open. Disable open while opening or open, or keep the state on that rejection.
7. **Minor:** generated apps lack `LICENSE`. Add `packages/visionos-template/template/LICENSE` with the applicable MIT notices (Meta, Callstack, ReactVision), consistent with the wrapper's LICENSE.
8. **Minor:** the template's `ios/HelloWorld.xcodeproj` has the same target-level `CLANG_CXX_LANGUAGE_STANDARD` overrides as C. Align it with upstream `private/helloworld` (project-level only), and validate with `plutil -lint` and `xcodebuild -list`.

## Verify (record exact commands and results in `visionos-port/reports/T11-audit-fixes.md`)

- Run `yarn flow-check` and `yarn lint`.
- Run Jest for every touched area, including the template test.
- Run the cocoapods Ruby tests and the new podspec regression test.
- Run `yarn build-types` and `yarn test-generated-typescript` if types changed.
- Swift typechecks in both language modes.
- Native project builds, using T4's direct-project approach with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` on the command line only. Build the RNTester Pods project and app for `xrsimulator`, with `RCT_ENABLE_VISIONOS=1 RCT_USE_PREBUILT_RNCORE=0 pod install`. Then build iOS RNTester after a **plain** `pod install` with no env.
- The orchestrator will redo the full consumer flow: repack, local registry, fresh `init`, visionOS and iOS pod install, builds and runs, Android build. Tell it anything specific to check.
