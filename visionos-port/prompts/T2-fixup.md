You are task **T2-fixup** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`). Phase 2 is finished. You are the only agent running now, and you may edit any file under `packages/`, `scripts/`, `visionos-port/` and the root config. Follow the rest of `AGENTS.md` exactly: no git writes, guard all visionOS code, no behaviour change off visionOS.

Read `visionos-port/reports/T2-{build,native,apis}.md` and `visionos-port/requests/*.md` first.

## 1. Remove the withdrawn `visionos_hoverEffect` prop completely

The orchestrator withdrew this prop; see the WITHDRAWN note in `requests/T2-native.md`. Neither reference fork has it, and upstream 0.88 already drives visionOS hover from `cursor: 'pointer'`, so the fork must not add a new API.

- **Remove every trace:** native (T2-native NEW-1) and JS/types (T2-apis NEW-3). This includes the C++ prop storage and parsing (`BaseViewProps.{h,cpp}`), `RCTViewComponentView.mm`, `RCTView.{h,m}`, `RCTViewManager.m`, `ViewPropTypes.js`, `BaseViewConfig.ios.js`, the view-config test, `types_DEPRECATED`, `__typetests__/visionos.ts` and the regenerated outputs.
- **Restore each touched region exactly to upstream**, using `git diff base/upstream-v0.88.0 -- <file>` to check. Keep any other legitimate visionOS change in the same file. A file whose only change was the hover prop must end up identical to upstream.
- **If `BaseViewConfig-test.js`** (new, untracked) exists only to test the hover prop, delete it. Otherwise strip the hover cases.
- **Afterwards,** `rg -n "visionos_hoverEffect|hoverEffect" packages scripts` must return nothing, except reports or requests that describe the withdrawal.
- **Update the reports:** mark NEW-1 (T2-native) and NEW-3 (T2-apis) as *withdrawn by orchestrator* in their tables.

## 2. Apply the open fixes from `requests/T2-apis.md`

- **API snapshot alias:** `scripts/js-api/build-types/buildApiSnapshot.js`, as specified there. Then run the normal `yarn build-types` and `yarn test-generated-typescript` in the real workspace, and confirm `packages/react-native/ReactNativeApi.d.ts` and `types_generated` contain no hover prop and no unrelated churn. Compare against `base/upstream-v0.88.0`: the only API delta should be the visionOS additions (XR, WindowManager, their types, `Platform.isVision` if new). If `packages/virtualized-lists/types_generated` changes, decide whether that is generated output that must be committed upstream-style or ignored, and explain.
- **Flow annotation:** `const seenCoreLibraries /*: Set<string> */ = new Set();` in `scripts/codegen/generate-artifacts-executor/utils.js`.

## 3. Remove formatting churn

A global `prettier --write` ran during T2. For every modified tracked file (`git diff --stat base/upstream-v0.88.0`), check that the diff contains no formatting-only changes to upstream lines: whitespace, quote style, wrapping or reordering. The five files named in `requests/T2-apis.md` need particular attention.

Revert any formatting-only hunks and keep the semantic ones. New files must follow the repo's prettier and clang-format style. Run `yarn format-check` scoped to the changed files where possible; never run a repo-wide `--write`.

## 4. Re-verify

Run and record:

- `yarn flow-check`
- `yarn lint`, the full run if feasible
- `yarn test` for every suite touched in T2: XR, WindowManager, Keyboard, StatusBar, codegen, cocoapods Ruby tests, spm, community-cli-plugin, `scripts/__tests__`
- `yarn test-generated-typescript`

Fix anything the port introduced. Suites that fail identically on the base are pre-existing; prove it by running the same suite in `/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/vos-src/gh/upstream-0.88.0`, which has no `node_modules`. If you can't, explain why. Do not use `git stash`.

Write `visionos-port/reports/T2-fixup.md` with what you changed, the exact commands you ran and their results, and anything still open.
