You are task **T10-audit**: a full, adversarial, release-readiness audit of this fork. You are read-only, so edit nothing. You may run any read-only command, tests that don't write to the repo (Jest writes only caches), `npm pack --dry-run`, and probes in `/tmp`.

The repo is a fork of React Native 0.88.0 that adds visionOS support, published as `react-native-mindzone-visionos` and `react-native-mindzone-visionos-template`. The base is tag `base/upstream-v0.88.0`. Read `AGENTS.md` (the "This fork" section), `visionos-port/PLAN.md` and `visionos-port/INVENTORY.md`. Treat the reports as claims to check, never as evidence.

Audit the full change set `git diff base/upstream-v0.88.0 -- . ':!visionos-port'`, plus every added file, file by file. Produce:

1. **Off-visionOS change ledger.** List every hunk that compiles or runs on iOS, macOS, tvOS or Android, or in shared JS, C++, Ruby, Node or shell. For each one, state whether behaviour is byte-for-byte or behaviourally identical to upstream off visionOS, with evidence: guard, condition, test. Anything not provably identical is a finding.
2. **Inventory completeness.** For every INVENTORY item classed apply or adapt, confirm it is implemented. Name any item missing or only partly done.
3. **Correctness** of all new native and Swift code (XR, WindowManager, `RCTWindowRouter`, SwiftExtensions, the `RCTUtils`/`RCTDeviceInfo` window logic, the `RCTLinkingManager` launch-URL capture): threading, exactly-once promise settlement, leaks, `nil`/`NSNull` handling, and availability on the visionOS 1.0 floor. Flag any API newer than the deployment target that is used without an availability check.
4. **Consumer install.**
   - Simulate a consumer app depending on `"react-native": "npm:react-native-mindzone-visionos@0.88.0"` plus the template. From the `npm pack --dry-run` file lists and package.json `files`/`exports`/`bin`/`codegenConfig`, check that everything the visionOS and iOS builds need ships, and that nothing stray ships (logs, `.tgz`, build dirs, `visionos-port`).
   - Check that the template's `package.json` versions resolve and are mutually consistent with upstream 0.88's own template and helloworld.
   - Check the Metro platformExtension resolver wiring.
5. **Docs accuracy.** Do the README and template README commands match the scripts and file names that actually exist?
6. **CI and release.**
   - `.github/workflows/test-visionos.yml` and its action: a known CI failure is that `sudo xcodebuild -downloadPlatform visionOS` exits 70 with "Unable to connect to simulator" on GitHub's macOS runner with Xcode 26.3. Report any other defect in the workflow.
   - `scripts/oot-release.js` must not be able to publish or tag without `--publish`, must only touch the two fork packages, and must never use the upstream name.
7. **Licensing and attribution:** MIT license kept, Meta's copyright notice kept, Callstack and ReactVision credited, and no third-party code copied without attribution.
8. **Hygiene:** no secrets, no absolute local paths in shipped files, no leftover probes, debug flags or `TODO`s that hide unfinished work, and nothing generated committed where upstream ignores it, or the reverse.

Output: a findings list sorted by severity (blocker, major or minor). Give each finding file:line, a failure scenario, a fix and your confidence. Then the ledger from item 1, compact. Then the areas you found clean. Verify every finding before reporting it, and report no speculation.
