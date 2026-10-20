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
  applyPackageVersions,
  planRelease,
  releaseOOT,
} = require('../oot-release');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const coreName = 'react-native-mindzone-visionos';
const templateName = `${coreName}-template`;
let root;

function write(file, contents = '') {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, contents);
}

function fixture() {
  write(
    'packages/core/package.json',
    JSON.stringify({
      name: coreName,
      version: '0.88.0',
      reactNativeUpstreamVersion: '0.88.0',
      bin: {'react-native': 'cli.js'},
      dependencies: {
        '@react-native/codegen': '0.88.0',
        'hermes-compiler': '260318099.0.4',
      },
    }),
  );
  write('packages/core/scripts/prepack.js', '');
  for (const file of [
    'LICENSE',
    'README.md',
    'index.js',
    'cli.js',
    'react-native.config.js',
    'local-cli/localCommands.js',
    'local-cli/coreCommands.js',
    'local-cli/resolvePackageName.js',
    'visionos_modules/NativeXRModule.js',
    'visionos_modules/NativeWindowManager.js',
    'Libraries/XR/XR.js',
    'Libraries/WindowManager/WindowManager.js',
    'Libraries/SwiftExtensions/RCTRootViewRepresentable.swift',
    'React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS.h',
    'React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS-generated.mm',
    'React/FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOSJSI.h',
    'types_DEPRECATED/index.d.ts',
    'types_generated/index.d.ts',
    'Package.swift',
    'scripts/ios-prebuild.js',
    'scripts/ios-prebuild/cli.js',
    'scripts/spm/visionos/ReactVisionOS.swift',
  ]) {
    write(`packages/core/${file}`);
  }
  fs.chmodSync(path.join(root, 'packages/core/cli.js'), 0o755);
  write(
    'packages/template/package.json',
    JSON.stringify({name: templateName, version: '0.88.0'}),
  );
  write(
    'packages/template/template/package.json',
    JSON.stringify({
      name: 'HelloWorld',
      version: '0.0.1',
      dependencies: {
        'react-native': `npm:${coreName}@0.88.0`,
        [coreName]: '0.88.0',
        '@react-native/metro-config': '0.88.0',
        react: '19.3.0',
        '@react-native/independently-versioned': '^2.0.0',
      },
    }),
  );
  for (const file of [
    'LICENSE',
    'README.md',
    'template.config.js',
    'template/visionos/Podfile',
    'template/visionos/HelloWorld.xcodeproj/project.pbxproj',
  ]) {
    write(`packages/template/${file}`);
  }
  write(
    'packages/unrelated/package.json',
    JSON.stringify({name: '@react-native/unrelated', version: '0.88.0'}),
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'oot-release-test-'));
  fixture();
});

afterEach(() => {
  fs.rmSync(root, {recursive: true, force: true});
});

test('requires the complete allowlist and preserves the upstream base', () => {
  const plan = planRelease({root, version: '0.88.1'});
  expect(plan.packages.map(pkg => pkg.name).sort()).toEqual(
    [coreName, templateName].sort(),
  );
  expect(plan.upstreamVersion).toBe('0.88.0');
  expect(() =>
    planRelease({root, version: '0.88.1', upstreamVersion: '0.89.0'}),
  ).toThrow('requires a port');
  fs.rmSync(path.join(root, 'packages/template'), {recursive: true});
  expect(() => planRelease({root, version: '0.88.1'})).toThrow(
    'Missing release packages',
  );
});

test('dry runs execute no hooks, packing, publishing or filesystem mutations', () => {
  const run = jest.fn();
  const result = releaseOOT(
    {root, version: '0.88.1', dryRun: true, otp: 'not-an-approval'},
    run,
  );
  expect(result.tarballs).toEqual([]);
  expect(run).not.toHaveBeenCalled();
  expect(() =>
    releaseOOT({root, version: '0.88.1', dryRun: true, publish: true}, run),
  ).toThrow('cannot be combined');
});

