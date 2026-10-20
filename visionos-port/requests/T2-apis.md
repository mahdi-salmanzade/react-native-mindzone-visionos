# T2-apis integration requests

These requests accompany the T2-apis source port. Some may already be implemented by the concurrently running owner; please verify the resulting contract rather than duplicate changes.

## T2-build: codegen, pods and published files (A-13, A-16, A-20–22)

- `packages/react-native/package.json`: add the separate codegen library `{ "name": "FBReactNativeSpec_visionOS", "type": "modules", "jsSrcsDir": "visionos_modules" }` alongside the upstream library; include `visionos_modules` in `files`. Keep the new library out of Android generation. The specs use required string IDs and nonnullable `UnsafeObject` payloads; public wrappers normalize omitted/null payloads to `{}`.
- `packages/react-native/scripts/codegen/generate-artifacts-executor/*`: generate with Apple platform `ios`, map this library to `React/FBReactNativeSpec_visionOS`, and ensure the generated nested header/implementation and top-level JSI header are included before packaging. Coordinate generated-file ownership with T2-native. Do not hand-edit generated source.
- `packages/react-native/React-Core.podspec`: add `RCTXRHeaders => Libraries/XR/*.h` and `RCTWindowManagerHeaders => Libraries/WindowManager/*.h` header subspec mappings, matching the new module pod dependencies. They must expose headers with the React import prefix.
- `packages/react-native/scripts/react_native_pods.rb`: install `React-RCTXR`, `React-RCTWindowManager`, `React-RCTSwiftExtensions` and `React-RCTFBReactNativeSpecVisionOS` only for visionOS. Compile the new modules and generated implementation from source, even if another target uses prebuilt core.
- SwiftPM source graph (B-21): include the same source modules/spec and SwiftExtensions visionOS sources, with equivalent dependency and source gating. CocoaPods source compatibility alone does not establish SwiftPM integration.
- Finalize repository/source metadata in `package.json`. New podspecs derive source/homepage from it; T2-apis does not invent a fork remote URL.

## T2-native: focused-window and platform contracts (A-01, A-05, A-12)

- `packages/react-native/Libraries/AppDelegate/RCTAppDelegate.h`: under `#if TARGET_OS_VISION`, declare `@property (nonatomic, weak) UIWindow *lastFocusedWindow;`. The SwiftUI host updates this property on taps; N-10's key-window lookup should consume it.
- Preserve `RCTAppDelegate.rootViewFactory` / `RCTReactNativeFactory.rootViewFactory` access for the SwiftUI host and the current `RCTSurfaceHostingProxyRootView.appProperties` setter. No additional factory change is requested unless the native port needs one.
- Verify the native visionOS StatusBar stub handles imperative calls (component mount/unmount now return early on visionOS).
- Preserve `Platform.OS = 'ios'`, native `interfaceIdiom = 'vision'`, and existing Fabric `cursor: 'pointer'` -> `UIHoverAutomaticEffect` behavior. Neither reference fork declares `visionos_hoverEffect`; both use the existing cursor style prop/config/types instead.

## T3-apps: scene and SwiftUI wiring

- Add `UIApplicationSceneManifest` to the visionOS Info.plist with `UIApplicationSupportsMultipleScenes = true`, `UIApplicationPreferredDefaultSceneSessionRole = UIWindowSceneSessionRoleApplication`, and an empty `UISceneConfigurations` dictionary for SwiftUI-managed scenes (see reference plists).
- Set `automaticallyLoadReactNativeWindow = false` on the app delegate and provide the current app dependency provider. Host `RCTMainWindow(moduleName: ...)` in the SwiftUI App, share an `RCTReactContext`, and forward URL opens to `RCTLinkingManager.onOpenURL`.
- Declare each secondary ID as `RCTWindow(id: ..., sceneData: reactContext.getSceneData(id: ...))`; register its React component. `WindowManager.getWindow(id).open(props)` supplies scene data; `.update(props)` merges into the React root; `.close()` dismisses it.
- Declare each immersive ID as a SwiftUI `ImmersiveSpace`. `XR.requestSession(id, props?)` requires that exact ID and multiple-scene support. Pass the shared context into scene content when consuming its props.
- Exercise open/update/close, immersive open/cancel/failure/end/reopen, resizing/focus, deep links, and iOS regressions in T4. JS promise tests and SDK type checks do not prove runtime scene behavior.

## T2-build / orchestrator: formatting incident to review

A purported scoped `yarn prettier --check <paths>` command invoked the root script's existing global `prettier --write "./**/*.{js,md,yml,ts,tsx}"`. It reported formatting these concurrently edited T2-build-owned files: `packages/react-native/scripts/setup-apple-spm.js`, `packages/react-native/scripts/spm/generate-spm-autolinking.js`, `packages/react-native/scripts/spm/scaffold-package-swift.js`, `scripts/monorepo/for-each-package.js`, and `scripts/new-github-release-url.js`. Another invocation was interrupted before reaching scripts. No semantic edits or rollback were attempted by T2-apis in these files; please review the formatting in your diff and preserve or adjust it as appropriate. Subsequent formatting uses the direct local binary with explicit owned paths.

## T2-build: retain the internal react-native alias during API snapshot generation

Target: `scripts/js-api/build-types/buildApiSnapshot.js`, `findPackagesWithTypedef()`.

Change the returned package name from `name: packageJson.name as string` to:

```js
// Source imports retain the react-native npm alias in this fork.
name: pkg === 'react-native' ? 'react-native' : (packageJson.name as string),
```

Why: after B-01 renames the core package, API Extractor's cycle resolver no longer rewrites internal `from 'react-native'` imports. The generated snapshot gains self-import aliases and unrelated list/API hashes. Its temporary directory remains `react-native`; the resolver must treat this source alias as that directory regardless of the published package name. T2-apis is validating this exact change in a temporary copy of the generator, without editing the owned script.

The standard type generator also emits `packages/virtualized-lists/types_generated`, outside T2-apis ownership. T2-apis ran it in a temporary source projection, copied only the owned core generated types, and tested against the sibling generated types in that temporary directory. Please run ordinary `yarn build-types` and `yarn test-generated-typescript` after accepting this generator alias fix so the normal workspace also has the required sibling output. No node_modules changes are required.

## T2-build: Flow check of codegen deduplication

Target: `packages/react-native/scripts/codegen/generate-artifacts-executor/utils.js:171`.

The final full Flow check reports `underconstrained-implicit-instantiation` for `const seenCoreLibraries = new Set();`. Use `const seenCoreLibraries /*: Set<string> */ = new Set();`, preserving executable JavaScript syntax, because it stores codegen library names. T2-apis did not edit this file.

## Integration status after T2-fixup

The orchestrator withdrew the explicit hover contract; T2-fixup removed its native/Flow/config/legacy/generated declarations and restored upstream cursor behavior. The API snapshot alias fix and codegen Set annotation above are applied. Ordinary workspace `yarn build-types`, `yarn test-generated-typescript`, full lint, and Flow now pass. See [T2-fixup report](../reports/T2-fixup.md) for commands, test counts, and upstream failure comparisons. Focus/initial-attachment/resize-completion/disconnection requests and both SwiftPM imports remain implemented.
