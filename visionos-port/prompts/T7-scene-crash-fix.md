You are task **T7-scene-crash-fix** in the visionOS port of this React Native 0.88.0 fork. You are the only agent running now, and you may edit any file in the repo. Follow `AGENTS.md` exactly: no git writes, guard every visionOS change, no behaviour change off visionOS.

## Bug: T6 introduced a launch crash on any non-window scene connection

The orchestrator ran RNTester-visionOS in the Apple Vision Pro simulator (visionOS 27.0) with the T6 build. The app crashed with `EXC_BAD_ACCESS`, "Thread stack size exceeded due to excessive recursion", on the main thread. The crash report is at `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/shots/RNTester-visionOS-2026-10-21-024255.ips`.

The recursing frames, about 4,600 deep, are:

```
SwiftUI AppSceneDelegate.scene(_:willConnectTo:options:)  ->  @objc AppSceneDelegate.scene(_:willConnectTo:options:)  -> (repeat)
  ... -[UIWindowScene setDelegate:] -> _UISceneInspectDelegateSuport -> AppSceneDelegate.responds(to:) -> (repeat)
+[UIScene _sceneForFBSScene:create:withSession:connectionOptions:] <- -[UIApplication _connectUISceneFromFBSScene:...]
```

It happened while `XR.requestSession('TestImmersiveSpace')` was opening an immersive space. The run immediately before T6 opened and closed the same space without a crash.

**Diagnosis (verify it):** T6 added `-[RCTAppDelegate application:configurationForConnectingSceneSession:options:]` under `TARGET_OS_VISION` in `Libraries/AppDelegate/RCTAppDelegate.mm`.

- It returns `[connectingSceneSession.configuration copy]` for every role, and sets `delegateClass = RCTVisionSceneDelegate` only for `UIWindowSceneSessionRoleApplication`.
- Under `UIApplicationDelegateAdaptor`, SwiftUI calls this method and treats the returned `delegateClass` as the *user* scene delegate that its internal `AppSceneDelegate` forwards to.
- The session's existing configuration already names SwiftUI's own `AppSceneDelegate`. Returning it for the immersive-space role, and possibly for restored or secondary sessions, makes `AppSceneDelegate` wrap another `AppSceneDelegate` indefinitely.

## Required fix

- **Root cause first:** the app delegate must never hand SwiftUI a configuration that names SwiftUI's own delegate class. Returning `[[UISceneConfiguration alloc] initWithName:nil sessionRole:connectingSceneSession.role]` is the documented pattern.
- **Prefer the smallest robust design for finding 6** (the launch-URL distinction). The `options` parameter of `application:configurationForConnectingSceneSession:options:` already carries the connecting scene's `URLContexts` and `userActivities`.
  - Capture the launch URL there, once, for the first application-role scene: including "no URL", and including universal links from `userActivities`, as T6 intended.
  - Return a fresh configuration with no `delegateClass`.
  - Then delete `RCTVisionSceneDelegate.{h,mm}` and its SwiftPM wiring if nothing else needs them.
  - If you conclude a scene delegate is still required, it must only be set for the application role, be created fresh, and be proven not to recurse.
- **Keep the other T6 behaviour:**
  - cold launch with a URL makes `getInitialURL()` return it;
  - launch without a URL makes it null forever;
  - warm URLs emit events and never replace the initial URL;
  - T2-native NEW-5 (a warm URL is never suppressed) still holds.
- **Document** in the `RCTAppDelegate` / `RCTLinkingManager` header comments what an app subclass that overrides scene configuration must forward.

## Verify (record exact commands and results in `visionos-port/reports/T7-scene-crash-fix.md`)

- Rebuild the RNTester Pods project and app for `xrsimulator` and `iphonesimulator`, using T4's direct project builds with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` on the command line only. If files were removed, re-run `RCT_USE_PREBUILT_RNCORE=0 pod install` in `packages/rn-tester` first.
- Run the relevant Jest and Ruby tests, plus `yarn flow-check` and `yarn lint`.
- Confirm no iOS-visible change. `RCTAppDelegate` must not implement the scene-configuration method off visionOS.
- The orchestrator will re-run the simulator scenarios (immersive open/close, race, close-hosting-window, reload, launch URL null). List anything else they should check.
