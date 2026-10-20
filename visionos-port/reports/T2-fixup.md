# T2-fixup report

Completed the withdrawn hover API removal, snapshot alias fix, Flow annotation, formatting audit, and requested verification. No port-introduced test failure remains. Existing codegen cleanup and Ruby failures were reproduced with upstream sources as detailed below. No Git writes, dependency installation, publishing, native app build, or simulator run occurred.

## Changes

- Removed `visionos_hoverEffect` storage, parsing, native export/rendering, JS configuration, Flow/legacy declarations, and type-test cases. Deleted the untracked `Libraries/NativeComponent/__tests__/BaseViewConfig-test.js`, which exclusively tested this prop. Removed its now-unused type import.
- Restored all nine hover-only files **byte-for-byte** to `base/upstream-v0.88.0`: under `packages/react-native`, `ReactCommon/react/renderer/components/view/BaseViewProps.{h,cpp}`, `React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm`, `React/Views/RCTView.{h,m}`, `React/Views/RCTViewManager.m`, `Libraries/Components/View/ViewPropTypes.js`, `Libraries/NativeComponent/BaseViewConfig.ios.js`, and `types_DEPRECATED/Libraries/Components/View/ViewPropTypes.d.ts`. Each has an empty upstream diff. Existing `cursor: 'pointer'` behavior is exactly upstream.
- Retained `RCTViewManager.h`'s N-28 visionOS export/remap macros: both reference patches contain these independent compatibility helpers; they are not part of the withdrawn prop.
- Marked T2-native NEW-1 and T2-apis NEW-3 **withdrawn by orchestrator**. Added current-status notes and updated `requests/T2-apis.md`; historical verification sections remain historical.
- Applied the requested canonical `react-native` alias in `scripts/js-api/build-types/buildApiSnapshot.js`, preserving the published name for other packages. Formatted only the added conditional expression.
- Added `const seenCoreLibraries /*: Set<string> */ = new Set();` in `packages/react-native/scripts/codegen/generate-artifacts-executor/utils.js`.
- Ran the normal type generator in the real workspace. Generated outputs were never hand-edited.
- Normalized only new `Libraries/SwiftExtensions/RCTReactViewController.{h,m}` with the repository clang-format configuration, plus two spacing inconsistencies in new `RCTRootViewRepresentable.swift` and `RCTWindow.swift`. No existing upstream native code was reformatted.

This fixup restores reference parity for hover rather than adding a replacement API. XR/WindowManager and legitimate guarded visionOS changes remain. No intentional runtime change was made off visionOS.

## Generated API and output audit

`ReactNativeApi.d.ts` differs from upstream only by XR/WindowManager declarations, their six exports (`Window`, `WindowManager`, `WindowManagerStatic`, `WindowStatic`, `XR`, `XRStatic`), and the generated SignedSource signature. Every pre-existing export hash is unchanged. `Platform.isVision` already exists upstream; its generated declaration does not change. The existing legacy Android declaration addition remains.

For a complete generated-output comparison, copied the exact upstream reference's `packages/`, `scripts/`, and root regular files into `/private/tmp/T2-fixup-generated-base-pf2nmwop`, and linked its `node_modules` to the already installed workspace dependencies. The reference tree remained read-only. Ran upstream `yarn build-types --skip-snapshot` in that projection, then compared every generated file byte-for-byte:

| Output | Comparison with independently generated upstream |
| --- | --- |
| Core `types_generated` | 230 identical files; only `index.d.ts` changes; two new files: `Libraries/XR/XR.d.ts`, `Libraries/WindowManager/WindowManager.d.ts`; no removals |
| Virtualized lists `types_generated` | All 11 files identical; no additions, changes, or removals |

Both generated trees remain **ignored**, following upstream `.gitignore:180` and `scripts/js-api/README.md`. They are build/package artifacts, not committed snapshots. `git ls-files` lists neither directory; `git check-ignore` confirms the sibling output is ignored. No virtualized-lists source or committed output change is needed. Commit the canonical API snapshot and source declarations through the orchestrator's normal review.

Commands/results:

```sh
BABEL_DISABLE_CACHE=1 yarn build-types
BABEL_DISABLE_CACHE=1 yarn test-generated-typescript
```

