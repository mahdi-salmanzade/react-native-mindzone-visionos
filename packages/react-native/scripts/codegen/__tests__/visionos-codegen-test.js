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
const {validateAppleCodegen} = require('../validate-apple-codegen');
const {spawnSync} = require('node:child_process');
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

it.each([undefined, 'visionos'])(
  'generates the visionOS core spec for app dependency platform %s only when selected',
  dependencyPlatform => {
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
    execute(root, 'ios', output, 'app', true, true, dependencyPlatform);
    const files = fs.readdirSync(
      path.join(output, 'build/generated/ios/ReactCodegen'),
      {recursive: true},
    );
    expect(files.includes('SharedFixture/SharedFixture.h')).toBe(true);
    expect(
      files.includes('FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS.h'),
    ).toBe(dependencyPlatform === 'visionos');
  },
);

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

it.each([undefined, 'visionos'])(
  'uses %s dependency exclusions with the iOS CLI backend',
  dependencyPlatform => {
    write('package.json', {name: 'app'});
    for (const name of ['IOSOnly', 'VisionOnly']) {
      write(`${name}/package.json`, packageConfig(name, [name]));
      write(`${name}/Native${name}.js`, moduleSpec(name));
    }
    const output = path.join(root, 'out');
    write('out/build/generated/autolinking/autolinking.json', {
      dependencies: {
        IOSOnly: {
          root: path.join(root, 'IOSOnly'),
          platforms: {ios: {}, visionos: null},
        },
        VisionOnly: {
          root: path.join(root, 'VisionOnly'),
          platforms: {ios: null, visionos: {}},
        },
      },
    });
    const result = spawnSync(
      process.execPath,
      [
        path.join(__dirname, '../../generate-codegen-artifacts.js'),
        '-p',
        root,
        '-o',
        output,
        '-t',
        'ios',
        '-s',
        'library',
        ...(dependencyPlatform == null
          ? []
          : ['--dependencyPlatform', dependencyPlatform]),
      ],
      {encoding: 'utf8'},
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const files = fs.readdirSync(
      path.join(output, 'build/generated/ios/ReactCodegen'),
      {recursive: true},
    );
    expect(files.includes('VisionOnly/VisionOnly.h')).toBe(
      dependencyPlatform === 'visionos',
    );
    expect(files.includes('IOSOnly/IOSOnly.h')).toBe(
      dependencyPlatform == null,
    );
  },
);

it.each(['iphonesimulator', 'xrsimulator', 'xros'])(
  'preserves dependency filtering during the %s Xcode script phase',
  platformName => {
    write('package.json', {name: 'app'});
    const dependencies = {};
    for (const name of ['IOSOnly', 'VisionOnly']) {
      write(`${name}/package.json`, {
        name,
        codegenConfig: {
          name,
          type: 'modules',
          jsSrcsDir: '.',
          ios: {modulesProvider: {[name]: name}},
        },
      });
      write(`${name}/Native${name}.js`, moduleSpec(name));
      dependencies[name] = {
        root: path.join(root, name),
        platforms: {
          ios: name === 'IOSOnly' ? {} : null,
          visionos: name === 'VisionOnly' ? {} : null,
        },
      };
    }
    write('out/build/generated/autolinking/autolinking.json', {dependencies});
    const result = spawnSync(
      '/bin/bash',
      [path.join(__dirname, '../../react_native_pods_utils/script_phases.sh')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_BINARY: process.execPath,
          RCT_SCRIPT_TYPE: 'withCodegenDiscovery',
          RCT_SCRIPT_RN_DIR: path.join(__dirname, '../../..'),
          RCT_SCRIPT_APP_PATH: root,
          RCT_SCRIPT_OUTPUT_DIR: path.join(root, 'out'),
          DERIVED_FILE_DIR: path.join(root, 'derived'),
          SCRIPT_OUTPUT_FILE_0: path.join(root, 'codegen.log'),
          PLATFORM_NAME: platformName,
        },
      },
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const providers = fs.readFileSync(
      path.join(
        root,
        'out/build/generated/ios/ReactCodegen/RCTModuleProviders.mm',
      ),
      'utf8',
    );
    const expected =
      platformName === 'iphonesimulator' ? 'IOSOnly' : 'VisionOnly';
    const excluded =
      platformName === 'iphonesimulator' ? 'VisionOnly' : 'IOSOnly';
    expect(providers).toContain(`@"${expected}"`);
    expect(providers).not.toContain(`@"${excluded}"`);
  },
);

it.each([false, true])(
  'validates shared mixed-target codegen (different exclusions: %s)',
  differentExclusions => {
    write('package.json', {name: 'app'});
    write('dependency/package.json', {
      name: 'dependency',
      codegenConfig: {name: 'Fixture', type: 'modules', jsSrcsDir: '.'},
    });
    write('build/generated/autolinking/autolinking.json', {
      dependencies: {
        dependency: {
          root: path.join(root, 'dependency'),
          platforms: {
            ios: {},
            visionos: differentExclusions ? null : {},
          },
        },
      },
    });
    if (differentExclusions) {
      expect(() => validateAppleCodegen(root, root)).toThrow(
        'Use separate Podfiles/installations for iOS and visionOS',
      );
    } else {
      expect(() => validateAppleCodegen(root, root)).not.toThrow();
    }
  },
);

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
