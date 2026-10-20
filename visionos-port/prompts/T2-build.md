You are task **T2-build** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`).

{{COMMON}}

## Your area: build system, packaging, CLI, release and CI

Your ownership list is in PLAN.md. Beyond the inventory items, make sure the following are true when you finish.

**Package identity** (`packages/react-native/package.json`):

- `name` is `react-native-mindzone-visionos`, `version` is `0.88.0`.
- `repository`, `homepage` and `bugs` point at a placeholder `https://github.com/mindzone/react-native-mindzone-visionos`. Mark it in your report as a placeholder the owner must confirm.
- Keep the MIT `LICENSE` and Meta's copyright notice, and add attribution to Callstack and ReactVision in `README.md`.
- The `files` field ships everything the visionOS build needs, including the new dirs, `local-cli`, `visionos_modules`, and the XR, WindowManager and SwiftExtensions libraries. Compare with `$REF/npm/_reactvision_react-native-visionos_0.86.4/package`.
- Keep `bin` working.
- Apps must be able to depend on this package under the name `react-native`, through an npm alias, *or* import it directly, the way Callstack documented. Document both in the README.

**CocoaPods:**

- `min_supported_versions` (and wherever 0.88 computes podspec platforms) includes `visionos` at the minimum the forks used, unless 0.88 needs higher. Justify the number.
- Every podspec under `packages/react-native` that compiles on visionOS declares it.
- The visionOS build works with `RCT_USE_PREBUILT_RNCORE` / `RCT_USE_RN_DEP`. In 0.88, `React.xcframework` has no xros slice, but `ReactNativeDependencies.xcframework` and `hermesvm.xcframework` do.
  - Either make visionOS builds fall back to building React Native core from source automatically, or document the env var that is required.
  - Choose the option that cannot silently break iOS.
- Hermes resolves for xros.
- `react_native_post_install` and the other helpers handle visionOS targets: deployment target, `SUPPORTED_PLATFORMS`, `TARGETED_DEVICE_FAMILY` 7, and any per-platform build settings the forks set.

**Static checks to run:**

- `pod ipc spec <file> | python3 -c 'import json,sys; print(json.load(sys.stdin).get("platforms"))'` for every podspec you change, plus a sample of unchanged ones.
- `ruby -c` on every Ruby file you touch.
- The repo's own Ruby tests, if any cover these scripts (look under `packages/react-native/scripts/cocoapods/__tests__`). Run them with the bundled Ruby/Bundler if possible.

**CLI:** `run-visionos` and `build-visionos` work through `@react-native-community/cli-platform-apple` as the forks wired it in `react-native.config.js`, with `local-cli` updated for 0.88's community-cli-plugin.

**Release:** `scripts/oot-release.js` (or its 0.88 equivalent) can produce publishable tarballs for `react-native-mindzone-visionos` and `react-native-mindzone-visionos-template`. Make it support a dry run, and **never** let it publish without an explicit flag. Don't run a real publish.

**CI:** port the visionOS GitHub workflow (`test-visionos.yml`) and the `test-visionos-rntester` action, adapted to this repo. Leave upstream workflows alone, except where a reference fork disabled one for good reason; record any change.
