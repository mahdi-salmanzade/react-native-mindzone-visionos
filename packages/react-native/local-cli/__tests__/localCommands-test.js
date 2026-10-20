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

const {createCommands} = require('../localCommands');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRouting({apple, ios = null}) {
  const plugin = {
    bundleCommand: {name: 'bundle'},
    startCommand: {name: 'start'},
    codegenCommand: {name: 'codegen'},
    spmCommand: {name: 'spm'},
  };
  const dependencies = {
    '@react-native/community-cli-plugin': plugin,
    '@react-native-community/cli-platform-apple': apple,
    '@react-native-community/cli-platform-ios': ios,
    './local-cli/localCommands': {createCommands},
    './local-cli/coreCommands': require('../coreCommands'),
    './local-cli/resolvePackageName': () => 'react-native',
  };
  const localRequire = spec => {
    if (dependencies[spec] == null) {
      throw new Error(`Missing ${spec}`);
    }
    return dependencies[spec];
  };
  localRequire.resolve = spec => {
    localRequire(spec);
    return spec;
  };
  const context = {
    module: {exports: {}},
    require: localRequire,
    process,
    __dirname: path.resolve(__dirname, '../..'),
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.resolve(__dirname, '../../react-native.config.js'),
      'utf8',
    ),
    context,
  );
  return context.module.exports;
}

test('registers real Apple CLI commands without requiring the iOS package', () => {
  const apple = require('@react-native-community/cli-platform-apple');
  const config = loadRouting({apple});
  expect(config.commands.map(command => command.name)).toEqual([
    'bundle',
    'start',
    'spm',
    'codegen',
    'run-visionos',
    'log-visionos',
    'build-visionos',
  ]);
  expect(config.platforms.visionos.npmPackageName).toBe('react-native');
  expect(typeof config.platforms.visionos.projectConfig).toBe('function');
  for (const command of config.commands.slice(4)) {
    expect(typeof command.func).toBe('function');
    expect(command.options.length).toBeGreaterThan(0);
  }
});

test('missing Apple CLI preserves upstream commands and iOS configuration', () => {
  const ios = {
    commands: [{name: 'run-ios'}],
    projectConfig: jest.fn(),
    dependencyConfig: jest.fn(),
  };
  const config = loadRouting({apple: null, ios});
  expect(config.commands.map(command => command.name)).toEqual([
    'bundle',
    'start',
    'spm',
    'codegen',
    'run-ios',
  ]);
  expect(config.platforms.visionos).toBeUndefined();
  expect(config.platforms.ios.projectConfig).toBe(ios.projectConfig);
});

test.each([
  [
    '/app/react-native/package.json',
    '/app/react-native/package.json',
    'react-native',
  ],
  [
    '/app/upstream/package.json',
    '/app/fork/package.json',
    'react-native-mindzone-visionos',
  ],
  [null, '/app/fork/package.json', 'react-native-mindzone-visionos'],
])(
  'chooses a resolvable Metro identity for alias and direct installs',
  (installed, current, expected) => {
    const localRequire = spec =>
      spec === 'node:fs' ? {realpathSync: value => value} : path;
    localRequire.resolve = () => {
      if (installed == null) {
        throw new Error('Not installed');
      }
      return installed;
    };
    const context = {module: {exports: {}}, require: localRequire, process};
    vm.runInNewContext(
      fs.readFileSync(
        path.resolve(__dirname, '../resolvePackageName.js'),
        'utf8',
      ),
      context,
    );
    expect(context.module.exports(path.dirname(current), '/app')).toBe(
      expected,
    );
  },
);
