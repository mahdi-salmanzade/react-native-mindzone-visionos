# T1-inventory report

Completed the reference/target audit and wrote `visionos-port/INVENTORY.md`. This task ports **no implementation code**. The inventory has **121 work items**: 35 apply, 56 adapt, seven already-upstream, nine obsolete, 14 skip; 36 belong to T2-build, 34 to T2-native, 27 to T2-apis and 24 to T3-apps.

Only `visionos-port/INVENTORY.md` and this report were written by T1 and its reviewers. No network, installs, git writes, branches, tags, commits or publication were used. Initial read-only status showed two pre-existing untracked files, `visionos-port/prompts/T3-apps.md` and `visionos-port/prompts/T4-verify.md`; they were not touched. A final status check also showed a concurrent external edit to PLAN.md changing the simulator runtime from downloading to installed; read-only `git diff -- visionos-port/PLAN.md` confirmed that change. T1 did not make or revert it and did not independently query simulator runtime installation.

## Material read

- `AGENTS.md` beginning with the fork rules, and `visionos-port/PLAN.md`, before substantive auditing.
- Both committed reference patches and both `*-files.txt` lists. The patch headers exclude `.git`, `node_modules`, `*.lock`, `yarn.lock` and `CHANGELOG*.md`; excluded historical files are outside the completeness claim.
- The CS0.79/upstream0.79.6 and RV0.86/upstream0.86.2 trees at the paths supplied in PLAN. Full fork-only directories were expanded, including binary RNTester assets.
- Published RV core package, CS0.79.6 template and RV0.86.4 template under the supplied npm reference root. Both templates were compared by path/content; there are 70 CS files and 69 RV files, 70 in their union.
- Actual 0.88 target functions/types/configuration, all 87 RN podspec platform declarations, current codegen/SwiftPM/prebuilt/facade/release/CLI source and corresponding moved symbols. RNTester/template inputs were checked against current RNTester, HelloWorld and split test-library fixtures.
- Locally installed `@react-native-community/cli-platform-apple@20.2.0` and `cli-config-apple` source; installed XROS27.0 UIKit/UserNotifications headers. No online documentation was consulted.
- The graphify skill was inspected as a possible aid but was not applied: direct diff/symbol auditing fit this task, and its extra generated files would exceed the user's two-file scope.

## Method and coverage

Three read-only reviewers independently covered build/publish, native runtime and public APIs. The primary auditor covered RNTester, template packages, the coverage ledger and integration. None of the reviewers wrote files. Findings were reconciled by exact path and symbol, with a second review of integrated build/native/API notes and template contracts.

Patches were parsed by `+++` path up to the tab/timestamp, preserving spaces in asset paths. Each file block was read hunk by hunk. Binary records were separately parsed; every `Only in` directory from the file lists was recursively expanded. The resulting ledger contains **144 unique paths**; no fork-only expansion is missing:

| Audit scope | Unique paths | CS text files / hunks | RV text files / hunks | Binary occurrences |
| --- | ---: | ---: | ---: | ---: |
| Build / unowned config drift | 43 | 22 / 45 | 39 / 71 | 0 |
| Native | 38 | 34 / 63 | 34 / 64 | 0 |
| APIs | 35 | 32 / 40 | 34 / 59 | 0 |
| Apps | 28 | 22 / 58 | 24 / 39 | 2 CS + 2 RV |
| Total | **144** | **110 / 206** | **131 / 233** | **4** |

The two binary paths are identical CS/RV copies of RNTester's front.png and back.jpg. Their SHA-256 values are respectively `42d4c1245960ea6a31bb08705bc65c540049c2a82d03fa08bbe8629ab9ee9562` and `3f1c8de0584198ed92373d2e64ce328b5436b2afe4fe322cfc0515061e51836a`. All 22 API-owned fork-only RV source files match the published RV package byte-for-byte. RNTester's added reference privacy plist is structurally identical to 0.88's existing root-level manifest.

