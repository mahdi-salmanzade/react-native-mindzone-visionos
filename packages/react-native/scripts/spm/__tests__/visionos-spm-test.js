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

const {main, parseArgs} = require('../../setup-apple-spm');
const {
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
} = require('../generate-spm-autolinking');
const {
  generateAutolinkingConfig,
} = require('../generate-spm-autolinking-config');
const {generateXCFrameworksPackageSwift} = require('../generate-spm-package');
const {emitScaffoldedPackageSwift} = require('../scaffold-package-swift');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

it('rejects the visionOS binary setup before downloading or changing project files', async () => {
  expect(parseArgs(['add', '--platform', 'visionos']).platform).toBe(
    'visionos',
  );
  await expect(main(['add', '--platform', 'visionos'])).rejects.toThrow(
    'React.xcframework has no xros slice',
  );
  expect(() => generateXCFrameworksPackageSwift('visionos')).toThrow(
    'React.xcframework has no xros slice',
  );
});

it('selects visionOS deployment declarations explicitly, preserving iOS defaults', () => {
  expect(
    generateAutolinkedPackageSwift({hasReactDep: false, platform: 'visionos'}),
  ).toContain('platforms: [.visionOS("1.0")]');
  expect(generateAutolinkedPackageSwift({hasReactDep: false})).toContain(
    'platforms: [.iOS("15.1")]',
  );
  expect(
    generateSynthPackageSwift({
      swiftName: 'Example',
      hasReactDep: false,
      platform: 'visionos',
    }),
  ).toContain('platforms: [.visionOS("1.0")]');
  const scaffold = emitScaffoldedPackageSwift(
    {
      swiftName: 'Example',
      sources: [],
      headerSearchPaths: [],
      coreReactNative: false,
      siblingNames: [],
      extraFrameworks: [],
      weakFrameworks: ['ARKit'],
      compilerFlags: [],
      publicHeadersPath: null,
      resources: [],
      warnings: [],
    },
    {platform: 'visionos'},
  );
  expect(scaffold).toContain('platforms: [.visionOS("1.0")]');
  expect(scaffold).toContain(
    '.linkedFramework("ARKit", .when(platforms: [.visionOS]))',
  );
});

it('writes explicitly selected visionOS CLI config under the visionOS project directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visionos-spm-'));
  try {
    const config = {
      project: {
        ios: {sourceDir: path.join(root, 'ios')},
        visionos: {sourceDir: path.join(root, 'visionos')},
      },
    };
    const result = generateAutolinkingConfig({
      projectRoot: root,
      platform: 'visionos',
      configCommand: ['fixture'],
      cliRunner: () => ({
        stdout: JSON.stringify(config),
        stderr: '',
        exitCode: 0,
      }),
    });
    expect(result.outputPath).toBe(
      path.join(root, 'visionos/build/generated/autolinking/autolinking.json'),
    );
    expect(fs.existsSync(path.join(root, 'ios'))).toBe(false);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
