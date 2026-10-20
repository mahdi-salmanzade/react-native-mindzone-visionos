/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const {existsSync, readdirSync, readFileSync} = require('node:fs');
const path = require('node:path');

function forEachPackage(
  callback,
  {includeReactNative = false, root = path.resolve(__dirname, '../..')} = {},
) {
  const packagesRoot = path.join(root, 'packages');
  for (const entry of readdirSync(packagesRoot, {withFileTypes: true})) {
    if (
      !entry.isDirectory() ||
      (!includeReactNative && entry.name === 'react-native')
    ) {
      continue;
    }
    const relativePath = path.join('packages', entry.name);
    const absolutePath = path.join(root, relativePath);
    const manifestPath = path.join(absolutePath, 'package.json');
    if (existsSync(manifestPath)) {
      callback(
        absolutePath,
        relativePath,
        JSON.parse(readFileSync(manifestPath, 'utf8')),
      );
    }
  }
}

module.exports = forEachPackage;
