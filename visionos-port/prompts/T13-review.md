You are task **T13-review**: an independent, adversarial reviewer. You are read-only, so edit nothing.

The orchestrator made these final changes in this React Native 0.88 visionOS fork after the T12 review. Read `AGENTS.md` (the "This fork" section) first.

1. **`packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.{h,mm}`** (`git diff HEAD` on both; HEAD predates T11, so read the current files in full).
   - The `UISceneDidActivateNotification` cutoff and its `__attribute__((constructor))` are removed.
   - `initialURLIsFinalized` is now set by new-session capture (`sceneSession:willConnectWithOptions:`), the first `+onOpenURL:`, the first `getInitialURL`, and `startObserving` (visionOS only).
   - Reason: a measured visionOS 27.0 trace showed SwiftUI delivers a cold-launch `onOpenURL` about 100 ms after `didActivate`.
   - Runtime results, all observed on the simulator: cold launch with a prior session → initialURL correct; fresh-install cold launch → correct; warm link → event only; no-URL launch → null.
   - Check:
     - that every guard is visionOS-only and off-visionOS behaviour is unchanged;
     - that `startObserving` runs on the main method queue;
     - whether any ordering can still make a warm URL the initial URL, or lose a cold one.
2. **`scripts/__tests__/oot-release-test.js`**, the new last test. It should fail if `scripts/ios-prebuild` is published again; the orchestrator mutation-tested it. Check that it is deterministic and fast enough, and has no side effects: `npm pack --dry-run --ignore-scripts` with the real package.
3. **`packages/visionos-template/template/android/app/build.gradle`**: the `reactNativeDir` local-variable fix for "Could not find matching constructor for java.io.File(DefaultFilePropertyFactory$DefaultDirectoryVar, String)". A consumer Android app now builds and runs.
4. **`visionos-port/tests/linking-launch-probe.py`**: updated scenarios. Do they encode the new policy correctly?

For each finding give severity, file:line, a concrete failure scenario, a fix and your confidence. Report only verified defects. End with the areas you found clean.
