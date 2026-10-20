You are task **T3-apps** in the visionOS port of this React Native 0.88.0 fork (`react-native-mindzone-visionos`).

{{COMMON}}

Phase 2 (T2-build, T2-native, T2-apis) is finished. Read their reports in `visionos-port/reports/`, especially the WindowManager and XR scene-manifest expectations and the CLI wiring. Then do the following.

## Your area: RNTester visionOS target, app template, sample apps

You own `packages/rn-tester/**`, `packages/visionos-template/**` (new), `private/helloworld/**`, `packages/react-native-test-library/**` and `packages/jest-preset/**`.

**1. RNTester visionOS target.**

- Port `RNTester-visionOS`: its Swift `App` entry, Info.plist with the scene manifest, assets, entitlements and `PrivacyInfo.xcprivacy`.
- Port the `RNTester-visionOS.xcscheme` scheme and ReactVision's `scripts/add-visionos-target.rb`.
- Port the `XR` and `SecondWindow` JS examples, plus their registration in the examples lists.
- 0.88's `RNTesterPods.xcodeproj` and `Podfile` differ from 0.86. Prefer adding the target with the script (re-runnable, documented) over hand-editing `project.pbxproj`. If you do edit the pbxproj, keep the edit minimal and valid, and check it with `plutil -lint` or `xcodebuild -list -project ...`.
- In the Podfile, add a `visionos` target block like the forks did.
- iOS RNTester must stay unchanged.

**2. The template package** `packages/visionos-template`, npm name `react-native-mindzone-visionos-template`, version `0.88.0`:

- Start from `$REF/npm/_reactvision_visionos-template_0.86.4/package`, and cross-check against `$REF/npm/_callstack_visionos-template_0.79.6/package`.
- Update every dependency to match upstream 0.88's own app template and `private/helloworld`: react, `@react-native/*` packages, babel/metro config, TypeScript and Jest.
- The template depends on `react-native-mindzone-visionos@0.88.0`.
- Update the native project (`visionos/` Xcode project, Podfile with `platform :visionos`, Swift `App`) for the 0.88 `RCTReactNativeFactory` / `RCTRootViewFactory` APIs and the T2-apis SwiftExtensions.
- Give it a README covering `npx @react-native-community/cli init MyApp --template react-native-mindzone-visionos-template`, the env vars T2-build requires, and running in the visionOS simulator.

**3. `private/helloworld` and `packages/react-native-test-library`.** Port whatever the inventory assigns to you. Keep upstream behaviour on iOS.

**Checks** (record them):

- `xcodebuild -list` on every project you touch.
- `plutil -lint` on every plist.
- `ruby -c` on Ruby files.
- Jest for the examples, if any.
- `pod install --verbose` is T4's job, not yours. Don't run it.
