# T12-review (Codex, read-only)

Saved verbatim from `codex exec -s read-only`, with local paths stripped.

**One verified defect, in the new packaging test. No production regression was verified.**

1. **P2 — The `ios-prebuild` exclusion test cannot detect the packaging regression.** [scripts/__tests__/oot-release-test.js:198](scripts/__tests__/oot-release-test.js:198)

   The assertion examines a synthetic package whose fixture never creates `ios-prebuild` files and never reads the real package’s `files` allowlist. Restoring both removed entries in `packages/react-native/package.json` would leave this test passing.

   **Fix:** create representative prebuild files in the fixture and use the real manifest’s publish rules, or test the actual package file selection.  
   **Confidence:** certain.

The Linking change follows T11’s requested cutoff, but **cold-launch delivery remains unverified**. Its state machine reduces every ordering to whichever operation happens first:

| First relevant operation | Permanent initial URL |
|---|---|
| Application-role new-session capture | Connection URL, universal link, or null |
| Restored-session `onOpenURL` | That URL |
| Application-role activation | Null |
| `getInitialURL` | Null |

Consequently, `activation → cold onOpenURL → getInitialURL` loses the cold URL from the initial-value path. An earlier read has the same effect. These transitions are certain from the source; their occurrence during an actual restored SwiftUI launch was not established, so I am **not presenting them as verified runtime defects**. The host probe tests the chosen cutoff but explicitly does not verify SwiftUI’s ordering.

For ordinary startup linking, I found no constructor defect: the referenced class retains its object file in static linkage, and the constructor runs during image initialization for a startup-loaded framework. It avoids the `RCT_EXPORT_MODULE` `+load` collision. The supplied UIKit/SwiftUI call paths and the promise method’s main dispatch queue confine static accesses to the main thread. Framework execution was not independently tested.

Independent checks passed: both new Ruby suites, both project plist validations, and Linking’s off-visionOS preprocessed-token comparison against upstream. Restoring the old Ruby defects in memory made their tests fail; restoring the old codegen predicate likewise violated the new expectation. No files were edited or concurrent build outputs inspected.

Areas found clean:

- **Swift:** shared singleton identity survives; the router retains synchronous delivery and `MainActor.assumeIsolated`. No Swift 5/6 source defect found; compilation was not rerun.
- **Podfile, CI and docs:** default/source-core-only iOS selection, explicit visionOS opt-in, and documented commands agree.
- **Packaging/codegen:** no shipped caller requires removed prebuild tooling; platform gating is correct; prepack still generates and includes all three vision spec artifacts.
- **Template:** StatusBar guard, meaningful platform assertions, matching LICENSE notices, and inherited project-level C++ settings.
- **Other regressions:** Podfile, podspec, codegen, XR state, template rendering and missing-license checks detect their targeted defects.
- **Platform isolation:** changed Linking and Swift native behavior compiles out off visionOS.