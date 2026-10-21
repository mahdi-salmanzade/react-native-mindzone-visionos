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

const forEachPackage = require('./monorepo/for-each-package');
const newGithubReleaseUrl = require('./new-github-release-url');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseArgs} = require('node:util');
const semver = require('semver');

const PACKAGE_NAMES = [
  'react-native-mindzone-visionos',
  'react-native-mindzone-visionos-template',
];

function planRelease({
  root = path.resolve(__dirname, '..'),
  version,
  upstreamVersion,
  tag,
}) {
  if (!semver.valid(version) || semver.clean(version) !== version) {
    throw new Error('new-version must be an exact semantic version');
  }
  const packages = [];
  const workspaceManifests = [];
  forEachPackage(
    (absolutePath, relativePath, manifest) => {
      workspaceManifests.push(manifest);
      if (PACKAGE_NAMES.includes(manifest.name)) {
        if (
          manifest.private ||
          packages.some(pkg => pkg.name === manifest.name)
        ) {
          throw new Error(
            `Cannot release private or duplicate package ${manifest.name}`,
          );
        }
        packages.push({
          name: manifest.name,
          absolutePath,
          relativePath,
          manifest,
        });
      }
    },
    {root, includeReactNative: true},
  );
  const missing = PACKAGE_NAMES.filter(
    name => !packages.some(pkg => pkg.name === name),
  );
  if (missing.length) {
    throw new Error(`Missing release packages: ${missing.join(', ')}`);
  }
  const core = packages.find(pkg => pkg.name === PACKAGE_NAMES[0]);
  const base =
    core.manifest.reactNativeUpstreamVersion ?? core.manifest.version;
  if (upstreamVersion != null && upstreamVersion !== base) {
    throw new Error(
      `This checkout is based on ${base}; changing the upstream base requires a port, not a release flag`,
    );
  }
  const prerelease = semver.prerelease(version);
  const npmTag =
    tag ??
    (prerelease
      ? /^nightly(?:-|$)/.test(String(prerelease[0]))
        ? 'nightly'
        : 'next'
      : 'latest');
  if (
    !/^[a-z][a-z0-9._-]*$/.test(npmTag) ||
    (prerelease && npmTag === 'latest')
  ) {
    throw new Error('Use a valid npm tag; prereleases cannot use latest');
  }
  const upstreamPackages = workspaceManifests
    .filter(
      manifest =>
        manifest.name.startsWith('@react-native/') && manifest.version === base,
    )
    .map(manifest => manifest.name);
  return {
    version,
    upstreamVersion: base,
    upstreamPackages,
    tag: npmTag,
    packages,
  };
}

function applyPackageVersions(manifest, plan, isCore = false) {
  const result = JSON.parse(JSON.stringify(manifest));
  for (const key of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const [name, value] of Object.entries(result[key] ?? {})) {
      if (PACKAGE_NAMES.includes(name)) {
        result[key][name] = plan.version;
      } else if (
        typeof value === 'string' &&
        value.startsWith(`npm:${PACKAGE_NAMES[0]}@`)
      ) {
        result[key][name] = `npm:${PACKAGE_NAMES[0]}@${plan.version}`;
      } else if (
        plan.upstreamPackages.includes(name) ||
        name === 'react-native'
      ) {
        result[key][name] = plan.upstreamVersion;
      }
    }
  }
  if (PACKAGE_NAMES.includes(result.name)) {
    result.version = plan.version;
  }
  if (isCore) {
    result.reactNativeUpstreamVersion = plan.upstreamVersion;
  }
  return result;
}

function validateContents(name, files) {
  const required =
    name === PACKAGE_NAMES[0]
      ? [
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
          'scripts/spm/visionos/ReactVisionOS.swift',
        ]
      : [
          'LICENSE',
          'README.md',
          'template.config.js',
          'template/LICENSE',
          'template/package.json',
          'template/visionos/Podfile',
        ];
  const missing = required.filter(file => !files.includes(file));
  if (missing.length) {
    throw new Error(`${name} is missing packaged files: ${missing.join(', ')}`);
  }
  if (
    name === PACKAGE_NAMES[1] &&
    !files.some(file =>
      /^template\/visionos\/.*\.xcodeproj\/project\.pbxproj$/.test(file),
    )
  ) {
    throw new Error('The template must include a visionOS Xcode project');
  }
}

function readPackResult(output) {
  const parsed = JSON.parse(output);
  // npm 12 returns a name-keyed object; earlier releases return an array.
  const results = Array.isArray(parsed) ? parsed : Object.values(parsed);
  if (results.length !== 1 || !Array.isArray(results[0].files)) {
    throw new Error('Expected exactly one npm pack result');
  }
  return results[0];
}

