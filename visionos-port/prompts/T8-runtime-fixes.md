You are task **T8-runtime-fixes** in the visionOS port of this React Native 0.88.0 fork. You are the only agent running now, and you may edit any file in the repo. Follow `AGENTS.md` exactly: no git writes, guard every visionOS change, no behaviour change off visionOS.

The orchestrator ran RNTester-visionOS, built with the T6 and T7 changes, in the Apple Vision Pro simulator (visionOS 27.0). A temporary JS probe drove the APIs, and device logs and screenshots were captured. Most scenarios passed: launch URL null; XR race open/end1/end2; reopen; invalid scene ID; end with no session; reload with a space open, then reopening afterwards. T7's crash is gone. Two defects remain.

## 1. Regression: one `WindowManager.getWindow('SecondWindow').open(props)` opens two windows

**Evidence:**

- After a single `open({unchanged: 1, nullable: 'old'})`, the registered `SecondWindow` React component rendered in two roots, `rootTag: 21` and `rootTag: 31`. Every later update re-rendered both.
- A screenshot shows two stacked SecondWindow windows.
- `close()` later dismissed both.
- The build before T6 opened exactly one window for the same call. The orchestrator's first probe, `probe-t12.png`, shows a single window.

T6's fix for finding 2 ("routing survives the main window closing") makes every React scene host the routing modifier, and claims to elect exactly one active handler. At runtime, two handlers act on the same request. Possible causes, to be checked rather than assumed:

- Stable view-ID election not holding across scene instances.
- A synchronous claim that isn't shared, or isn't consumed before the second observer runs.
- Both `RCTMainWindow` and `RCTWindow` instances calling `openWindow`.
- SwiftUI's `openWindow` for a `WindowGroup(id:)` creating a new instance per call while the first handler's window already exists.

**Required:**

- Exactly one SwiftUI action per WindowManager request, for any number of mounted React scenes.
- Keep finding 2's survivability.
- `open` for an ID that is already open must not create a duplicate window. Match the reference forks' single-window behaviour, and document it.
- Add an automated test of the election and claim logic where possible: a Swift unit-testable helper, or a host-side probe like your T6 ones.

## 2. Explicit `null` in `update()` props never reaches native

`update({nullable: null})` left `nullable: 'old'`. The cause is upstream: `RCTTurboModule.mm` `convertJSIValueToObjCObject` drops null object values unless the shared feature flag `enableModuleArgumentNSNullConversionIOS` is on. The fork must not change that upstream flag's default.

- Correct the contract and docs: the JS wrapper, `WindowManager.d.ts` / Flow types, the README and the T2-apis/T6 claims. Say that null values do not clear or override existing props.
- Make the tests assert the real behaviour, and remove any claim or test that pretends null survives the bridge. Don't invent an encoding scheme unless it is tiny and clearly worth it; if you choose one, justify it.

## Verify (exact commands and results in `visionos-port/reports/T8-runtime-fixes.md`)

- Jest for the touched JS, `yarn flow-check`, `yarn lint`. Run `yarn build-types` and `yarn test-generated-typescript` if public types changed.
- Rebuild the RNTester Pods project and app for `xrsimulator` and `iphonesimulator`, using T4's direct project builds with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` on the command line only. Re-run `RCT_USE_PREBUILT_RNCORE=0 pod install` first if any file was added or removed.
- The orchestrator will re-run the simulator probe. Say exactly what single-window behaviour to expect.
