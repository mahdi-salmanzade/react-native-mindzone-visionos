# T2-native report

## Result and scope

Implemented all 24 owned `apply`/`adapt` inventory items. Confirmed the one `already-upstream`, five `obsolete`, and four `skip` classifications against the current source. Added six findings below. Changed 36 native source/header files; no ReactApple source change was necessary after the audit.

All changes are confined to T2-native source ownership, this report, and `visionos-port/requests/T2-native.md`. No git writes, network access, dependency installation, node_modules changes, generated-output edits, package.json changes, or yarn.lock changes were performed by T2-native. Other T2 tasks changed their own files concurrently; their changes are not claimed here. The preinstall Hermes version was left alone.

Native implementation is complete within this ownership. **T2-fixup update:** the explicit hover prop was withdrawn by the orchestrator and removed from native code and JS/types; upstream cursor behavior is restored. T2-apis implemented the SwiftUI focus/resize notifications. Historical verification notes below describe the original T2 run; see [T2-fixup](T2-fixup.md) for final checks. No full application/native-module build or simulator run is claimed. T4 owns that validation.

Read AGENTS.md, PLAN.md, INVENTORY.md and incoming requests. No requests existed initially. The subsequently written T2-build status-bar source-selection request was implemented with a CocoaPods-preserving adjustment (NEW-6). T2-apis requests were checked: focused-window property/factory contracts are preserved; the status-bar stub was inspected and its missing callback fixed (NEW-4).

## Item-by-item status

Paths are relative to `packages/react-native`. “Done” on an obsolete/upstream/skip row means classification review completed, with no unnecessary source change.