Both **exit 0** in the real workspace (8.37s and 1.10s). Logs: `/private/tmp/T2-fixup/build-types.log`, `/private/tmp/T2-fixup/typescript.log`.

From the upstream projection:

```sh
BABEL_CACHE_PATH=/private/tmp/T2-fixup-generated-babel-cache.json yarn build-types --skip-snapshot
```

**Exit 0**, 5.23s. Log: `/private/tmp/T2-fixup-generated-base.log`. Copy/comparison used Python `shutil.copytree(..., symlinks=True)`, `shutil.copy2`, and `Path.read_bytes()` for every generated path. Full results: `/private/tmp/T2-fixup-generated-comparison.json`; exact differing declaration contents: `/private/tmp/T2-fixup-generated-diffs.patch`; projection metadata: `/private/tmp/T2-fixup-generated-projection.json`.

```sh
git diff base/upstream-v0.88.0 -- packages/react-native/ReactNativeApi.d.ts
git show base/upstream-v0.88.0:packages/react-native/ReactNativeApi.d.ts
git ls-files packages/react-native/types_generated packages/virtualized-lists/types_generated
git check-ignore packages/virtualized-lists/types_generated/index.d.ts
rg -n 'visionos_hoverEffect|hoverEffect' packages scripts
rg -n --no-ignore 'visionos_hoverEffect|hoverEffect' packages/react-native/types_generated packages/virtualized-lists/types_generated
```

Git checks **exit 0**; both searches **exit 1 with no matches**, including ignored generated declarations. Python compared each of the nine restored files against `git show base/upstream-v0.88.0:<path>` and checked each corresponding `git diff base/upstream-v0.88.0 -- <path>` was empty: **all nine pass**. The hover-only test no longer exists.

## Formatting audit

Reviewed `git diff --stat base/upstream-v0.88.0`, the complete modified tracked-file inventory, and file diffs across native sources, JS/components/types, build/codegen/CLI/release scripts, SwiftPM, podspecs, Hermes, metadata, root config, and documentation. No unrelated whitespace, quote-style, wrapping, or reordering changes to upstream code remain. Indentation within newly introduced platform guards is required by those semantic changes. The rewritten fork READMEs are semantic documentation changes. Port plans/prompts/reference artifacts were added after upstream and have no upstream source lines to restore; immutable reference patches were preserved.

The three named tracked files (`setup-apple-spm.js`, `spm/generate-spm-autolinking.js`, `spm/scaffold-package-swift.js`) contain only semantic visionOS edits. The other two named files (`scripts/monorepo/for-each-package.js`, `scripts/new-github-release-url.js`) are new files absent upstream and pass style checking. No additional reversal of upstream formatting was necessary after hover removal.

```sh
BABEL_DISABLE_CACHE=1 yarn format-check
```

Initial **exit 1** listed only the newly added alias expression in `buildApiSnapshot.js`. Compared direct Prettier stdout with the file, wrapped that expression only, and reran the exact command: **exit 0**, 7.45s. The root script hardcodes a repository-wide read-only glob, so it cannot be narrowed by appending paths. No repository-wide formatter write was run. Logs: `/private/tmp/T2-fixup/format-check.log`, `/private/tmp/T2-fixup/format-check-final.log`.

Also ran `node_modules/.bin/prettier --check` with all 78 then-present changed/new supported paths, collected by Python from `git diff --name-only --diff-filter=AM base/upstream-v0.88.0` and `git ls-files --others --exclude-standard`, excluding raw reference material: **exit 0**. Exact argv path list: `/private/tmp/T2-fixup/prettier-files.txt`; log: `/private/tmp/T2-fixup/prettier-scoped.log`. The final report/current-status edits were checked separately with the same direct binary.

```sh
/opt/homebrew/opt/llvm/bin/clang-format -i packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m
/opt/homebrew/opt/llvm/bin/clang-format --dry-run --Werror packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.h packages/react-native/Libraries/SwiftExtensions/RCTReactViewController.m packages/react-native/Libraries/WindowManager/RCTWindowManager.h packages/react-native/Libraries/WindowManager/RCTWindowManager.mm packages/react-native/Libraries/XR/RCTXRModule.h packages/react-native/Libraries/XR/RCTXRModule.mm
```

