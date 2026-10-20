# T3-apps integration requests

## T2-build / T4 / orchestrator: HelloWorld local E2E override

Target: `scripts/e2e/init-project-e2e.js`, `_prepareHelloWorld`, existing
`if (pathToLocalReactNative != null)` block.

Apply this exact change:

```diff
   if (pathToLocalReactNative != null) {
+    delete packageJson.dependencies['react-native-mindzone-visionos'];
     packageJson.dependencies['react-native'] = `file:${pathToLocalReactNative}`;
   }
```

Why: P-12 changes HelloWorld's dependency to the local fork's package name,
while the repository already supplies the canonical `react-native` workspace
alias. The E2E helper explicitly replaces that workspace setup with a selected
local core package. Leaving the fork registry dependency behind makes
`--useHelloWorld --pathToLocalReactNative` retain an unresolved/unpublished
`react-native-mindzone-visionos@0.88.0` alongside the local override. Removing
that key in this local-override branch preserves the helper's existing one-core
alias behavior, and is a no-op for upstream manifests without the fork key.

Verification: a read-only VM execution of the actual `_prepareHelloWorld`
function with intercepted `fs.writeFileSync` confirmed the current output
contains both the stale registry fork and the new local alias. No E2E install,
Git operation or network command was run. T3 does not own this script.

## T2-build / orchestrator: retain the new RNTester shared scheme

Target: root `.gitignore`, immediately after `/packages/rn-tester/**/*.xcodeproj`.

Add this narrowly scoped exception chain:

```gitignore
!/packages/rn-tester/RNTesterPods.xcodeproj/
/packages/rn-tester/RNTesterPods.xcodeproj/*
!/packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/
/packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/*
!/packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/xcschemes/
/packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/xcschemes/*
!/packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/xcschemes/RNTester-visionOS.xcscheme
```

Why: the new shared scheme exists and `xcodebuild -list` sees it, but the upstream
directory exclusion hides it from normal `git status`/staging. Existing tracked
project/scheme files remain tracked. These exceptions expose only the new scheme
and preserve exclusions for other generated project contents. Alternatively the
orchestrator can deliberately stage this exact scheme with force. T3 is not
allowed to edit root `.gitignore` or perform any Git writes. The re-runnable
generator also recreates the scheme when missing.

Evidence: `git check-ignore -v
packages/rn-tester/RNTesterPods.xcodeproj/xcshareddata/xcschemes/RNTester-visionOS.xcscheme`
reports `.gitignore:107:/packages/rn-tester/**/*.xcodeproj`.