| ID | Status | Files | Notes |
| --- | --- | --- | --- |
| N-01 | done | `Libraries/AppDelegate/RCTAppDelegate.h` | Weak nullable `lastFocusedWindow`, visionOS-only. No removed bridge property restored. Clarified existing iOS multi-scene warning. |
| N-02 | done | `Libraries/AppDelegate/RCTAppDelegate.mm` | SwiftUI owns window creation; factory initialization retained; automatic UIKit creation and implementation excluded on visionOS. |
| N-03 | done | `Libraries/AppDelegate/RCTRootViewFactory.mm` | Transparent Fabric root on visionOS and existing tvOS; customization callback and other-platform background unchanged. Removed legacy factory method stays removed. |
| N-04 | done | `Libraries/LinkingIOS/RCTLinkingManager.{h,mm}` | Vision-only Swift `onOpenURL(url:)`, persistent first-URL cache, existing notification class method and all 0.88 scene/lifecycle helpers preserved. Also fixes first warm URL suppression (NEW-5). |
| N-05 | done | `Libraries/PushNotificationIOS/RCTPushNotificationManager.mm` | Suppresses initial-notification processing on visionOS as references do, but resolves null instead of leaving a pending promise. |
| N-06 | done | Removed `Libraries/Text/Text/RCTTextView.mm`; live Fabric paragraph | Confirmed obsolete: legacy implementation absent; N-20 handles the live edit-menu path. |
| N-07 | done | Removed `Libraries/Text/TextInput/RCTBaseTextInputView.mm` | Confirmed obsolete: legacy implementation absent; live accessory behavior covered by N-18/N-21/N-22. |
| N-08 | done | `React/Base/RCTConstants.{h,m}`, `RCTBundleURLProvider.mm` | Vision-only `RCTPlatformExtension = @"visionos"` and resolver query; platform stays `ios`. Resolver integration requested. |
| N-09 | done | `React/Base/RCTKeyCommands.m` | Skip confirmed: reference hunk is whitespace only. |
| N-10 | done | `React/Base/RCTUtils.mm` | Vision portrait orientation; RV atomic last-nonzero window size, main-queue refresh and initial synchronous lookup. Nonvision screen/cache behavior retained. |
| N-11 | done | `React/Base/RCTUtils.mm` | Vision-only focused-window override, all foreground scene lookup, immersive exclusion, ornament normalization. Guards stale/disconnected/background focused windows and retains nonvision code. |
| N-12 | done | Removed `React/Base/UIKitProxies/RCTKeyWindowValuesProxy.mm` | Confirmed obsolete by file/symbol search; no replacement cache proxy restored. |
| N-13 | done | `React/CoreModules/RCTAlertController.mm` | Hidden container background, current scene window/frame, CGRectZero fallback without UIScreen. |
| N-14 | done | `React/CoreModules/RCTAppearance.mm` | Dark fallback only on visionOS; explicit styles, override and disabled-appearance behavior retained. |
| N-15 | done | `React/CoreModules/RCTDevMenu.mm` | Defers action handler on main queue with zero delay on visionOS; synchronous other-platform call retained. |
| N-16 | done | `React/CoreModules/RCTDeviceInfo.mm` | Current window bounds for window/screen, trait scale, zero without window, existing provider/fontScale/caches retained. Added window-observer refresh (NEW-2). |
| N-17 | done | `React/CoreModules/RCTStatusBarManager.mm` | xros exit0 (excluded body); iOS exit1 | iOS: `React/RCTConvert.h` |
| `React/CoreModules/RCTKeyboardObserver.mm` | Vision payload is `@{}`; unsupported screen-coordinate extraction excluded. Existing event names and TV behavior retained. |
| N-18 | done | `React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` | Accessory assignment/override excluded on visionOS; lifecycle and native IDs retained. |
| N-19 | done | `React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm` | Dismiss-mode converter/assignment excluded; existing iOS-only keyboard/inset paths confirmed. |
| N-20 | done | `React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.mm` | Excludes only UIMenuController fallback; preserves UIEditMenuInteraction and 0.88 drawing/accessibility code. |
| N-21 | done | `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm` | Excludes default accessory setup and RV recycle reset; preserves newer input behavior. |
| N-22 | done | `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputUtils.mm` | Excludes accessory copy; preserves other fields including new tint copying. |
| N-23 | done | `React/Fabric/RCTSurfacePointerHandler.mm` | Cancel, touch update and hover use window coordinate space on visionOS. |
| N-24 | done | `React/Fabric/RCTSurfaceTouchHandler.mm` | Vision window coordinates; root-origin/page adjustment unchanged. |
| N-25 | done | `React/Fabric/Utils/RCTBoxShadow.mm` | RV trait display scale for shadow layer/mask; original screen scale elsewhere. |
| N-26 | done | `React/Modules/RCTUIManager.mm` | Skip confirmed: whitespace-only historical hunk. |
| N-27 | done | Removed modal `.m`, surviving stub `.h`; Fabric modal | Confirmed obsolete; status behavior handled in N-33, no deleted controller revived. |
| N-28 | done | `React/Views/RCTViewManager.h` | Four platform-conditional export/remap compatibility macros; existing macros unchanged. |
| N-29 | done | Removed `React/Views/ScrollView` implementations/manager; surviving header stub | Confirmed obsolete by file/symbol search. Live implementation covered by N-19. |
| N-30 | done | `React/Base/RCTVersion.m`, `ReactCommon/cxxreact/ReactNativeVersion.h` | Skip confirmed: keep current 0.88 stamps, not inconsistent reference release values. |
| N-31 | done | `ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm` | Actual selected window bounds on visionOS; typed width constant and nonvision path retained. |
| N-32 | done | `ReactCommon/react/runtime/{ReactInstance.cpp,hermes/HermesInstance.cpp}` | Skip confirmed: current hook registers profiling; RV retains it. No old CS engine bypass introduced. |
| N-33 | done | `React/Fabric/Mounting/ComponentViews/Modal/RCTFabricModalHostViewController.mm` | Excludes status-bar overrides on visionOS without disabling touch code. Existing modalInPresentation/allowSwipeDismissal behavior retained. |
| N-34 | done | `RCTUtils.mm`, `RCTView.m`, Fabric View/ScrollView, DeviceInfo | Upstream classification confirmed: trait scale, bounds-based hover, iOS-only keyboard/accessory/orientation blocks already present. Explicit named hover prop is separate NEW-1. |

No obsolete/already-upstream classification was rejected. N-04 was adapted further to correct a reference bug rather than copy it.

## NEW items