Both **exit 0**, using Homebrew clang-format **22.1.4** and repository `.clang-format`. Apple clang-format 21.0.0 agrees on the two changed controller files. The repository's pinned 21.1.2 could not run: default dotslash cache was unwritable; retrying with `DOTSLASH_CACHE=/private/tmp/T2-fixup-dotslash` failed DNS resolution for `files.pythonhosted.org`. No tool installation succeeded. Exact pinned-version compliance remains unverified.

An exploratory `xcrun swift-format lint --strict` over the six new Swift files exited 1 under Xcode's generic defaults (conditional-body indentation, doc conversions, type conventions). The repository supplies no Swift formatter policy/configuration; those defaults were not imposed on the port. New Swift was inspected against repository two-space conventions and only the two noted spacing issues were fixed. Details and exact commands: `/private/tmp/T2-fixup-native-notes.md`.

```sh
git diff --check
git diff --check base/upstream-v0.88.0 -- . ':!visionos-port/reference'
```

Both **exit 0**. An initial unrestricted upstream `git diff --check` also inspected committed raw reference patches and reported their original whitespace. Those immutable patch files were not changed; excluding reference material passes.

## Flow, lint, and TypeScript

```sh
BABEL_DISABLE_CACHE=1 yarn flow-check --max-workers 2 --temp-dir /private/tmp/T2-fixup/flow
BABEL_DISABLE_CACHE=1 yarn lint
BABEL_DISABLE_CACHE=1 yarn test-generated-typescript
BABEL_DISABLE_CACHE=1 yarn test-typescript-legacy
```

- Flow: **exit 0, Found 0 errors** (14.06s).
- Full repository lint: **exit 0** (10.66s), with the script's `--max-warnings 0`.
- Generated TypeScript: **exit 0**, normal workspace config, no temporary path mapping or skipped declarations.
- Legacy TypeScript: **exit 0**.

Logs: `/private/tmp/T2-fixup/{flow,lint,typescript,typescript-legacy}.log`. Yarn emitted only unavailable preferred cache/global-folder warnings and selected an existing writable temporary cache.

## JavaScript suites

Ran the requested XR, WindowManager, Keyboard, StatusBar, codegen, SPM, community CLI, and root script tests, plus the fork's local CLI tests:

```sh
BABEL_DISABLE_CACHE=1 yarn test packages/react-native/Libraries/XR packages/react-native/Libraries/WindowManager packages/react-native/Libraries/Components/Keyboard/__tests__/Keyboard-test.js packages/react-native/Libraries/Components/StatusBar/__tests__/StatusBar-test.js packages/react-native/scripts/codegen packages/react-native/scripts/spm packages/community-cli-plugin packages/react-native/local-cli scripts/__tests__ --runInBand --watchman=false --testNamePattern='^(?!shouldAutoDeintegrate (?:false for a CocoaPods project whose Podfile has third-party pods|false when the pbxproj has uncommitted edits|true despite an unrelated dirty file)).*$'
```

**Exit 1: 45 suites passed, 1 suite failed during cleanup; 1,177 tests passed, 3 skipped; all 24 snapshots passed.** The sole suite failure is the two unchanged upstream `afterAll` hooks at `generate-artifacts-executor-test.js:45`, calling `fs.rmdirSync(outputDir, {recursive: true})`, unsupported by Node **26.0.0**. All assertions in that suite pass. Log: `/private/tmp/T2-fixup/jest.log`.

The three skipped cases in `setup-apple-spm-test.js` call `gitInitAndCommit`, which performs Git init/config/add/commit. They were excluded to follow the explicit no-Git-writes instruction. The other two `shouldAutoDeintegrate` cases ran. No source test was disabled or edited. Release tests mock publication; their actual subprocesses only pack and inspect local fixture tarballs.

Also validated the modified API generation subsystem:

```sh
BABEL_DISABLE_CACHE=1 yarn test scripts/js-api/build-types --runInBand --watchman=false
```

**Exit 0: 21 suites, 149 tests, 131 snapshots passed.** Log: `/private/tmp/T2-fixup/api-generator-tests.log`.

### Codegen failure baseline proof

First ran the same failing suite from the **exact requested reference cwd**, `$SCRATCH/vos-src/gh/upstream-0.88.0`:

```sh
node $REPO/node_modules/jest/bin/jest.js packages/react-native/scripts/codegen/__tests__/generate-artifacts-executor-test.js --runInBand --watchman=false --silent
```

