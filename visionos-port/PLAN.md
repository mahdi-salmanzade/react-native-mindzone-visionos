# visionOS port plan: react-native-mindzone-visionos 0.88.0

Goal: upstream React Native 0.88.0 plus everything `@callstack/react-native-visionos@0.79.6` added, published as `react-native-mindzone-visionos`.

"Everything" covers:

- The visionOS build system: CocoaPods platforms, Hermes, prebuilt handling and codegen.
- Native platform guards.
- The visionOS JS/native APIs: `XR`, `WindowManager`, `SwiftExtensions`, `visionos_modules` and `Platform.isVision`.
- The CLI wiring for `run-visionos`.
- The RNTester visionOS target.
- An app template.
- CI and release scripts.

`@reactvision/react-native-visionos@0.86.4` already carried most of this to 0.86.2, so it is the primary reference wherever the two forks disagree. If the forks conflict, pick the version that fits 0.88's actual code and record the choice in your report.

## Reference material (read-only, outside the repo)

`$SCRATCH` was the orchestrator's session scratch directory on the build machine. It is not part of this repo, and paths under it are kept only as a record.
To recreate `$REF`:
- the `gh/*` trees: `gh api repos/<owner>/<repo>/tarball/<ref>` for `callstack/react-native-visionos@0.79-stable`, `ReactVision/react-native-visionos@0.86-stable`, and `facebook/react-native` at `v0.79.6`, `v0.86.2` and `v0.88.0`;
- the `npm/*` packages: `npm pack` of the listed packages.

`$REF` = `$SCRATCH/vos-src`