Target mapping used symbol searches and surrounding implementations, not filename existence alone. In particular, RCTUtils.m became RCTUtils.mm; legacy ScrollView/modal/text-input implementations were removed, with live Fabric equivalents mapped; the removed types/index.d.ts layout now splits generated default types and types_DEPRECATED compatibility. Platform.isVision and several platform-safe paths are already upstream.

The required `diff -rq` ran on all four native roots against upstream0.86.2. Added/changed native bodies were compared with `difflib.unified_diff`, inspecting additions for requested and broader Apple APIs. Counts: **683 changed + 55 added native files** (React94+5, ReactApple1+1, ReactCommon559+49, Libraries29+0). The inventory records no-action explanations for the other Apple API changes, existing guards, absence of requested haptics/keyWindow/brightness uses, and new unsupported window.screen accesses.

## Commands and results

Commands below group repeated read-only invocations by purpose; `$REF` abbreviates the exact reference root from PLAN:

```sh
REF=/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/vos-src
cat AGENTS.md visionos-port/PLAN.md
wc -l visionos-port/reference/*
cat visionos-port/reference/callstack-0.79.6-files.txt
cat visionos-port/reference/reactvision-0.86.4-files.txt
git --no-optional-locks status --short
```

Results: rules/ownership read; patches 4,610 CS lines and 5,650 RV lines, file lists81/102 lines. Status baseline is recorded above. Reviewers also used read-only `git status --short`; no index/history mutation commands were run.

Repeated `python3 - <<'PY'` in-memory scripts used pathlib/re/difflib/json/plistlib/hashlib, with no temporary files. Operations and results:

1. Split both patches at `^diff -ruN`, extract `^+++ ([^\t]+)` paths, count `^@@`, print scoped hunks in smaller batches. **241 textual file records / 439 hunks** reviewed.
2. Parse `Binary files ... and ... differ`; expand fork-only directory entries. **44 CS and 48 RV fork-only files**, all covered by patch/binary ledger.
3. Enumerate and compare complete API directories between CS/RV and RV published package. **22/22 published parity**; differences between CS/RV represented in A rows.
4. Enumerate every published-template file, compare text with unified diffs, inspect Xcode changes/Swift/plists/Podfiles/package/resolver settings. **70/69 files**, complete grouped mapping P-16–P-24; binary wrapper/icon differences inventoried rather than decompiled.
5. Compare privacy manifests with plistlib and hash RNTester icon assets. **Privacy equality true for both; binary hashes match both forks.**
6. `Path('packages/react-native').rglob('*.podspec')`, inspect every file's platform lines. **87 total, 83 shared min_supported_versions, four documented exceptions.** Generated facade `.podspec.json` outputs require separate B-13 work.
7. Final validation reconstructed ledger independently from both patches and checked exact path/hunk equality, ID existence, one owner per mapped reference path, 121 unique row IDs, classification totals, 87/87 podspec path equality and absence of draft placeholders. **Passed.** This validates coverage bookkeeping, not compilation or runtime behavior.

Native directory comparisons were executed through Python subprocess with these literal command forms (absolute target path substituted by the subprocess):

```sh
diff -rq "$REF/gh/upstream-0.86.2/packages/react-native/React" packages/react-native/React
diff -rq "$REF/gh/upstream-0.86.2/packages/react-native/ReactApple" packages/react-native/ReactApple
diff -rq "$REF/gh/upstream-0.86.2/packages/react-native/ReactCommon" packages/react-native/ReactCommon
diff -rq "$REF/gh/upstream-0.86.2/packages/react-native/Libraries" packages/react-native/Libraries
```

Each exited1, expected for differences; report-line counts **189, 6, 733, 634** respectively. Recursive native-text comparison covered `.m .mm .h .cpp .swift .c`; no `.cc .cxx .hpp` exist in these target roots. Broader additions scan included UI/availability/TARGET_OS/Foundation/CoreGraphics/CoreText/CoreAnimation/AV/Metal names, with SDK checks where availability was uncertain.

