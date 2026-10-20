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

function applePlatformDeclaration(
  platform /*: ?string */,
  iosDeploymentTarget /*: string */,
) /*: string */ {
  return platform === 'visionos'
    ? '.visionOS("1.0")'
    : `.iOS("${iosDeploymentTarget}")`;
}

function assertSupportedBinaryPlatform(platform /*: ?string */) /*: void */ {
  if (platform === 'visionos') {
    throw new Error(
      'The React Native 0.88 binary SwiftPM consumer flow does not support visionOS: ' +
        'React.xcframework has no xros slice. Use CocoaPods with ' +
        'RCT_USE_PREBUILT_RNCORE=0 to build React core from source on visionOS. ' +
        'Hermes and ReactNativeDependencies binaries do support xros.',
    );
  }
}

module.exports = {applePlatformDeclaration, assertSupportedBinaryPlatform};
