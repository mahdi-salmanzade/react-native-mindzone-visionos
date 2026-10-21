# T13-review (Codex, read-only)

Saved verbatim from `codex exec -s read-only`, with local paths stripped.

Two verified defects:

1. **P2 — A warm URL can still become the initial URL.** [RCTLinkingManager.mm:178](packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm:178)  
   **Scenario:** Restore a session without a launch URL; leave Linking unused; later open a warm link. Nothing has finalized the capture, so that warm URL becomes the permanent `getInitialURL()` result. The probe omits this sequence.  
   **Fix:** Capture launch URL-or-nil for restored sessions through a supported scene-connection handoff, independently of JS subscriptions/reads. Add a restored-empty → warm-link → first-read regression case. Reintroducing the activation cutoff would recreate the measured cold-launch failure.  
   **Confidence:** High; deterministic from the current control flow.

2. **P3 — The packaging test writes to the inherited npm cache.** [oot-release-test.js:295](scripts/__tests__/oot-release-test.js:295)  
   **Scenario:** npm still caches the generated tarball during `--dry-run` and writes/prunes logs. A writable test directory with a read-only user npm cache therefore fails despite correct package contents.  
   **Fix:** Pass `--cache`, `path.join(root, 'npm-cache')`, using the existing temporary-directory cleanup.  
   **Confidence:** High; verified against the installed npm packing implementation.

Validation was read-only. A cache-disabled, in-memory packing check took **8.77 seconds**, with approximately **631 KB** of JSON—within the test’s 60-second allowance and default output buffer. Native builds and simulator scenarios were not rerun.

Areas found clean:

- Non-visionOS Linking code matches upstream after removing visionOS branches, ignoring whitespace.
- JS listener registration dispatches to the module’s main queue; `startObserving` runs inline there.
- Existing probe scenarios encode the stated policy correctly, including activation-before-cold delivery, listener-first finalization, and immutable captured values.
- The packaging assertions detect reintroduced tooling, skip lifecycle scripts, and leave package sources untouched.
- The Gradle local variable supplies a `java.io.File`, correctly resolving the constructor mismatch.
## Orchestrator disposition

1. **Warm URL as the initial URL in a restored, unused session: kept deliberately and documented.**
   - It applies only if visionOS restores a session without the configuration callback (never observed; every launch in this run called it), and only until JS reads `getInitialURL` or adds a listener.
   - In that window no JS listener exists, so the link would otherwise be dropped entirely.
   - The reference forks seeded the first `onOpenURL` on every launch, so this is strictly narrower.
   - An activation cutoff would reintroduce the measured cold-launch loss.
   - Documented in `RCTLinkingManager.h` and the README, and pinned by the probe scenario `restored-empty-then-warm`.
2. **npm cache writes:** fixed. The test now passes `--cache` inside its temporary root.
