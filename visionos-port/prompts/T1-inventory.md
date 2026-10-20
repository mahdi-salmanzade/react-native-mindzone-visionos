You are task **T1-inventory** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`).

Read `AGENTS.md`, starting with the "This fork" section, and `visionos-port/PLAN.md` first. Follow their rules exactly.

## Goal

Produce `visionos-port/INVENTORY.md`, the complete work list the porting tasks (T2-build, T2-native, T2-apis, T3-apps) will implement. Its completeness decides whether the fork ends up with "everything" the reference forks had, so be exhaustive.

## Inputs (read-only)

- `visionos-port/reference/callstack-0.79.6-vs-upstream-0.79.6.patch` and `callstack-0.79.6-files.txt`. The full trees are `$SCRATCH/vos-src/gh/upstream-0.79.6` and `$SCRATCH/vos-src/gh/callstack-0.79`.
- `visionos-port/reference/reactvision-0.86.4-vs-upstream-0.86.2.patch` and `reactvision-0.86.4-files.txt`. The full trees are `$SCRATCH/vos-src/gh/upstream-0.86.2` and `$SCRATCH/vos-src/gh/reactvision-0.86`.
- The published packages and templates under `$SCRATCH/vos-src/npm/` (see PLAN.md).
- This repo, which is upstream 0.88.0 and is the target.

## Method

1. Go through every changed file and every fork-only file or directory in **both** reference diffs, hunk by hunk. Union the two forks.
   - Where ReactVision changed or dropped something Callstack had, say so and give the likely reason (for example, upstream absorbed it, or the file was removed).
   - Where ReactVision added something Callstack never had, include it.
2. For each item, find its target in 0.88, either the same path or where the code moved. Verify the target by searching this repo for the symbols and functions involved, not just the path.
   - Some 0.79 files are gone in 0.88, among them `React/Base/RCTUtils.m`, `React/Views/ScrollView/RCTScrollView.m`, `React/Views/RCTModalHostViewController.m`, `Libraries/Text/TextInput/RCTBaseTextInputView.mm` and `types/index.d.ts`. Find out whether each was renamed, moved, or removed along with legacy-architecture code.
3. Classify each item as one of:
   - **apply**: port as-is or with mechanical edits.
   - **adapt**: the 0.88 code changed and the port needs real rework; describe the rework.
   - **already-upstream**: 0.88 already has it.
   - **obsolete**: the target no longer exists; explain.
   - **skip**: not needed for this fork, such as Callstack-specific bots or branding; justify each one.
4. Assign each item exactly one owner (T2-build, T2-native, T2-apis or T3-apps), following the ownership table in PLAN.md.
5. Cover these **cross-cutting requirements** even where no reference hunk maps to them cleanly:
   - **Podspecs:** list every podspec under `packages/react-native` in 0.88 and whether each needs the visionOS platform. Note how `min_supported_versions` and `RCT_USE_PREBUILT_RNCORE` / `RCT_USE_RN_DEP` interact with visionOS. In a real app on 0.88, `hermesvm.xcframework` and `ReactNativeDependencies.xcframework` already ship xros slices, but `React.xcframework` does not.
   - **SwiftPM:** check whether 0.88 has Swift Package Manager support (`Package.swift` or similar) that also needs visionOS.
   - **Codegen** for the visionOS modules.
   - **The npm publish surface:** the `files` field, `bin`, the `react-native.config.js` platform registration, and `@react-native-community/cli-platform-apple`'s `run-visionos`.
   - **JS public API and types:** `index.js`, the `ReactNativeApi.d.ts` snapshot, `Platform.isVision`, and the XR and WindowManager specs.
   - **RNTester visionOS target** and **template package** (`react-native-mindzone-visionos-template`).
   - **CI and release scripts.**
   - **Anything 0.88 introduced since 0.86.2 that newly needs a visionOS guard:** new files using iOS-only UIKit APIs such as `UIScreen.mainScreen`, `UIDevice.orientation`, status bar, `statusBarManager`, haptics/`UIFeedbackGenerator`, `UIApplication.sharedApplication.keyWindow`, `UIScreen` brightness, or `UIWindowScene.interfaceOrientation`.
     - Grep `packages/react-native` for these and diff the hits against what the forks guarded.
     - Also run `diff -rq` on the native sources (React/, ReactApple/, ReactCommon/, Libraries/) between `$SCRATCH/vos-src/gh/upstream-0.86.2/packages/react-native` and this repo's `packages/react-native`. Inspect new and changed native files for iOS-only APIs.

## Output format (`visionos-port/INVENTORY.md`)

- **Summary:** counts by classification and owner, top risks, open questions.
- **One table per owner**, with columns: `ID` (for example B-01, N-01, A-01, P-01), `Area`, `Source` (CS, RV or both), `Reference file(s)`, `0.88 target`, `Class`, `Port notes`. The notes must be precise enough that another engineer can implement the item without re-reading the reference diff: name the functions, symbols and APIs, the guard to use, and the expected behaviour on visionOS.
- **"Cross-cutting checks"** section with the results of step 5.
- **"Not ported" list** with reasons.

Also write `visionos-port/reports/T1-inventory.md`: what you read, your method, the commands you ran, and anything you could not determine.

## Constraints

- Write only `visionos-port/INVENTORY.md` and `visionos-port/reports/T1-inventory.md`. Edit nothing else.
- No network access. No git writes.
- Don't guess. If a mapping is uncertain, mark it **uncertain** and say what would settle it.
