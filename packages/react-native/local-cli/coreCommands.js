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

const path = require('node:path');

// Keep the published 0.88 command metadata, but honor the selected native root.
// These adapters ship with the fork; changes to the workspace's separately
// published @react-native/community-cli-plugin do not.
function createCodegenCommand(command /*: $FlowFixMe */) /*: $FlowFixMe */ {
  return {
    ...command,
    func: (_argv, config, args) => {
      const nativeRoot =
        config.reactNativePath ?? path.resolve(__dirname, '..');
      // $FlowFixMe[unsupported-syntax]
      return require(
        path.join(nativeRoot, 'scripts/codegen/generate-artifacts-executor'),
      ).execute(args.path, args.platform, args.outputPath, args.source);
    },
  };
}

function createSpmCommand(command /*: $FlowFixMe */) /*: $FlowFixMe */ {
  const options = command.options ?? [];
  return {
    ...command,
    options: options.some(option => option.name.startsWith('--platform '))
      ? options
      : [
          ...options,
          {
            name: '--platform <string>',
            description: 'Apple platform: ios (default) or visionos.',
          },
        ],
    func: async (argv, config, args) => {
      const passthrough = argv[0] != null ? [argv[0]] : [];
      for (const [key, flag] of [
        ['version', '--version'],
        ['platform', '--platform'],
        ['productName', '--product-name'],
        ['xcodeproj', '--xcodeproj'],
        ['artifacts', '--artifacts'],
        ['download', '--download'],
      ]) {
        if (args[key] != null) {
          passthrough.push(flag, String(args[key]));
        }
      }
      for (const [key, flag] of [
        ['skipCodegen', '--skip-codegen'],
        ['deintegrate', '--deintegrate'],
        ['yes', '--yes'],
      ]) {
        if (args[key] === true) {
          passthrough.push(flag);
        }
      }
      const nativeRoot =
        config.reactNativePath ?? path.resolve(__dirname, '..');
      // $FlowFixMe[unsupported-syntax]
      await require(path.join(nativeRoot, 'scripts/setup-apple-spm')).main(
        passthrough,
      );
    },
  };
}

module.exports = {createCodegenCommand, createSpmCommand};
