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

const {
  createCodegenCommand,
  createSpmCommand,
} = require('../../../../react-native/local-cli/coreCommands');
const codegen = require('../codegen').default;
const spm = require('../spm').default;
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let nativeRoot;
let codegenFile;
let spmFile;

beforeEach(() => {
  nativeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apple-cli-routing-'));
  codegenFile = path.join(
    nativeRoot,
    'scripts/codegen/generate-artifacts-executor/index.js',
  );
  spmFile = path.join(nativeRoot, 'scripts/setup-apple-spm.js');
  fs.mkdirSync(path.dirname(codegenFile), {recursive: true});
  fs.writeFileSync(
    codegenFile,
    'module.exports = {execute: (...args) => args};',
  );
  fs.writeFileSync(spmFile, 'module.exports = {main: (...args) => args};');
});

afterEach(() => {
  fs.rmSync(nativeRoot, {recursive: true, force: true});
});

test.each([spm, createSpmCommand(spm)])(
  'SPM forwards explicit visionOS selection to the configured native package',
  async command => {
    const main = jest.spyOn(require(spmFile), 'main');
    await command.func(
      ['scaffold'],
      {root: '/missing-project', reactNativePath: nativeRoot},
      {
        platform: 'visionos',
        productName: 'SpatialApp',
        skipCodegen: true,
      },
    );
    expect(main).toHaveBeenCalledWith([
      'scaffold',
      '--platform',
      'visionos',
      '--product-name',
      'SpatialApp',
      '--skip-codegen',
    ]);
    expect(
      command.options.filter(option => option.name.startsWith('--platform ')),
    ).toHaveLength(1);
  },
);

test.each([codegen, createCodegenCommand(codegen)])(
  'codegen honors the configured native package for coinstalled forks',
  command => {
    const execute = jest.spyOn(require(codegenFile), 'execute');
    command.func(
      [],
      {root: '/missing-project', reactNativePath: nativeRoot},
      {
        path: '/app',
        platform: 'ios',
        outputPath: '/generated',
        source: 'app',
      },
    );
    expect(execute).toHaveBeenCalledWith('/app', 'ios', '/generated', 'app');
  },
);

test('the published-command adapter adds the missing SPM platform option without changing default arguments', async () => {
  const upstream = {
    ...spm,
    options: spm.options.filter(
      option => !option.name.startsWith('--platform '),
    ),
  };
  const command = createSpmCommand(upstream);
  const main = jest.spyOn(require(spmFile), 'main');
  await command.func([], {reactNativePath: nativeRoot}, {});
  expect(main).toHaveBeenCalledWith([]);
  expect(
    command.options.filter(option => option.name.startsWith('--platform ')),
  ).toHaveLength(1);
});