test('stable and nightly versions update aliases and fork dependencies without changing upstream tool versions', () => {
  const original = JSON.parse(
    fs.readFileSync(
      path.join(root, 'packages/template/template/package.json'),
      'utf8',
    ),
  );
  const version = '0.88.1-nightly-20261021';
  const plan = planRelease({root, version});
  expect(plan.tag).toBe('nightly');
  const result = applyPackageVersions(original, plan);
  expect(result.version).toBe('0.0.1');
  expect(result.dependencies['react-native']).toBe(
    `npm:${coreName}@${version}`,
  );
  expect(result.dependencies[coreName]).toBe(version);
  expect(result.dependencies['@react-native/metro-config']).toBe('0.88.0');
  expect(result.dependencies['@react-native/independently-versioned']).toBe(
    '^2.0.0',
  );
  expect(original.dependencies[coreName]).toBe('0.88.0');
  expect(() => planRelease({root, version, tag: 'latest'})).toThrow(
    'prereleases cannot use latest',
  );
});

test('prepares both real offline tarballs, rewrites nested manifests, preserves executable mode and never publishes from OTP alone', () => {
  const run = jest.fn(execFileSync);
  const result = releaseOOT(
    {
      root,
      version: '0.88.1',
      output: path.join(root, 'output'),
      otp: 'not-an-approval',
    },
    run,
  );
  expect(result.tarballs).toHaveLength(2);
  expect(result.published).toBe(false);
  expect(
    run.mock.calls.some(
      ([command, args]) => command === 'npm' && args[0] === 'publish',
    ),
  ).toBe(false);
  const coreTarball = result.tarballs.find(file =>
    file.endsWith(`${coreName}-0.88.1.tgz`),
  );
  const core = JSON.parse(
    execFileSync('tar', ['-xOf', coreTarball, 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
  expect(core.version).toBe('0.88.1');
  expect(core.dependencies['hermes-compiler']).toBe('260318099.0.4');
  expect(
    execFileSync('tar', ['-tvf', coreTarball, 'package/cli.js'], {
      encoding: 'utf8',
    }),
  ).toMatch(/rwxr-xr-x/);
  const templateTarball = result.tarballs.find(file =>
    file.includes(`${templateName}-`),
  );
  const app = JSON.parse(
    execFileSync(
      'tar',
      ['-xOf', templateTarball, 'package/template/package.json'],
      {encoding: 'utf8'},
    ),
  );
  expect(app.dependencies['react-native']).toBe(`npm:${coreName}@0.88.1`);
  const workspace = JSON.parse(
    fs.readFileSync(path.join(root, 'packages/core/package.json'), 'utf8'),
  );
  expect(workspace.version).toBe('0.88.0');
}, 30000);

test('a missing required template file stops all publishing even after core was packed', () => {
  fs.rmSync(path.join(root, 'packages/template/template/visionos/Podfile'));
  const run = jest.fn(execFileSync);
  expect(() =>
    releaseOOT(
      {
        root,
        version: '0.88.1',
        output: path.join(root, 'output'),
        publish: true,
      },
      run,
    ),
  ).toThrow('missing packaged files');
  expect(
    run.mock.calls.some(
      ([command, args]) => command === 'npm' && args[0] === 'publish',
    ),
  ).toBe(false);
}, 30000);

test('any publish failure propagates and no git operation is attempted', () => {
  let publications = 0;
  const run = jest.fn((command, args, options) => {
    if (command === 'git') {
      throw new Error('No git commands allowed');
    }
    if (command === 'npm' && args[0] === 'publish') {
      publications++;
      if (publications === 2) {
        throw new Error('simulated second upload failure');
      }
      return '';
    }
    return execFileSync(command, args, options);
  });
  expect(() =>
    releaseOOT(
      {
        root,
        version: '0.88.1',
        output: path.join(root, 'output'),
        publish: true,
      },
      run,
    ),
  ).toThrow('simulated second upload failure');
  expect(publications).toBe(2);
  expect(run.mock.calls.some(([command]) => command === 'git')).toBe(false);
}, 30000);
