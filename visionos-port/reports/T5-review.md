# T5-review: independent Codex review (read-only)

The orchestrator ran this as `codex exec -s read-only` against `git diff base/upstream-v0.88.0`, and saved the output verbatim. The findings go to T6-review-fixes.

Found **eight defects**. Review was read-only; no native builds or simulator runs were performed.

1. **Major — Restoring a secondary window can crash launch.**  
   **Location:** [RCTWindow.swift:32](packages/react-native/Libraries/SwiftExtensions/RCTWindow.swift:32)  
   **Scenario:** Leave a secondary window as the last scene, then relaunch after process termination. visionOS can restore that window, but `RCTReactContext.scenes` starts empty. The restored window receives `nil` scene data and calls `RCTFatal`. This is a supported [visionOS restoration path](https://developer.apple.com/documentation/visionos/embedding-controls-in-an-immersive-space).  
   **Fix:** Initialize or restore scene data before displaying restored windows, or explicitly suppress secondary-window restoration.  
   **Confidence:** High.

2. **Major — Closing the main window disables WindowManager.**  
   **Location:** [RCTMainWindow.swift:82](packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift:82)  
   **Scenario:** Open a secondary window, close the main window, then call `open`, `update`, or `close` from the surviving window. All notification handlers belonged to the main window’s modifier; native methods still resolve successfully, but nothing handles their notifications. visionOS [eliminates a closed non-last scene](https://developer.apple.com/documentation/visionos/handling-the-window-life-cycle-with-multiple-scenes).  
   **Fix:** Maintain routing independently of individual windows, obtaining SwiftUI actions from a surviving scene and preventing duplicate handlers.  
   **Confidence:** High.

3. **Major — XR state remains open after implicit dismissal.**  
   **Location:** [ImmersiveBridge.swift:112](packages/react-native/Libraries/XR/ImmersiveBridge.swift:112), [RCTXRModule.mm:67](packages/react-native/Libraries/XR/RCTXRModule.mm:67)  
   **Scenario:** Open XR from a secondary window, then close that window while the main window remains. The bridge’s `onDisappear` dismisses the space without clearing the module’s `_immersiveBridgeView`. Subsequent `requestSession()` calls reject “Immersive Space already opened.”  
   **Fix:** Forward implicit dismissal completion and actual immersive-scene closure to idempotent module cleanup, preserving exactly-once promise settlement.  
   **Confidence:** High.

4. **Major — React reload leaves an immersive session without an owner.**  
   **Location:** [RCTXRModule.mm:115](packages/react-native/Libraries/XR/RCTXRModule.mm:115)  
   **Scenario:** Open XR and trigger Reload. The UIKit root retains the bridge controller, but `RCTXRModule` implements no invalidation cleanup. React replaces the module while reusing its surfaces. The new module’s `endSession()` sees a nil bridge and resolves without closing the surviving space.  
   **Fix:** Implement invalidation that dismisses the space on the main queue, removes the child controller, clears scene data, and handles pending operations.  
   **Confidence:** High.

5. **Major — Consecutive partial window updates lose properties.**  
   **Location:** [RCTMainWindow.swift:124](packages/react-native/Libraries/SwiftExtensions/RCTMainWindow.swift:124)  
   **Scenario:** Call `window.update({title: 'A'})` and `window.update({count: 1})` before SwiftUI renders. Each notification replaces `sceneData.props`; only the second delta reaches the controller. Its later dictionary merge cannot recover the first update. This violates the documented merge behavior.  
   **Fix:** Merge incoming properties into `RCTSceneData.props` synchronously when handling each notification.  
   **Confidence:** High.

6. **Major — A warm link becomes a false launch URL.**  
   **Location:** [RCTLinkingManager.mm:150](packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm:150)  
   **Scenario:** Launch normally, receive and handle a URL while running, then recreate navigation or reload JS. The first warm URL was permanently cached, so `getInitialURL()` returns it instead of null and can replay navigation that already occurred.  
   **Fix:** Distinguish initial scene URL delivery from later events; freeze an ordinary launch’s initial URL as null.  
   **Confidence:** High.

7. **Major — visionOS autolinking and codegen use iOS dependency exclusions.**  
   **Location:** [autolinking.rb:55](packages/react-native/scripts/cocoapods/autolinking.rb:55), [codegen_utils.rb:61](packages/react-native/scripts/cocoapods/codegen_utils.rb:61)  
   **Scenario:** A dependency with `ios: null` and an enabled `visionos` configuration is omitted from a visionOS app. Conversely, `visionos: null` is ignored when iOS remains enabled. Codegen applies the same incorrect exclusion set. Read-only probes of the actual functions confirmed both cases.  
   **Fix:** Use the CocoaPods target platform for dependency selection and pass that identity into codegen filtering separately from its iOS generation backend.  
   **Confidence:** High.

8. **Minor — KeyboardAvoidingView drops `onLayout` on visionOS.**  
   **Location:** [KeyboardAvoidingView.js:256](packages/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js:256)  
   **Scenario:** A consumer supplies `onLayout` to measure its container. The new branch destructures that callback out of `props` and never forwards it, so measurements stop arriving. A read-only render probe confirmed the omission.  
   **Fix:** Forward `onLayout` to the rendered `View`.  
   **Confidence:** High.

Checked without additional findings:

- Existing runtime guards and shared JS paths outside visionOS; focused-window dimensions and observer cleanup.
- Normal XR promise settlement, main-queue dispatch, and explicit open/end serialization.
- iOS CocoaPods defaults, prebuilt-core/Hermes selection, `min_supported_versions`, and Android codegen isolation.
- npm payload, alias/CLI routing, template resources, and Metro platform resolution, apart from finding 7.
- Release safeguards: fork-only package allowlist, explicit `--publish`, no Git writes in `oot-release.js`, build-only visionOS CI, and repository/secret gates on existing release workflows.