# T10b: independent native audit (Claude subagent, read-only)

The orchestrator spawned this as a cross-model check alongside the Codex T10 audit. Summary of findings; the full scratch probes stayed in the session scratchpad.

1. **Major: SwiftPM visionOS builds of `RCTSwiftExtensions` fail in Swift 6 language mode.**
   - `RCTReactContext.swift:48` (`static var defaultValue`) is "not concurrency-safe because it is nonisolated global shared mutable state".
   - `Package.swift` is tools-version 6.0 and sets no language mode. CocoaPods pins Swift 5.0, so pod builds are unaffected.
   - Reproduced with `swiftc -typecheck -swift-version 6` and a minimal tools-6.0 package built for `arm64-apple-xros1.0-simulator`.
   - Proposed fix: `nonisolated(unsafe) static let defaultValue`, which typechecks in both Swift 5 and Swift 6 modes. Codex T10 found the same issue independently.
2. **Major (about 70% confidence): a cold-launch deep link can be lost when visionOS restores an existing scene session.**
   - The launch URL is captured only in `application:configurationForConnectingSceneSession:options:`, which UIKit calls only when it creates a new session.
   - A restored session skips that call. The URL then arrives through `onOpenURL`, which only posts an event, possibly before any JS listener exists. `getInitialURL` then resolves null.
   - Both reference forks captured the first `onOpenURL`, so this gap is new.
   - Proposed fix: if the new-session capture did not run, let the first `onOpenURL` seed the initial URL, but only before the first `getInitialURL` read or before the first application scene becomes foreground-active.

Checked and found clean:
- guards (every `#else` keeps upstream verbatim);
- XR promise settlement on every path, including invalidation and the Digital Crown;
- `ImmersiveBridge` main-actor lifecycle;
- `RCTWindowRouter` single dispatch and re-entrancy, probed under `-enforce-exclusivity=checked`;
- the app delegate's fresh scene configuration;
- `RCTDeviceInfo` KVO rebinding;
- the `RCTVisionWindowSize` atomic cache;
- visionOS 1.0 availability of every API used;
- `RCTReactViewController`, the alert, appearance, dev-menu and keyboard changes, and the Fabric coordinate-space swaps.
