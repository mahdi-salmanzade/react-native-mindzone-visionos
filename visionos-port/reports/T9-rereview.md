# T9-rereview: independent Codex re-review of 509e5ea (read-only)

Saved verbatim from `codex exec -s read-only`.

No verified defects found in `509e5ea`. Review was read-only; the working tree remains unchanged.

Verification: Ruby tests passed **17 tests / 46 assertions**. In-memory probes confirmed unchanged default codegen execution paths and non-visionOS shell arguments. The existing XR harness passed, but mocks SwiftUI. No fresh native builds or simulator runs were performed; restoration, immediate close/reopen, Digital Crown dismissal, and cold/warm link delivery remain unverified at runtime.

Areas found clean:

1. **Off-visionOS effects:** unchanged iOS-only autolinking/codegen selection; Android filtering remains isolated. New AppDelegate/Linking code and the SwiftPM dependency are visionOS-guarded.
2. **Window routing:** synchronous main-actor election and claim-before-action; missing handlers reject immediately. Handler removal cannot strand a WindowManager promise. No accumulating production observer leak identified.
3. **XR lifecycle:** exactly-once settlement, failed-open recovery, invalidation during opening, ownership cleanup, and stale-callback protection.
4. **Launch URLs:** role filtering precedes the once token; empty launches remain empty; universal-link extraction is supported; warm callbacks cannot overwrite the initial URL. Custom delegate overrides must call `super` or the documented capture helper—otherwise capture does not run.
5. **Tests and documentation:** current null-prop claims match bridge behavior. Historical native-only probes are explicitly qualified; the routing probe distinguishes source assertions from SwiftUI runtime verification.