You are task **T2-apis** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`).

{{COMMON}}

## Your area: visionOS APIs, JS surface, types

You own `packages/react-native/Libraries/{XR,WindowManager,SwiftExtensions}/**`, `packages/react-native/visionos_modules/**`, the new `React-RCTFBReactNativeSpecVisionOS.podspec`, `index.js`, `index.js.flow`, the JS files under `Libraries/**` and `src/**`, `types/**` and `ReactNativeApi.d.ts`. The exact list is in PLAN.md.

Beyond the inventory items, make sure the following hold.

**XR API (immersive spaces).** Port the native module (Swift/ObjC), its JS wrapper and its codegen spec: `requestSession`, `endSession`, and anything else the forks expose. Carry over the documentation comments, and update it for 0.88's TurboModule and codegen conventions. Check how 0.88 declares Native specs: Flow `Native*.js` and the `codegenConfig` in `packages/react-native/package.json`, which T2-build owns. If the `codegenConfig` or a podspec needs a new entry, file a request.

**WindowManager API (multiple windows).** Port the module, the JS wrapper, `getWindow(id).open/close/update`, and the Info.plist/`UIApplicationSceneManifest` expectations. Document those expectations in your report so T3 can wire RNTester and the template.

**SwiftExtensions.** Port the SwiftUI bridging helpers the forks shipped, which let a SwiftUI `App` host the RN root view and immersive spaces. 0.88's `RCTReactNativeFactory` / `RCTRootViewFactory` may have changed shape. Adapt to the 0.88 APIs, and file requests to T2-native for any ObjC change.

**Platform.** `Platform.isVision` exists and is correct, with `Platform.OS === 'ios'` on visionOS. Cover `Platform.select`, `PlatformColor`, `Platform.constants` (`interfaceIdiom` `vision`), and anything else the forks touched in JS: `ScrollView`, `StatusBar`, `Keyboard`, `KeyboardAvoidingView`, `InputAccessoryView`, `Linking` and the `NewAppScreen` header. Keep upstream behaviour off visionOS.

**Hover prop.** `visionos_hoverEffect`, or whatever name the forks used, is declared in the view props, the view config and the TS types. Coordinate the native side with T2-native through `requests/`.

**Public API and types.**

- Export the new APIs from `index.js` / `index.js.flow` exactly the way the forks did.
- Regenerate the TS types and the `ReactNativeApi.d.ts` snapshot with the repo tooling: `yarn build-types`, then `yarn test-generated-typescript`.
- Run `yarn flow-check`, `yarn lint` (scoped to your files if the full run is too slow; record which) and the relevant `yarn test <path>` suites. Add Jest tests where the forks had them.