| Path | What |
| --- | --- |
| `$REF/gh/upstream-0.79.6` | upstream monorepo at v0.79.6 (Callstack's base) |
| `$REF/gh/callstack-0.79` | Callstack fork monorepo, branch `0.79-stable` |
| `$REF/gh/upstream-0.86.2` | upstream monorepo at v0.86.2 (ReactVision's base) |
| `$REF/gh/reactvision-0.86` | ReactVision fork monorepo, branch `0.86-stable` |
| `$REF/gh/upstream-0.88.0` | upstream monorepo at v0.88.0 (identical to this repo's base) |
| `$REF/npm/_reactvision_react-native-visionos_0.86.4/package` | ReactVision's published npm package (shows the publish `files` set) |
| `$REF/npm/_reactvision_visionos-template_0.86.4/package` | ReactVision app template |
| `$REF/npm/_callstack_visionos-template_0.79.6/package` | Callstack app template |
| `visionos-port/reference/*.patch` | `diff -ruN` of each fork against its upstream base (committed copies) |
| `visionos-port/reference/*-files.txt` | `diff -rq` file lists for the same |

Tooling:

- **Yarn 1.22.22** is at `$SCRATCH/tools/node_modules/.bin/yarn`; it is already on `PATH` for agent runs.
- **Node** is v26.
- **Xcode** is 27.1, with the `xros27.0` and `xrsimulator27.0` SDKs installed.
- **The visionOS 27.0 simulator runtime** (24M362) is installed, with the device type "Apple Vision Pro".

## Tasks and file ownership

Ownership is exclusive within a phase. Paths are relative to the repo root, and `RN` = `packages/react-native`.

| ID | Phase | Owns | Summary |
| --- | --- | --- | --- |
| T1-inventory | 1 | `visionos-port/INVENTORY.md` | Map every hunk of both reference diffs to its 0.88 target: apply, already-upstream, obsolete (file removed or arch gone) or redesign. Assign each item to a T2/T3 owner. |
| T2-build | 2 | `RN/package.json`, `RN/react-native.config.js`, `RN/cli.js`, `RN/local-cli/**`, `RN/scripts/**`, `RN/sdks/**`, every `*.podspec` under `RN/` except the ones listed under T2-apis, `RN/Package.swift`, `RN/README.md`, root `package.json`, root `jest.config.js`, `yarn.lock` (only for the B-26 root `react-native` link), `packages/community-cli-plugin/**`, `scripts/**`, `.github/**`, `.gitignore`, `README.md` | Package identity (`react-native-mindzone-visionos`, version `0.88.0`), CocoaPods `visionos` platform in `min_supported_versions` and every podspec, Hermes for xros, prebuilt-core handling (React.xcframework has no xros slice, so visionOS builds from source), codegen, `run-visionos` CLI wiring, release script (`oot-release.js`), CI workflow |
| T2-native | 2 | `RN/React/**`, `RN/ReactApple/**`, `RN/ReactCommon/**`, native files (`.m .mm .h .cpp .swift`) under `RN/Libraries/**` except the new visionOS dirs below | `TARGET_OS_VISION` guards and visionOS code paths in the runtime: scenes/windows, key-window lookup, device info and dimensions, alerts, dev menu, linking, keyboard, scroll view, text input, pointer/hover handling, app delegate and root view factory |
| T2-apis | 2 | `RN/Libraries/XR/**`, `RN/Libraries/WindowManager/**`, `RN/Libraries/SwiftExtensions/**`, `RN/visionos_modules/**`, `RN/React/React-RCTFBReactNativeSpecVisionOS.podspec` (new), `RN/index.js`, `RN/index.js.flow`, JS files under `RN/Libraries/**` and `RN/src/**`, `RN/types/**`, `RN/types_generated/**`, `RN/types_DEPRECATED/**`, `RN/__typetests__/**`, `RN/ReactNativeApi.d.ts` | The visionOS JS/native APIs and their codegen specs, `Platform.isVision`, public exports, TypeScript types and regenerated API snapshots |
| T3-apps | 3 | `packages/rn-tester/**`, `packages/visionos-template/**` (new), `private/helloworld/**`, `packages/react-native-test-library/**`, `packages/jest-preset/**` | RNTester visionOS target, scheme and examples (`XR`, `SecondWindow`). A new template package `react-native-mindzone-visionos-template` derived from the ReactVision 0.86.4 template and updated for 0.88 |
| T4-verify | 4 | whole repo (sole agent) | Install, codegen, `pod install`, `xcodebuild` RNTester-visionOS and the template app for `xrsimulator`, fix what breaks, launch in the visionOS simulator, prove iOS still builds |
| T5-review | 5 | read-only | Independent review of the full diff against `base/upstream-v0.88.0` |

## Gates

1. **After T1:** the orchestrator reviews `INVENTORY.md`.
2. **After T2:** the orchestrator reviews the diff and the reports, and applies the `requests/` files.
3. **T4 done means all of these, each with its exact command:**
   - RNTester-visionOS builds for `xrsimulator`.
   - The template app builds.
   - At least one launches in the simulator with a screenshot (once the runtime is installed).
   - RNTester still builds for `iphonesimulator`.
   - `yarn flow-check`, `yarn lint` and `yarn test` results are recorded.
4. **After T5:** fix the review findings, then the orchestrator commits to `main`. Pushing and publishing need the owner's explicit go.

## Status

| ID | State |
| --- | --- |
| T1-inventory | done: 121 items |
| T2-build / T2-native / T2-apis | done, plus T2-fixup (withdrew the invented hover prop, fixed formatting churn) |
| T3-apps | done: RNTester-visionOS target, `react-native-mindzone-visionos-template` |
| T4-verify | done. Workspace builds pass for RNTester visionOS and iOS and for the template on visionOS; the orchestrator ran them outside the sandbox. RNTester runs in the Apple Vision Pro simulator |
| T5-review | done: 8 visionOS-only findings, no off-visionOS findings |
| T6–T8 fixes | done: all 8 fixed, plus two regressions caught by simulator probes (scene recursion crash, duplicate windows) |
| T9-rereview | done: no verified defects |
| T10/T10b audit, T11 fixes, T12/T13 reviews | done. Release-readiness audit with real consumer installs on visionOS, iOS and Android; see `reports/FINAL-validation.md` |

Still not verified at runtime:
- window restoration after relaunch;
- closing the main window by hand;
- leaving the immersive space with the Digital Crown;
- cold and warm deep links (blocked by visionOS's system prompt on this machine);
- interactive pointer, hover and keyboard input;
- Release, device, framework-mode CocoaPods and SwiftPM consumer builds.

Not done (needs the owner): a real repository remote (`package.json` metadata is a placeholder), and npm publication.
