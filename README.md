# React Native Mindzone for visionOS

`react-native-mindzone-visionos` adds Apple visionOS support to React Native
**0.88.0**. The upstream base is commit `5c35c82`; the package's
`reactNativeUpstreamVersion` records the artifact version independently of future
fork patch releases.

This port carries forward [Callstack's visionOS support](https://github.com/callstack/react-native-visionos)
from 0.79.6 and [ReactVision's port](https://github.com/ReactVision/react-native-visionos)
from 0.86.4. React Native is developed by Meta and its contributors. The MIT
[LICENSE](./LICENSE), including Meta's copyright notice, is retained.

The repository, homepage, and issue URLs currently use
`https://github.com/mindzone/react-native-mindzone-visionos` as an **owner-confirmation
placeholder**. They do not establish that a public repository or npm release exists.

## Requirements

- A supported Node version: `^22.13.0 || ^24.3.0 || >=26.0.0`.
- macOS, Xcode with the visionOS SDK and an installed Apple Vision Pro simulator
  runtime, and CocoaPods supporting visionOS. This checkout's port environment uses
  Xcode 27.1; deployment declarations retain the references' visionOS **1.0** floor.
  Dependency and app compatibility at that floor still requires native verification.
- Community CLI and `@react-native-community/cli-platform-apple` **20.2.0**. The Apple
  CLI implements `run-visionos`, `build-visionos`, and `log-visionos`.
- CMake **3.28 or newer** if building Hermes from source for visionOS. The normal
  configuration uses prebuilt Hermes and React Native Dependencies.

## Install as `react-native` with an npm alias

After the packages are published, an app can replace its React Native dependency
with the fork while retaining existing imports:

```sh
npm install react-native@npm:react-native-mindzone-visionos@0.88.0
npm install --save-dev @react-native-community/cli@20.2.0 \
  @react-native-community/cli-platform-apple@20.2.0 \
  @react-native-community/cli-platform-ios@20.2.0 \
  @callstack/out-of-tree-platforms
```

```js
import {Platform, XR, WindowManager} from 'react-native';
```

The executable remains `react-native`. The CLI detects the installed alias when
registering the visionOS package with Metro.

## Install alongside upstream and import directly

Apps can also retain `react-native@0.88.0` and install the fork by its own name:

```sh
npm install react-native@0.88.0 react-native-mindzone-visionos@0.88.0
npm install --save-dev @react-native-community/cli@20.2.0 \
  @react-native-community/cli-platform-apple@20.2.0 \
  @react-native-community/cli-platform-ios@20.2.0 \
  @callstack/out-of-tree-platforms
```

```js
import {Platform, XR, WindowManager} from 'react-native-mindzone-visionos';
```

Point the app's `react-native.config.js` at the fork for native tooling:

```js
const path = require('node:path');
const reactNativePath = path.dirname(
  require.resolve('react-native-mindzone-visionos/package.json'),
);
module.exports = {
  reactNativePath,
  commands: require(path.join(reactNativePath, 'react-native.config.js')).commands,
};
```

The explicit command list keeps fork-aware Codegen and SwiftPM dispatch when both
packages register the same command names.

Use the fork's `scripts/react_native_pods.rb` in the visionOS Podfile and pass this
resolved package directory to `use_react_native!`. Dependencies which import
`react-native` must resolve to the same fork in a visionOS bundle. In
`metro.config.js`, use Callstack's resolver as in the reference template:

```js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {getPlatformResolver} = require('@callstack/out-of-tree-platforms');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    resolveRequest: getPlatformResolver({
      // Use 'react-native' here for the npm alias installation above.
      platformNameMap: {visionos: 'react-native-mindzone-visionos'},
    }),
  },
});
```

The app's visionOS bundle keeps `platform=ios` and supplies
`platformExtension=visionos`. The fork's Xcode bundling script adds that resolver
option for xros/xrsimulator only. Preserve it when adding a custom bundle phase.

## Create and run an app

The companion package is `react-native-mindzone-visionos-template`. After release:

```sh
npx @react-native-community/cli@20.2.0 init MyApp \
  --template react-native-mindzone-visionos-template@0.88.0
cd MyApp/visionos
RCT_USE_PREBUILT_RNCORE=0 bundle exec pod install
cd ..
RCT_USE_PREBUILT_RNCORE=0 npx react-native run-visionos --simulator "Apple Vision Pro"
RCT_USE_PREBUILT_RNCORE=0 npx react-native build-visionos --mode Release
```

React Native 0.88's `React.xcframework` has no xros slice. Set
**`RCT_USE_PREBUILT_RNCORE=0` before the first `use_react_native!` call in the pod
installation process**. This is also required for a mixed iOS/visionOS Podfile;
all targets in that installation then use source core. Setting the variable only
inside a later visionOS target is too late. Ordinary iOS-only installations keep
the upstream prebuilt-core default.

Leave `RCT_USE_RN_DEP` at its default: `ReactNativeDependencies.xcframework` and
`hermesvm.xcframework` include xros slices. There is no need to force source Hermes.
The new binary SwiftPM consumer flow also needs an xros React core artifact;
CocoaPods source core is the documented app installation path for this port.

## visionOS APIs

`Platform.OS` remains **`'ios'`**. Use `Platform.isVision` for visionOS-specific
behavior. `XR` manages immersive spaces and `WindowManager` manages additional
SwiftUI windows. The native `SwiftExtensions` library supplies the SwiftUI root
and window integration. Configure the corresponding SwiftUI scenes in the app;
JavaScript exports alone do not create them.

`WindowManager.getWindow(id)` addresses one registered `RCTWindow`. One
`open(props)` call opens one window. Reopening the same ID, including while its
first open is pending, reuses that window and shallowly merges the supplied props.
`update(props)` shallowly merges incoming props into that window's React root;
unspecified props keep their previous values. Null and undefined prop values
are ignored: `update({nullable: null})` leaves an existing `nullable` value
unchanged. `update(null)` and `update()` are empty updates. The same ignored-value
rule applies to initial props passed to `open`.

The default TurboModule conversion also omits null-valued keys inside nested
objects, while preserving null array elements. Updates replace each supplied
nested object as a whole; they do not recursively merge it. This fork leaves
`enableModuleArgumentNSNullConversionIOS` at its upstream default and provides no
null-based prop-clearing operation.

`RCTMainWindow` and `RCTWindow` both host request routing, so window operations
continue from a surviving React scene after the main window closes. A custom
React scene must apply `.modifier(WindowHandlingModifier())` to host routing.
A custom window group addressed by WindowManager must use String-valued identity:
`WindowGroup(id: id, for: String.self) { _ in /* content */ } defaultValue: { id }`.

React Native's [component and API documentation](https://reactnative.dev/docs/getting-started)
applies to shared functionality. This fork does not claim automatic Expo or Viro
integration.

## Develop and verify

Run commands from the repository root with Yarn 1.22.22. Build Codegen once before
Metro or prepacking:

```sh
yarn --cwd packages/react-native-codegen build
yarn start
```

RNTester uses the **RNTester-visionOS** scheme. Install its pods with
`RCT_USE_PREBUILT_RNCORE=0`, then open `packages/rn-tester/RNTesterPods.xcworkspace`
in Xcode. The visionOS CI workflow builds that scheme for Debug and Release.

The port's inventory, ownership rules, verification status, and known limitations
are recorded in `visionos-port/` in the source checkout. A full app build, launch,
and iOS regression check are separate verification gates; setup instructions are
not a claim those checks have passed.

## Prepare a release

Only the fork and template packages are selected. The template must be present,
and generated public types must be available (`yarn build-types`). Planning does
not write files or run hooks:

```sh
node scripts/oot-release.js --new-version 0.88.0 --dry-run
```

Prepare tarballs locally, with no publishing or git operations:

```sh
node scripts/oot-release.js --new-version 0.88.0 --output /tmp/mindzone-release
```

Preparation runs React Native's prepack generation, checks required package
contents, and stages version/dependency changes outside the checkout. It leaves
workspace package versions unchanged. Upstream tooling and artifacts stay at
`reactNativeUpstreamVersion`; both fork packages and template references receive
the requested release version. Prereleases default to `next` or `nightly`.

Publishing is possible only with the explicit `--publish` flag; supplying an OTP
alone does not publish. Every tarball must be prepared successfully before any
upload begins, and any failed upload exits with an error. Publishing two npm
packages is not atomic; if a later upload fails, earlier uploads remain published.
The script never creates git tags or GitHub releases. An optional
`--release-repository https://github.com/OWNER/REPO` prints a draft-release link
using a destination the owner has confirmed.