function releaseOOT(options, run = execFileSync) {
  if (options.publish && options.dryRun) {
    throw new Error('--publish and --dry-run cannot be combined');
  }
  const plan = planRelease(options);
  const releaseUrl = options.releaseRepository
    ? newGithubReleaseUrl({
        repoUrl: options.releaseRepository,
        tag: `v${plan.version}-visionos`,
        title: `Release ${plan.version}`,
        isPrerelease: semver.prerelease(plan.version) != null,
      })
    : undefined;
  if (options.dryRun) {
    return {...plan, dryRun: true, tarballs: [], releaseUrl};
  }

  const output = path.resolve(
    options.output ??
      path.join(os.tmpdir(), `mindzone-visionos-${plan.version}`),
  );
  fs.mkdirSync(output, {recursive: true});
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mindzone-release-'));
  const tarballs = [];
  try {
    for (const pkg of plan.packages) {
      if (pkg.name === PACKAGE_NAMES[0]) {
        // Generate both core specs and copy the authoritative README before packing.
        run(process.execPath, ['./scripts/prepack.js'], {
          cwd: pkg.absolutePath,
          stdio: 'inherit',
        });
      }
      const npmOptions = {cwd: pkg.absolutePath, encoding: 'utf8'};
      const npmFlags = [
        '--json',
        '--ignore-scripts',
        '--offline',
        '--cache',
        path.join(temporary, 'npm-cache'),
      ];
      const listing = readPackResult(
        run('npm', ['pack', '--dry-run', ...npmFlags], npmOptions),
      );
      const files = listing.files.map(file => file.path);
      validateContents(pkg.name, files);
      const staging = path.join(temporary, pkg.name);
      for (const file of files) {
        const destination = path.join(staging, file);
        if (path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) {
          throw new Error(`Unsafe package path: ${file}`);
        }
        fs.mkdirSync(path.dirname(destination), {recursive: true});
        fs.copyFileSync(path.join(pkg.absolutePath, file), destination);
        fs.chmodSync(
          destination,
          fs.statSync(path.join(pkg.absolutePath, file)).mode,
        );
        if (path.basename(file) === 'package.json') {
          const manifest = applyPackageVersions(
            JSON.parse(fs.readFileSync(destination, 'utf8')),
            plan,
            file === 'package.json' && pkg.name === PACKAGE_NAMES[0],
          );
          fs.writeFileSync(
            destination,
            JSON.stringify(manifest, null, 2) + '\n',
          );
        }
      }
      const packed = readPackResult(
        run('npm', ['pack', '--pack-destination', output, ...npmFlags], {
          ...npmOptions,
          cwd: staging,
        }),
      );
      if (packed.name !== pkg.name || packed.version !== plan.version) {
        throw new Error(`Unexpected tarball identity for ${pkg.name}`);
      }
      validateContents(
        pkg.name,
        packed.files.map(file => file.path),
      );
      tarballs.push(path.join(output, packed.filename));
    }
    // No package is published until every allowlisted tarball has been prepared.
    if (options.publish === true) {
      for (const tarball of tarballs) {
        const args = [
          'publish',
          tarball,
          '--ignore-scripts',
          '--access',
          'public',
          '--tag',
          plan.tag,
        ];
        if (options.otp) {
          args.push('--otp', options.otp);
        }
        run('npm', args, {stdio: 'inherit'});
      }
    }
    return {...plan, tarballs, published: options.publish === true, releaseUrl};
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

function main() {
  const {values} = parseArgs({
    options: {
      'new-version': {type: 'string', short: 'v'},
      'react-native-version': {type: 'string', short: 'r'},
      tag: {type: 'string', short: 't'},
      'one-time-password': {type: 'string', short: 'o'},
      output: {type: 'string'},
      'release-repository': {type: 'string'},
      'dry-run': {type: 'boolean', default: false},
      publish: {type: 'boolean', default: false},
      help: {type: 'boolean'},
    },
  });
  if (values.help) {
    console.log(
      'Usage: node scripts/oot-release.js --new-version <version> [--dry-run] [--output <directory>] [--publish]\n\nThe default prepares both tarballs locally. --dry-run only prints a plan.\nOnly --publish uploads; OTP alone never publishes. No git operations are performed.\nOptional: --react-native-version <base>, --tag <tag>, --one-time-password <otp>,\n--release-repository <confirmed https://github.com/owner/repo> (prints a draft link).',
    );
    return;
  }
  const result = releaseOOT({
    version: values['new-version'],
    upstreamVersion: values['react-native-version'],
    tag: values.tag,
    otp: values['one-time-password'],
    output: values.output,
    releaseRepository: values['release-repository'],
    dryRun: values['dry-run'],
    publish: values.publish,
  });
  console.log(
    JSON.stringify(
      {
        version: result.version,
        upstreamVersion: result.upstreamVersion,
        tag: result.tag,
        packages: result.packages.map(pkg => pkg.name),
        tarballs: result.tarballs,
        dryRun: result.dryRun ?? false,
        published: result.published ?? false,
        releaseUrl: result.releaseUrl,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  releaseOOT,
  planRelease,
  applyPackageVersions,
  validateContents,
};
