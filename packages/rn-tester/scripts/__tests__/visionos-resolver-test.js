/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const resolveRequest = require('../visionos-resolver');
const {resolve} = require('metro-resolver');

function contextFor(files, visionos = true) {
  return {
    assetExts: new Set(),
    customResolverOptions: visionos ? {platformExtension: 'visionos'} : {},
    doesFileExist: file => files.includes(file),
    fileSystemLookup: file =>
      files.includes(file)
        ? {exists: true, type: 'f', realPath: file}
        : {exists: false},
    getPackageForModule: () => null,
    isAssetFile: () => false,
    mainFields: ['react-native', 'main'],
    originModulePath: '/app/index.js',
    preferNativePlatform: true,
    resolveRequest: resolve,
    sourceExts: ['js', 'json', 'ts', 'tsx'],
  };
}

it('prefers visionOS files but retains iOS, native and common fallbacks', () => {
  const files = [
    '/app/Screen.visionos.tsx',
    '/app/Screen.ios.js',
    '/app/Screen.native.js',
    '/app/Screen.js',
  ];
  for (let i = 0; i < files.length; i++) {
    const context = contextFor(files.slice(i));
    expect(resolveRequest(context, './Screen', 'ios').filePath).toBe(files[i]);
    expect(context.sourceExts).toEqual(['js', 'json', 'ts', 'tsx']);
  }
});

it('preserves ordinary iOS and Android resolution', () => {
  const files = [
    '/app/Screen.visionos.js',
    '/app/Screen.ios.js',
    '/app/Screen.android.js',
  ];
  expect(
    resolveRequest(contextFor(files, false), './Screen', 'ios').filePath,
  ).toBe('/app/Screen.ios.js');
  expect(
    resolveRequest(contextFor(files), './Screen', 'android').filePath,
  ).toBe('/app/Screen.android.js');
});