**Exit 1 before tests:** `Cannot find module 'jest-config'` from the reference `jest.config.js`, because the reference has no `node_modules`. Log: `/private/tmp/T2-fixup/jest-reference-direct.log`. No reference fixture writes occurred.

Then ran the identical command from `/private/tmp/T2-fixup-generated-base-pf2nmwop`, the pristine reference projection described above, adding an exact copy of reference `jest/` support files. **Exit 1: all 46 tests and 24 snapshots passed, followed by the same two Node 26 recursive-rmdir cleanup errors at line 45.** All 38 original codegen source/fixture files were verified byte-identical to the reference after execution. Log: `/private/tmp/T2-fixup/jest-reference-projection.log`. This proves the failure pre-exists the port without editing the reference or installing dependencies there.

After recording results, removed only the generated `packages/react-native/scripts/codegen/__fixtures__/{test-app,test-app-legacy}/temp` directories left by those failed cleanup hooks, in both workspace and temporary projection, with Python `shutil.rmtree`. These directories did not exist at task start.

## CocoaPods Ruby suites

Ran every `packages/react-native/scripts/cocoapods/__tests__/*-test.rb` individually in the real workspace, then each of the nine existing counterparts in the exact upstream reference cwd. Ruby **4.0.7**, installed CocoaPods **1.16.2** gem environment; no node_modules needed. Each command was exactly:

```sh
GEM_HOME=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec GEM_PATH=/opt/homebrew/Cellar/cocoapods/1.16.2_2/libexec:/opt/homebrew/lib/ruby/gems/4.0.0 ruby packages/react-native/scripts/cocoapods/__tests__/<suite>-test.rb
```

The actual runner used `subprocess.run(['ruby', test_path], cwd=checkout, env=...)`, once per table row and checkout, capturing stdout/stderr separately. Exact expanded argv/cwd/environment/exit results: `/private/tmp/T2-fixup/ruby-results.json`.

| Suite | Tests / assertions | Failures / errors | Exit | Upstream comparison |
| --- | --- | --- | --- | --- |
| codegen_utils | 9 / 25 | 0 / 0 | 0 | identical |
| fabric | 1 / 0 | 0 / 1 | 1 | identical |
| jsengine | 1 / 0 | 0 / 1 | 1 | identical |
| local_podspec_patch | 5 / 11 | 0 / 0 | 0 | identical |
| maven_mirror_flag | 3 / 6 | 0 / 0 | 0 | identical |
| new_architecture | 10 / 9 | 2 / 4 | 1 | identical |
| rndependencies | 6 / 7 | 0 / 0 | 0 | identical |
| spm | 3 / 0 | 0 / 3 | 1 | identical |
| utils | 64 / 149 | 1 / 13 | 1 | identical |
| visionos | 7 / 34 | 0 / 0 | 0 | new suite, absent upstream |

All five failing suites have identical complete logs after normalizing only checkout paths, shifted stack-frame line numbers, timing, and throughput. Failure messages, expectation differences, source snippets, test names, and counts match. Causes: missing `rncore_pod` helper; nil installation root; existing header-path expectations and Ruby4/mock argument errors; missing `InstallerStub.aggregate_targets`; existing Hermes preprocessor expectation and missing `ReactNativeCoreUtils` helper. No unrelated upstream test/harness fixes were made.

Logs: `/private/tmp/T2-fixup/ruby-{workspace,baseline}-<suite>-test.log`; normalized comparison results: `/private/tmp/T2-fixup/ruby-comparison.json`.

## Still open / not claimed

- Three Git-writing SPM fixture cases remain unrun by policy; no permission bypass was attempted.
- Existing codegen cleanup and five Ruby-suite failures remain upstream/toolchain issues, with the baseline evidence above.
- The exact pinned clang-format 21.1.2 could not be obtained; available-version checks and the limitation are documented above.
- Full CocoaPods/SwiftPM native compilation, simulator behavior, and iOS/Android regression builds remain T4 work. Formatting checks, JS tests, and restoration of upstream files do not prove those builds.
- Existing T3 application/template wiring and T4 runtime risks in the T2 reports remain outside this fixup. No release, push, tag, branch, commit, stash, reset, or checkout command was used.