| ID | Status | Files | Finding and change |
| --- | --- | --- | --- |
| NEW-1 | withdrawn by orchestrator | `ReactCommon/react/renderer/components/view/BaseViewProps.{h,cpp}`, `React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm`, `React/Views/RCTView.{h,m}`, `RCTViewManager.m` | The orchestrator withdrew `visionos_hoverEffect`; neither reference has it, and upstream already uses `cursor: 'pointer'`. T2-fixup removed all native implementation and restored all six affected files exactly to upstream. Earlier implementation and verification notes below describe the withdrawn work only. |
| NEW-2 | native done; Swift notification producer integration pending | `React/CoreModules/RCTDeviceInfo.mm` | Existing init-only KVO can attach before SwiftUI creates a window or stay on an old window. Vision-only key/frame notifications refresh selected-window observation; own notifications are ignored, callbacks run on main queue, invalidated modules cannot reattach. |
| NEW-3 | done | `ReactCommon/react/runtime/platform/ios/ReactCommon/RCTHost.mm`, `React/DevSupport/RCTFrameTimingsObserver.mm` | Three diagnostic lookups bypassed focus/immersive/ornament rules. Vision emulated-media and both screenshot paths now use RCTKeyWindow; original loops retained elsewhere. |
| NEW-4 | done | `React/CoreModules/PlatformStubs/RCTStatusBarManager.mm` | Stub `getHeight` never called its callback. On visionOS, return `{height: 0}`. Setters remain harmless no-ops, constants already report zero; other-platform behavior unchanged. |
| NEW-5 | done | `Libraries/LinkingIOS/RCTLinkingManager.mm` | References cache but do not emit the first URL, losing the first warm URL after normal launch. Always post the URL notification after caching; existing start/stop observation means early cold launch remains cacheable while already-listening apps receive the first event. |
| NEW-6 | done | `React/CoreModules/RCTStatusBarManager.mm`, `React/CoreModules/PlatformStubs/RCTStatusBarManager.mm` | Incoming T2-build B-21 request: exclude real implementation on visionOS; exclude stub off visionOS only under SWIFT_PACKAGE. CocoaPods already selects stubs for tvOS/macOS, so unlike the requested unconditional vision guard, their existing behavior is retained. |

## Reference choices and deviations

ReactVision 0.86.4 is primary, compared against upstream 0.86.2. Callstack confirms common changes. Specifically retain RV's resizable atomic dimensions, newer alert fallback, text-input recycle reset and shadow scale; do not restore removed legacy architecture or CS Hermes suppression.

- Both references expose focused-window lookup and dark appearance fallback too broadly. Here those effects compile only on visionOS. The Swift linking entry point/cache is also vision-only.
- Focus selection uses string equality for immersive roles, validates the focused window's connected foreground scene, scans later scenes when an earlier scene has no key window, and normalizes focused as well as scene-selected ornaments. No safe content window yields nil. The undocumented `debugDescription` Ornament heuristic remains from both references and needs runtime validation.
- DeviceInfo uses the selected window's trait scale, with current traits only when no window exists. Off-vision screen scale is unchanged. Window/screen dimensions are zero without a window; RCTScreenSize separately retains RV's last nonzero cache.
- Alert root controller is named `RCTVisionAlertRootViewController` rather than the unprefixed reference class, avoiding a global Objective-C class-name collision.
- Keyboard returns an actual empty dictionary and gates only visionOS, replacing the reference's broader TARGET_OS_IOS/`return {}` pattern.
- Initial notification suppression resolves null. Its historical rationale is unclear; no claim of full notification-launch support is made.
- Sample module uses the actual application window rather than constructing a window from an arbitrary connected scene; retains the width scalar rather than CS's incorrect CGSize constant.
- Existing 0.88 modal dismissal behavior is preserved; only status-bar overrides are excluded.
- NEW-1/2/3/4/6 are not reference hunks. NEW-5 deliberately repairs reference linking semantics. The cold first URL remains cached for subsequent getInitialURL/reloads, as in the references.
- CADisplayLink was **not** changed: local SDK and source evidence contradict the premise that its class factory is unavailable. Both references retain the existing factories. UIKit in the installed SDK has no UIView `displayLinkWithTarget:selector:` method; UIWindowScene's factory begins at visionOS 27. Introducing that unguarded would violate the version1 target. Frame scheduling behavior still needs T4 runtime verification.