Representative exact target searches (additional focused `rg -n`, `rg --files`, `cat` and `sed -n` reads inspected their surrounding functions):

```sh
rg -n 'UIScreen|UIDevice.*orientation|statusBar|StatusBar|UI(Impact|Selection|Notification)?FeedbackGenerator|haptic|keyWindow|brightness|interfaceOrientation|inputAccessoryView|keyboardDismissMode|UIMenuController' packages/react-native --glob '*.{m,mm,h,cpp,swift}'
rg -n 'RN_ALLOW_MULTIPLE_SCENES|UIApplicationSupportsMultipleScenes' packages/react-native
rg -n 'min_supported_versions|use_react_native!|setup_rncore|setup_react_native_dependencies|RCT_USE_PREBUILT_RNCORE|RCT_USE_RN_DEP' packages/react-native
rg -n 'platform|deployment|source_files|exclude_files' packages/rn-tester -g '*.podspec'
rg --files packages private
xcrun --sdk xros --show-sdk-path
```

Results: target symbols/current paths found and audited; no implementing RN_ALLOW_MULTIPLE_SCENES guard found outside comments; core prebuilt defaults/global cached state and generated iOS-only facades identified; RNTester extra pods use the shared map. xcrun returned `/Applications/Xcode.app/Contents/Developer/Platforms/XROS.platform/Developer/SDKs/XROS27.0.sdk`, with sandbox-related cache/FSEvents warnings. SDK header reads distinguished unavailable properties from deprecated-but-available APIs. No Xcode build was run.

Build searches/read-throughs also covered `CORE_LIBRARIES_WITH_OUTPUT_FOLDER`, `generateFBReactNativeSpecIOS`, `shouldSkipGenerationForFBReactNativeSpec`, external library discovery/provider generation, package files/exports/bin, CMake/Hermes source outputs, prepack, SwiftPM templates/binary downloads/source dependencies, and release-script package selection/results. Local Apple CLI source confirms visionos support and the xros/xrsimulator mapping; no CLI launch was executed.

The final Android-isolation review ran this exact read-only probe with already-available compiled codegen:

```sh
node <<'JS'
const p='/private/tmp/claude-501/-Users-intzero-Documents-Pingroom/4ce8d510-41a7-4917-afd8-31efd347e46c/scratchpad/vos-src/gh/reactvision-0.86/packages/react-native/visionos_modules';
const combine=require('./packages/react-native-codegen/lib/cli/combine/combine-js-to-schema.js');
const java=require('./packages/react-native-codegen/lib/generators/modules/GenerateModuleJavaSpec.js');
const schema=combine.combineSchemasInFileList([p],'android');
console.log(JSON.stringify({modules:Object.entries(schema.modules).map(([name,m])=>({name,moduleName:m.moduleName,excludedPlatforms:m.excludedPlatforms})),javaFiles:[...java.generate('FBReactNativeSpec_visionOS',schema).keys()]},null,2));
JS
```

Exit0: schema contained NativeWindowManager/WindowManager and NativeXRModule/XRModule, neither with excludedPlatforms; the returned Map included `java/com/facebook/fbreact/specs/NativeWindowManagerSpec.java` and `NativeXRModuleSpec.java`. The APIs only returned in-memory objects/maps; no write-to-file executor was called. This changed B-18 from apply to adapt: add the per-platform library filter before generateSchemaInfos. Source inspection confirms normal ReactAndroid Gradle still scans ../src, not the new directory. T2-build should test generic ios/android/all isolation and regenerate any affected test snapshots through the runner.

