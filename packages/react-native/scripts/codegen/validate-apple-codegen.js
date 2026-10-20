/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  findCodegenEnabledLibraries,
  findDisabledLibrariesByPlatform,
  readPkgJsonInDirectory,
  readReactNativeConfig,
} = require('./generate-artifacts-executor/utils');

// A mixed Podfile shares one ReactCodegen pod and generated providers. Different
// exclusions require separate CocoaPods installations, not a second generation
// that overwrites the first target's files.
function validateAppleCodegen(
  projectRoot /*: string */,
  baseOutputPath /*: string */,
) {
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const config = readReactNativeConfig(projectRoot, baseOutputPath);
  const libraries = findCodegenEnabledLibraries(
    pkgJson,
    projectRoot,
    baseOutputPath,
    config,
  );
  const iosDisabled = findDisabledLibrariesByPlatform(config, 'ios');
  const visionDisabled = findDisabledLibrariesByPlatform(config, 'visionos');
  const differences = libraries
    .filter(
      ({name}) => iosDisabled.includes(name) !== visionDisabled.includes(name),
    )
    .map(({name}) => name);
  if (differences.length > 0) {
    throw new Error(
      `iOS and visionOS targets share ReactCodegen but have different dependency exclusions: ${differences.join(', ')}. ` +
        'Use separate Podfiles/installations for iOS and visionOS, or matching codegen dependency exclusions.',
    );
  }
}

if (require.main === module) {
  validateAppleCodegen(process.argv[2], process.argv[3]);
}

module.exports = {validateAppleCodegen};