## API and upstream-delta audit

Executed the required full package `diff -rq` against the supplied upstream-0.86.2 path: exit1, differences expected, 2359 lines in `/tmp/t2-native-upstream86-diff-rq.log`. Because other tasks are active, also compared the two immutable upstream trees. Native changes/additions: React 94/5, ReactApple 1/1, ReactCommon 559/49, Libraries 29/0 (683 changed, 55 added). Inspected 96 files with added platform API/macro lines; evidence in `/tmp/t2-native-pure-upstream-added-lines.log`.

New WebSocket inspector, animated-provider header, text effects/ResizeObserver/layout/runtime/text/font/color changes introduce no additional unavailable APIs in the audited categories. RCTInstance primes size/scale on main queue and consumes the corrected size helper. The separate diagnostic window selectors prompted NEW-3.

| Required category | Result |
| --- | --- |
| UIScreen/main/scale and window.screen | N-02/10/13/16/25/31 and N-17/23/24 cover live hits; existing fullscreen use is iOS-only. |
| Orientation/status bars | N-10 and N-33, existing DeviceInfo/modal guards. StatusBarManager implementation is excluded for visionOS in CocoaPods; PlatformStubs selected. SDK permits statusBarManager and orientation-mask enums; no new guard needed for those types/helper. SwiftPM destination guards implemented in NEW-6; full source-graph/build integration remains unverified. |
| UIApplication windows/delegate/keyWindow | Supported connected UIWindowScene enumeration preserved; NEW-3 centralizes diagnostic selection on visionOS. No direct UIApplication.sharedApplication.keyWindow hit. |
| Haptics/brightness | No UIFeedbackGenerator/haptic generator or hardware brightness call found. Existing AudioServices vibration unchanged in both forks. CSS brightness and UIColor HSV are unrelated. |
| Keyboard frames | N-17; Fabric frame/accessory handling already TARGET_OS_IOS. LayoutAnimation consumes only animation-curve metadata, unchanged in references. |
| UIMenuController | Only live Paragraph fallback, N-20; modern edit menu preserved. |
| Pasteboard detection | No detection calls. Existing clipboard/paragraph/red-box string/items APIs are supported. |
| Interactive keyboard dismissal | N-19. Legacy implementation removed; shared C++ enum stays unchanged. |
| UIRefreshControl | Current Fabric init/begin/end/attachment SDK-supported, unchanged in both forks. Gesture behavior not exercised. |
| UIDatePicker | No native hit in owned trees. |
| CADisplayLink | RCTDisplayLink, RCTProfile, RCTPerfMonitor, RCTFrameTimingsObserver, RCTScheduler, RCTAnimatedModuleProvider, RCTDisplayWeakRefreshable, RCTNativeAnimatedNodesManager factories audited. Class factory compiles with xros1 target; UIView factory does not exist; scene factory is visionOS27+. |
| Trait scale/hover | Upstream RCTScreenScale and view rasterization already use traits. Hover SDK gate activates on visionOS (`__IPHONE_OS_VERSION_MAX_ALLOWED == __IPHONE_17_0`, TARGET_OS_IOS=0, TARGET_OS_IPHONE=1, TARGET_OS_VISION=1); existing geometry uses bounds. |

## Requests filed

See `visionos-port/requests/T2-native.md` for exact targets/changes/why:

1. T2-apis: emit window-frame notifications after focus changes, view attachment and resize completion; clear closed-window focus hint.
2. T2-apis: add `visionos_hoverEffect` Flow/native valid-attribute/deprecated TypeScript declarations and regenerate owned public API/type output. No generated output hand edits requested.
3. T2-build/T3-apps: match native `platform=ios&resolver.platformExtension=visionos` in Metro and release bundling.
4. T3-apps: enable multiple scenes, register SecondWindow identifiers and forward SwiftUI onOpenURL.

## Verification commands and results

