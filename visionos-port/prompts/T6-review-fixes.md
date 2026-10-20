You are task **T6-review-fixes** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`). You are the only agent running now, and you may edit any file in the repo. Follow `AGENTS.md` exactly: no git writes, guard every visionOS change, no behaviour change on iOS, macOS, tvOS or Android.

The independent review (T5) found eight defects, listed below. Verify each against the code first. If one turns out to be wrong, say so with evidence and leave it alone. Fix every confirmed one at its root cause, keeping the diff small and rebase-friendly.

Several of these come from the reference forks' original designs. Fixing them is intended, so record each as a deliberate improvement over both forks.

1. **Restored secondary window crash.** `Libraries/SwiftExtensions/RCTWindow.swift:32` calls `RCTFatal` when scene data is nil. That happens when visionOS restores a secondary window after relaunch, because `RCTReactContext.scenes` starts empty. A restored window must never crash the app.
   - Preferred fix: create default scene data for that ID (with nil props) and render the window's module.
   - If you also disable restoration for secondary windows, it must be behind an availability check, since the deployment floor is visionOS 1.0.
   - Document the behaviour in a doc comment.
2. **WindowManager routing depends on the main window being alive.** The handlers live in `RCTMainWindow.swift`'s modifier (around :82). Close the main window, and `open`/`update`/`close` from a surviving window resolve but do nothing.
   - Make routing survive any single window closing: every React scene can host the handler, with exactly one active handler at a time (no duplicate opens or dismissals).
   - The native module must reject when no handler can act, rather than resolve silently, if that can be determined.
3. **XR state after implicit dismissal.** When the bridge's `onDisappear` dismisses the space (for example, the window that hosted the bridge closes), `RCTXRModule` keeps `_immersiveBridgeView`, so the next `requestSession` rejects with "already opened". This happens around `ImmersiveBridge.swift:112` and `RCTXRModule.mm:67`.
   - Forward the implicit-dismissal completion, and also the immersive scene actually closing (for example, the user exits with the Digital Crown), to idempotent module cleanup.
   - Every promise must still settle exactly once.
4. **XR across React reload.** `RCTXRModule` has no invalidation, so after a reload the new module cannot end the surviving space.
   - Implement `invalidate` (the TurboModule/bridge invalidation that 0.88 uses for modules). On the main queue, it must dismiss the space, remove the child controller, post the scene-data dismissal and reject pending operations.
5. **Partial window updates lose props.** Consecutive `update()` calls before SwiftUI renders replace `sceneData.props` (around `RCTMainWindow.swift:124`). Merge incoming props into the scene data synchronously in each notification handler, and keep the documented merge semantics, including explicit-null handling as T2-apis defined it.
6. **Warm link becomes the initial URL.** At `RCTLinkingManager.mm:150` (visionOS `onOpenURL`), the first URL received while running gets cached as the initial URL.
   - Distinguish launch delivery from runtime delivery. If the app launched without a URL, `getInitialURL()` must return null forever after, while later URLs still emit events.
   - Keep cold-launch URL delivery working.
   - Keep the T2-native NEW-5 fix: a warm URL must not be suppressed.
7. **Autolinking and codegen use iOS exclusions on visionOS.** In `scripts/cocoapods/autolinking.rb:55` and `codegen_utils.rb:61`, a dependency with `ios: null` but an enabled `visionos` config is dropped from visionOS apps, and `visionos: null` is ignored.
   - Select dependencies by the CocoaPods target's platform, and pass that identity to codegen filtering separately from its iOS generation backend.
   - iOS results must be byte-identical to upstream. Add Ruby tests next to the existing cocoapods tests.
8. **`KeyboardAvoidingView` drops `onLayout` on visionOS.** At `KeyboardAvoidingView.js:256`, forward `onLayout` to the rendered `View`, and add a Jest case.

## Verification (record exact commands and results in `visionos-port/reports/T6-review-fixes.md`)

- Jest for every touched JS area and the cocoapods Ruby tests. Run `yarn flow-check` and `yarn lint`. Run `yarn build-types` / `yarn test-generated-typescript` if any public type changes.
- Native compile. Inside the sandbox, use the direct **project** builds that worked in T4, not `-workspace`, with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` on the command line only. Build:
  - the RNTester Pods project and app for `xrsimulator`;
  - the RNTester Pods project and app for `iphonesimulator`.
- Use `-derivedDataPath` and `OBJROOT` under `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/derived/T6-*`. If a podspec changes, re-run `RCT_USE_PREBUILT_RNCORE=0 pod install` in `packages/rn-tester`.
- Runtime checks need the simulator, which your sandbox cannot reach. List the exact scenarios the orchestrator should run in a "Runtime checks for orchestrator" section: what to call from JS, and what to observe.
