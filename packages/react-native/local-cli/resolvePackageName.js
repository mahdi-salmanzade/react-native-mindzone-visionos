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

const {realpathSync} = require('node:fs');
const path = require('node:path');

// Metro needs the installed name, which can differ from package.json for npm aliases.
function resolvePackageName(
  packageRoot /*: string */,
  projectRoot /*: string */ = process.cwd(),
) /*: string */ {
  try {
    const installedManifest = require.resolve('react-native/package.json', {
      paths: [projectRoot],
    });
    if (
      realpathSync(installedManifest) ===
      realpathSync(path.join(packageRoot, 'package.json'))
    ) {
      return 'react-native';
    }
  } catch {
    // A direct installation can supply reactNativePath in its project config.
  }
  return 'react-native-mindzone-visionos';
}

module.exports = resolvePackageName;