No CocoaPods install or full Xcode app build was attempted, per task boundary. No JS files were edited by T2-native, so repository-wide JS lint/Flow/Jest/type regeneration was left to the corresponding tasks/T4. Checks below validate source/SDK behavior, not a running app.

### Direct syntax-only attempts

Every one of the 36 changed native headers/sources was attempted against **both** simulator SDKs (72 unique file/SDK pairs, with status-bar follow-up checks). The real status-bar source parses on visionOS because its body is excluded. The other 71 pairs stopped at missing pod-style React header mappings, generated headers or third-party headers before parsing the full translation unit. The missing-header results are environmental blockers, not successful compiles. No attempt was made to construct a Pods/generated-header environment.

Exact invocation shape, with each file from the table below substituted for `<file>`:

```sh
xcrun -sdk <sdk> clang -fsyntax-only -fobjc-arc -fmodules \
  -fmodules-cache-path=<cache> -x objective-c++ -std=c++20 \
  -target <target> -isysroot <sdk-path> \
  -I packages/react-native -I packages/react-native/React \
  -I packages/react-native/ReactCommon packages/react-native/<file>
```

- visionOS: sdk `xrsimulator`, target `arm64-apple-xros1.0-simulator`, sdk-path `/Applications/Xcode.app/Contents/Developer/Platforms/XRSimulator.platform/Developer/SDKs/XRSimulator27.0.sdk`.
- iOS: sdk `iphonesimulator`, target `arm64-apple-ios15.1-simulator`, sdk-path `/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator27.1.sdk` (0.88's current iOS minimum).
- Cache: `/tmp/t2-native-scene-module-cache` for scene files; `/tmp/t2-native-fabric-module-cache-<sdk>` for Fabric; `/tmp/t2-native-root-clang-cache` for remaining files.
- Exact argv/stderr: `/tmp/t2-native-scene-checks/results.json`, `/tmp/t2-native-root-checks/results.json`, `/tmp/t2-native-root-checks/statusbar-results.json`, `/tmp/t2-native-root-checks/swiftpm-statusbar-results.json`, `/tmp/t2-native-fabric-xrsimulator.log`, `/tmp/t2-native-fabric-iphonesimulator.log`.

| File (RN-relative) | Result on each SDK | First missing header |
| --- | --- | --- |
| `Libraries/AppDelegate/RCTAppDelegate.h` | exit1 | `React/RCTBridgeDelegate.h` |
| `Libraries/AppDelegate/RCTAppDelegate.mm` | exit1 | `React/RCTBridgeDelegate.h` |
| `Libraries/AppDelegate/RCTRootViewFactory.mm` | exit1 | `React/RCTBridge.h` |
| `Libraries/LinkingIOS/RCTLinkingManager.h` | exit1 | `React/RCTEventEmitter.h` |
| `Libraries/LinkingIOS/RCTLinkingManager.mm` | exit1 | `React/RCTLinkingManager.h` |
| `Libraries/PushNotificationIOS/RCTPushNotificationManager.mm` | exit1 | `React/RCTPushNotificationManager.h` |
| `React/Base/RCTBundleURLProvider.mm` | exit1 | `React/RCTDefines.h` |
| `React/Base/RCTConstants.h` | exit1 | `React/RCTDefines.h` |
| `React/Base/RCTConstants.m` | exit1 | `React/RCTDefines.h` |
| `React/Base/RCTUtils.mm` | exit1 | `React/RCTAssert.h` |
| `React/CoreModules/PlatformStubs/RCTStatusBarManager.mm` | exit1 | `RCTStatusBarManager.h` |
| `React/CoreModules/RCTAlertController.mm` | exit1 | `React/RCTUtils.h` |
| `React/CoreModules/RCTAppearance.mm` | exit1 | `React/RCTBridgeModule.h` |
| `React/CoreModules/RCTDevMenu.mm` | exit1 | `React/RCTDevMenu.h` |
| `React/CoreModules/RCTDeviceInfo.mm` | exit1 | `React/RCTBridge.h` |
| `React/CoreModules/RCTStatusBarManager.mm` | xros exit0 (excluded body); iOS exit1 | iOS: `React/RCTConvert.h` |
| `React/CoreModules/RCTKeyboardObserver.mm` | exit1 | `React/RCTEventEmitter.h` |
| `React/DevSupport/RCTFrameTimingsObserver.mm` | exit1 | `folly/container/small_vector.h` |
| `React/Fabric/Mounting/ComponentViews/InputAccessory/RCTInputAccessoryComponentView.mm` | exit1 | `React/RCTViewComponentView.h` |
| `React/Fabric/Mounting/ComponentViews/Modal/RCTFabricModalHostViewController.mm` | exit1 | `React/RCTLog.h` |
| `React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm` | exit1 | `React/RCTDefines.h` |
| `React/Fabric/Mounting/ComponentViews/Text/RCTParagraphComponentView.mm` | exit1 | `React/RCTViewComponentView.h` |
| `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputComponentView.mm` | exit1 | `React/RCTViewComponentView.h` |
| `React/Fabric/Mounting/ComponentViews/TextInput/RCTTextInputUtils.mm` | exit1 | `React/RCTBackedTextInputViewProtocol.h` |
| `React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm` | exit1 | `React/RCTComponentViewProtocol.h` |
| `React/Fabric/RCTSurfacePointerHandler.mm` | exit1 | `React/RCTIdentifierPool.h` |
| `React/Fabric/RCTSurfaceTouchHandler.mm` | exit1 | `React/RCTIdentifierPool.h` |
| `React/Fabric/Utils/RCTBoxShadow.mm` | exit1 | `React/RCTBorderDrawing.h` |
| `React/Views/RCTView.h` | exit1 | `React/RCTBorderCurve.h` |
| `React/Views/RCTView.m` | exit1 | `React/RCTBorderCurve.h` |
| `React/Views/RCTViewManager.h` | exit1 | `React/RCTBridgeModule.h` |
| `React/Views/RCTViewManager.m` | exit1 | `React/RCTBridgeModule.h` |
| `ReactCommon/react/nativemodule/samples/platform/ios/ReactCommon/RCTSampleTurboModule.mm` | exit1 | `FBReactNativeSpec/FBReactNativeSpec.h` |
| `ReactCommon/react/renderer/components/view/BaseViewProps.cpp` | exit1 | `glog/logging.h` |
| `ReactCommon/react/renderer/components/view/BaseViewProps.h` | exit1 | `glog/logging.h` |
| `ReactCommon/react/runtime/platform/ios/ReactCommon/RCTHost.mm` | exit1 | `React/RCTDefines.h` |

### Supplemental SDK, behavior and regression checks

- `xcrun -sdk xrsimulator --show-sdk-path` and `xcrun -sdk iphonesimulator --show-sdk-path`: exit0, SDKs above. Scene worker saw nonfatal Xcode cache/FSEvent warnings on discovery.
- `python3 /tmp/t2-native-swiftpm-statusbar-checks.py`: real/stub sources attempted on both SDKs after NEW-6. Real xros source exit0 (body excluded); real iOS and both CocoaPods-mode stub attempts stop at missing headers. Exact argv/results in `/tmp/t2-native-root-checks/swiftpm-statusbar-results.json`.
- `xcrun -sdk iphonesimulator clang -fsyntax-only -fobjc-arc -fmodules -fmodules-cache-path=/tmp/t2-native-root-clang-cache -x objective-c++ -std=c++20 -target arm64-apple-ios15.1-simulator -DSWIFT_PACKAGE=1 -I packages/react-native -I packages/react-native/React -I packages/react-native/ReactCommon packages/react-native/React/CoreModules/PlatformStubs/RCTStatusBarManager.mm`: exit0; confirms SwiftPM iOS stub body is excluded.
- `python3 /tmp/t2-native-root-checks.py`: 38 direct attempts; `python3 /tmp/t2-native-statusbar-checks.py`: 2 attempts; both complete, source compiler exit1 results listed above.
- `python3 /tmp/t2-native-fabric-compile.py xrsimulator` and `... iphonesimulator`: 18 direct attempts. Additional invocations with `packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm /tmp/t2-native-fabric-hover-smoke.mm` perform the final 2 direct attempts plus 2 successful smoke checks. Direct failures listed above; SDK smoke exit0 for both targets. Smoke covers automatic/highlight/lift effects, UIShape, hoverStyle, window coordinate conversion, trait scale.
- Scene extraction: actual edited UIKit scene/orientation/atomic-size/dimensions/observer-refresh/notification logic in `/tmp/t2-native-scene-checks/UIKitSceneSyntax.mm`, with React dependencies declared, compiled for both targets with the direct-command flags plus `-Werror=unguarded-availability -Werror=unguarded-availability-new`: exit0, no diagnostics. Exact commands in `/tmp/t2-native-scene-checks/extracted-results.json`. Not a module/link/runtime test.
- `python3 /tmp/t2-native-root-probes.py`: extracts actual alert implementation, RCTView hover setter/rendering and view-property macros. All three fixtures parse on both SDKs with availability errors enabled: 6 successful syntax checks, no diagnostics. Additional `clang -E -P` assertions confirm vision/nonvision export and remap macros select exactly the intended methods: 2 passes. Exact commands in `/tmp/t2-native-root-checks/probes.json`. Fixtures replace missing infrastructure declarations only; SDK APIs are real.
- `xcrun -sdk xrsimulator clang -fsyntax-only -fobjc-arc -fmodules -fmodules-cache-path=/tmp/t2-native-clang-module-cache -x objective-c++ -std=c++20 -target arm64-apple-xros1.0-simulator /tmp/t2-native-api-probe.mm`: exit0 after correcting a draft probe's nonexistent `UIShape shapeWithRect:` to the actual `shapeWithBezierPath:`. Probe covers direct/availability-guarded scene CADisplayLink, refresh init/begin/end, pasteboard string, orientation masks, statusBarManager and hover. Initial draft exit1 was a test-fixture mistake, not a source change.
- Same SDK probe command with `/tmp/t2-native-uiview-displaylink-probe.mm`: expected exit1, no visible UIView displayLinkWithTarget selector. This rules out the proposed UIView replacement for this SDK.
- `xcrun -sdk xrsimulator clang -dM -E -fmodules -fmodules-cache-path=/tmp/t2-native-clang-module-cache -x objective-c++ -target arm64-apple-xros1.0-simulator /tmp/t2-native-api-probe.mm | rg 'TARGET_OS_(VISION|IOS|IPHONE)|__IPHONE_OS_VERSION_MAX_ALLOWED|__VISION_OS_VERSION'`: exit0; macro values recorded in audit above.
- `xcrun -sdk macosx clang++ -fobjc-arc -fmodules -fmodules-cache-path=/tmp/t2-native-root-clang-cache -framework Foundation /tmp/t2-native-linking-smoke.mm -o /tmp/t2-native-linking-smoke`, followed by `/tmp/t2-native-linking-smoke`: both exit0. Actual extracted onOpenURL body passes cold cache, subsequent URL, first warm URL, stable initial cache and listener removal assertions through real NSNotificationCenter. This is a standalone Foundation test on macOS, not the RN module or a visionOS app. Initial use of `clang` instead of `clang++` failed linking `___gxx_personality_v0`; corrected driver succeeded.
- `python3 /tmp/t2-native-fabric-nonvision-check.py`: exit0, all 10 Fabric sources reduce to upstream when vision guards are disabled, ignoring blank lines.
- `python3 /tmp/t2-native-nonvision-check.py`: exit0, all 36 modified native files reduce to upstream nonvision code. Normalizations explicitly allow comments/blank lines, new unused macro definitions/empty invocation, TargetConditionals includes, CocoaPods-selected stub guard, and reading the same `screen.scale` once for both dimension dictionaries. This is source equivalence evidence, not an iOS/macOS/Android build. Results: `/tmp/t2-native-nonvision-results.json`.
- `git diff --check -- packages/react-native/React packages/react-native/ReactApple packages/react-native/ReactCommon packages/react-native/Libraries/AppDelegate packages/react-native/Libraries/LinkingIOS packages/react-native/Libraries/PushNotificationIOS`: exit0, no whitespace errors. Narrow scene/Fabric checks also exit0.
- Report sanity check: Python verified all 34 inventory IDs, six NEW IDs, final newline and no trailing whitespace; exit0.
- Independent read-only native diff review found NEW-5, now corrected and tested. No further native blocker found in hover guards/parsing/metadata, observer symmetry or invalidation. Full build/runtime verification remains necessary.

### Audit/search commands

```sh
diff -rq /private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/vos-src/gh/upstream-0.86.2/packages/react-native packages/react-native
```

Exit1, expected differences; counts and stable upstream comparison described above. Fabric-only diff also exit1; upstream0.86.2/current `RCTScheduler.mm` comparison exit0 (identical).

```sh
rg -n 'UIScreen|\.screen\b|UIDevice.*orientation|UIInterfaceOrientation|statusBarOrientation|statusBarFrame|UIStatusBar|setStatusBarHidden|statusBarManager|keyWindow|\.windows\b|delegate\.window|FeedbackGenerator|brightness|UIKeyboard.*(Frame|Notification)|UIMenuController|detectPatterns|detectValues|UIPasteboard|keyboardDismissMode|UIRefreshControl|UIDatePicker|displayLinkWithTarget|CADisplayLink|traitCollection\.displayScale|currentTraitCollection.*displayScale|hoverEffect|visionos_hover' packages/react-native/{React,ReactApple,ReactCommon,Libraries} --glob '*.{m,mm,h,cpp,swift}'
```

Exit0, 224 initial hits, inspected with surrounding code and references. Logs `/tmp/t2-native-api-hits.log`, `/tmp/t2-native-api-sweep-final.log`, `/tmp/t2-native-broad-platform-hits.log`. Supplemental SDK unavailable-token scan was only a search aid; availability conclusions use exact declarations/probes.

`rg -n 'visionos_hoverEffect|hoverEffect'` over both full reference packages: exit1, no hits. Compared RCTView, Fabric View, refresh, layout animation and display-link/native animation implementations to each fork's upstream: unchanged in the relevant inherited behavior. File/symbol searches confirmed legacy text/base input/window proxy/modal/scroll implementations absent; live Fabric equivalents retained. Header/source inspection confirmed RV's engine initialization and current profiling implementation for N-32.

## Open risks and T4 handoff

- All complete native translation units are unverified because their real header/dependency closure is absent from standalone commands. T4 must build xrsimulator and iOS with Pods/codegen, including shared C++ and both native view-config paths. The guarded-empty status-bar source checks do not establish that the active implementation compiles. No successful application build is claimed.
- NEW-1's JS attributes/types and NEW-2's SwiftUI notifications must be integrated from the request file. Native prop storage alone is not proof that JS can send the prop. Generated public types/API outputs remain T2-apis responsibility.
- Test main-window startup with zero initial dimensions, resize, focus/close/reopen SecondWindow, app activation and reload. Dimensions remain a shared focused-window module, not a new per-surface dimension API. RCTScreenSize preserves RV's last-nonzero cache and refreshes it on main-queue lookups.
- Ornament selection depends on an undocumented description heuristic; verify actual simulator/device modal, alert and dev-menu presentation. Zero-delay action dispatch starts after the handler returns but does not prove dismissal animation completion.
- Validate cold/warm links and JS listener timing in a real SwiftUI host; the Foundation test proves cache/notification logic only. Initial URL remains process-persistent across JS reload as in references. Initial push notifications intentionally resolve null on visionOS; full support remains unresolved.
- Validate hover prop changes/removal/recycling and cursor fallback, spatial pointer/touch coordinates, text selection/accessory no-ops, refresh gestures, shadows and keyboard events. No UI screenshot or interaction test was produced by this task.
- Existing CADisplayLink factories are supported by the installed SDK, but frame cadence/performance in spatial scenes has not been observed. Scene-bound APIs require a separate availability-aware decision if runtime evidence warrants it.
- SwiftPM source graph/build integration (status-bar source guards are now implemented), Metro resolver behavior, multiple-scene declarations and WindowManager/XR integration are cross-task responsibilities; this report does not claim they were validated.
