You are task **T4-verify** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`). You are the only agent running now, and you may edit any file in the repo. Follow the rest of `AGENTS.md` and `visionos-port/PLAN.md` exactly: no git writes, no publishing, and every visionOS change guarded.

Read every report in `visionos-port/reports/` and every open request in `visionos-port/requests/` first. Apply any request that is still open.

## Goal

Make the fork build and run for real on visionOS, and prove iOS is unaffected. Iterate on build, fix, rebuild until the gates below pass or you hit a blocker you can document precisely.

Environment notes:

- Network access is enabled for `pod install` and Hermes downloads.
- Use `-derivedDataPath /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/<name>` for every `xcodebuild`.
- CocoaPods caches are writable.
- Use the Yarn on `PATH`.
- If `xcrun simctl` is unavailable from your sandbox, say so in the report; the orchestrator will run the simulator steps.

## Gates (record the exact command and result for each)

1. `yarn flow-check`, `yarn lint`, `yarn test` and `yarn test-generated-typescript` pass. Separate any failure that exists on the untouched upstream base (`git stash` is forbidden; check by reasoning about the diff or by testing in `$REF/gh/upstream-0.88.0`) from failures this port introduced, and fix the latter.
2. **RNTester visionOS.** In `packages/rn-tester`, run the documented visionOS pod install, then `xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester-visionOS -sdk xrsimulator -configuration Debug build`. It must succeed.
3. **RNTester iOS still builds.** Same workspace, scheme `RNTester`, `-sdk iphonesimulator`. It must succeed, with no new warnings from changed files where practical.
4. **Template app.** Generate an app from `packages/visionos-template` into the scratchpad, using local `file:` or `link:` dependencies on this repo's `packages/react-native` (aliased as `react-native`) and the template. Pod install, then build for `xrsimulator`.
5. **Run.** If `xcrun simctl list runtimes` shows a visionOS runtime:
   - Create or boot an Apple Vision Pro simulator, install and launch RNTester-visionOS (or the template app) with Metro running, and take a screenshot with `xcrun simctl io <udid> screenshot <path>` into the scratchpad.
   - Open the XR and SecondWindow examples if you can.
   - Shut the simulator down when you're done.
6. **Publish surface.** `npm pack --dry-run` in `packages/react-native` and `packages/visionos-template`. Check the file lists ship everything the build needs (compare with the ReactVision npm package), with no stray build output.

When a build fails, fix the root cause in the right file under the porting rules. Never paper over it, for example by disabling a podspec on iOS or deleting an API. Record each fix in `visionos-port/reports/T4-verify.md`: symptom, cause, fix, files. Also record the final gate table and anything still open.
