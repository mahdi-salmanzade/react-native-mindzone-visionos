You are task **T12-review**: an independent, adversarial reviewer. You are read-only, so edit nothing.

Review the uncommitted T11 change set in this React Native 0.88 visionOS fork: `git diff HEAD -- . ':!visionos-port/reports' ':!packages/rn-tester/Podfile.lock' ':!packages/rn-tester/RNTesterPods.xcodeproj/project.pbxproj'`, plus the untracked files from `git status --short`. Read `AGENTS.md` (the "This fork" section), `visionos-port/prompts/T11-audit-fixes.md` and `visionos-port/reports/T11-audit-fixes.md`, but treat the report as claims to check. Builds are running concurrently in `packages/rn-tester` (Pods, build). Ignore those files.

Focus:

1. **`RCTLinkingManager.mm` launch-URL policy:**
   - the `__attribute__((constructor))` observer registration, its timing and safety in a static library and a framework;
   - main-thread confinement of the statics;
   - every ordering of new-session capture, restored-session `onOpenURL`, `UISceneDidActivateNotification` and `getInitialURL`. Find any ordering where a genuine cold-launch link is lost, or a warm link becomes the initial URL.
   - Is anything compiled off visionOS?
2. **`RCTReactContext.swift` `nonisolated(unsafe)`** and the `RCTWindowRouter.swift` change: correctness, and Swift 5 vs Swift 6 behaviour.
3. **`packages/rn-tester/Podfile`, the CI action and the READMEs:**
   - a plain iOS `pod install` must behave as upstream;
   - `RCT_ENABLE_VISIONOS=1` must work;
   - the docs must match the code.
4. **Packaging:** the `package.json` files change (`ios-prebuild` removed) must not break any shipped path; check that nothing shipped requires `scripts/ios-prebuild`. Also check the codegen gating in `generate-artifacts-executor/index.js` (vision spec only when the dependency platform is visionOS), and that prepack still ships the generated spec.
5. **Template:** `App.tsx`, `LICENSE` and both pbxproj edits; the tests must still be meaningful.
6. **The new tests:** do they actually fail on the defects they claim to guard against?

For each finding give severity, file:line, a concrete failure scenario, a fix and your confidence. Report only verified defects, no style nits and no speculation. End with the areas you found clean.
