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

const {execute} = require('../generate-artifacts-executor');
const {REACT_NATIVE} = require('../generate-artifacts-executor/constants');
const {
  findCodegenEnabledLibraries,
} = require('../generate-artifacts-executor/utils');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'visionos-codegen-'));
});
afterEach(() => {
  fs.rmSync(root, {recursive: true, force: true});
});

function write(relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(
    file,
    typeof content === 'string' ? content : JSON.stringify(content),
  );
}

function moduleSpec(name) {
  return `import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
export interface Spec extends TurboModule { ping(): void; }
export default TurboModuleRegistry.getEnforcing<Spec>('${name}');`;
}

it.each(['android', 'all'])(
  'isolates visionOS modules during actual %s generation',
  platform => {
    write('package.json', {
      name: 'fixture',
      codegenConfig: {
        libraries: [
          {name: 'SharedFixture', type: 'modules', jsSrcsDir: 'shared'},
          {
            name: 'FBReactNativeSpec_visionOS',
            type: 'modules',
            jsSrcsDir: 'visionos_modules',
            ios: {},
          },
        ],
      },
    });
    write('shared/NativeSharedFixture.js', moduleSpec('SharedFixture'));
    write(
      'visionos_modules/NativeVisionFixture.js',
      moduleSpec('VisionFixture'),
    );
    const output = path.join(root, 'out');
    execute(root, platform, output, 'library', true, true);
    const androidFiles = fs.readdirSync(path.join(output, 'android'), {
      recursive: true,
    });
    expect(
      androidFiles.some(file =>
        String(file).endsWith('NativeSharedFixtureSpec.java'),
      ),
    ).toBe(true);
    expect(
      androidFiles.some(file => String(file).includes('VisionFixture')),
    ).toBe(false);
    if (platform === 'all') {
      const iosFiles = fs.readdirSync(
        path.join(output, 'build/generated/ios'),
        {recursive: true},
      );
      expect(
        iosFiles.some(file =>
          String(file).endsWith('FBReactNativeSpec_visionOS.h'),
        ),
      ).toBe(true);
    }
  },
);

function packageConfig(name, specs) {
  return {
    name,
    codegenConfig: {
      libraries: specs.map(spec => ({
        name: spec,
        type: 'modules',
        jsSrcsDir: '.',
      })),
    },
  };
}

it.each(['autolinking', 'fallback'])(
  'keeps the fork and unrelated libraries during %s discovery',
  discovery => {
    write(
      'upstream/package.json',
      packageConfig('react-native', ['FBReactNativeSpec']),
    );
    write(
      'fork/package.json',
      packageConfig(REACT_NATIVE, [
        'FBReactNativeSpec',
        'FBReactNativeSpec_visionOS',
      ]),
    );
    write(
      'unrelated/package.json',
      packageConfig('unrelated', ['OtherModules']),
    );
    const config = {
      dependencies: {
        'react-native': {root: path.join(root, 'upstream')},
        [REACT_NATIVE]: {root: path.join(root, 'fork')},
        unrelated: {root: path.join(root, 'unrelated')},
      },
    };
    let pkg = {name: 'app'};
    if (discovery === 'autolinking') {
      write('build/generated/autolinking/autolinking.json', config);
    } else {
      // Local paths exercise fallback discovery without mutating node_modules.
      pkg.dependencies = {
        'fixture-upstream': './upstream',
        'fixture-fork': './fork',
        'fixture-unrelated': './unrelated',
      };
    }
    const libraries = findCodegenEnabledLibraries(
      pkg,
      root,
      root,
      discovery === 'autolinking' ? config : {},
    );
    expect(libraries.map(lib => lib.config.name)).toEqual([
      'FBReactNativeSpec',
      'FBReactNativeSpec_visionOS',
      'OtherModules',
    ]);
  },
);

it('retains both libraries when this fork is installed with the react-native alias', () => {
  write(
    'fork/package.json',
    packageConfig(REACT_NATIVE, [
      'FBReactNativeSpec',
      'FBReactNativeSpec_visionOS',
    ]),
  );
  const config = {
    dependencies: {'react-native': {root: path.join(root, 'fork')}},
  };
  write('build/generated/autolinking/autolinking.json', config);
  const libraries = findCodegenEnabledLibraries(
    {name: 'app'},
    root,
    root,
    config,
  );
  expect(libraries.map(lib => lib.config.name)).toEqual([
    'FBReactNativeSpec',
    'FBReactNativeSpec_visionOS',
  ]);
});

it('deduplicates the same core directory reached through both dependency names', () => {
  write(
    'fork/package.json',
    packageConfig(REACT_NATIVE, [
      'FBReactNativeSpec',
      'FBReactNativeSpec_visionOS',
    ]),
  );
  const config = {
    dependencies: {
      'react-native': {root: path.join(root, 'fork')},
      [REACT_NATIVE]: {root: path.join(root, 'fork')},
    },
  };
  write('build/generated/autolinking/autolinking.json', config);
  const libraries = findCodegenEnabledLibraries(
    {name: 'app'},
    root,
    root,
    config,
  );
  expect(libraries.map(lib => lib.config.name)).toEqual([
    'FBReactNativeSpec',
    'FBReactNativeSpec_visionOS',
  ]);
});