Some early probes failed or produced truncated output: the first patch parser split the diff command without accounting for its exclusion arguments; old test-library/package.json and a gradle/libs.versions.toml probe no longer exist; reviewers tried nonexistent old codegen/template/proxy globs. Corrected header parsing and `rg --files` located current paths; truncated hunk reads were repeated in narrower batches. These were inspection errors, not passing checks or build failures.

## Decisions and planned deviations

The inventory prefers RV where its 0.86 architecture fits 0.88, while retaining every CS-only feature or recording why it disappeared. It distinguishes intentional changes from historical mistakes. Major planned adaptations are:

- Keep Platform.OS ios, use existing isVision, and make all new guards/behavior visionOS-only. Do not copy globally changed appearance/focused-window behavior, bundle resolver flags or CMake requirements.
- Use window bounds/trait scale, current Fabric root/property APIs and current scene/link handlers. Do not resurrect legacy components or the removed cache proxy. Preserve iOS assertions/fallbacks/current callbacks.
- Keep source React core on visionOS and existing prebuilt Hermes/RNDeps, unlike RV's blanket no-xros-artifact policy. Add platform metadata to newly generated dependency facades.
- Separate source SwiftPM integration from binary consumer delivery; mere platform declaration is insufficient. Source RN core does not need a prebuilt xros React binary.
- Generate new native specs/types with 0.88 tools, preserve named public types and optional/null payload calls, and record the reference's false runtime Window declaration as a compatibility correction. Filter the new library out of generic Android codegen explicitly: an in-memory probe confirmed ios metadata alone does not isolate it. Do not copy CS's StyleSheet export typo or unrelated snapshot hashes/version stamps.
- Correct reference pending/rejected promise paths and XR session bookkeeping; test runtime module lookup rather than assume a proven registration failure.
- Generate/reconcile RNTester target cleanly, keep existing iOS project/test behavior, reuse upstream privacy plist, and build a usable bare template with verified Metro/CLI/package resolution rather than stale RV assumptions.
- Port reviewable fork release preparation while omitting foreign branding/bots, old publication targets, unrelated upstream recovery workflows and historical CI churn.

These are **instructions for later tasks**, not claims that fixes are implemented or tested. Detailed function/API/guard and per-file dispositions are in INVENTORY.md.

## Unresolved or unverified

- Minimum deployment version accepted by the complete 0.88 visionOS dependency graph; start from reference core1.0 but verify. RV template26.0 was tied to Viro, not this generic core.
- Mixed iOS/visionOS Podfile mode: prebuilt-core state is process-global/cached, so preserving iOS behavior requires a real design/install/build check, not a late ENV assignment.
- Full source SwiftPM target/API integration and a viable consumer binary-flow alternative when React.xcframework lacks xros.
- Actual runtime behavior for multiwindow/ornament selection, diagnostic-window helpers, initial URLs, first/resized dimensions, XR failure/cancellation/reopen and optional payloads. Module class-name fallback exists, but successful linkage/lookup was not run.
- Historical reasons for CS Hermes hook suppression/RV dropping it and initial push-notification suppression remain uncertain; the inventory names the tests that would settle them.
- PLAN ownership gaps: Package.swift/package README/root Jest, types_DEPRECATED/types_generated/type tests, generated React visionOS specs, any community-cli codegen alias and lockfile regeneration need explicit coordination/requests. Inventory accountability does not grant edit access.
- Actual fork repository/release metadata and hosted CI runner/Xcode configuration. No URLs or successful CI results were invented.
- User-provided xcframework slice facts were used as evidence; binary artifacts were not fetched or independently inspected.

Not run: yarn install, filesystem-output codegen/prepack/npm pack, type/lint/Jest suites, podspec evaluation/pod install, SwiftPM resolution/build, xcodebuild, simulator launch or UI tests, CI, release/tag/publish. These would change files outside T1's allowed scope or belong to implementation/verification phases. T1's completed validation is source/coverage auditing plus the read-only in-memory codegen probe; it does not establish a successful native build or app launch.
