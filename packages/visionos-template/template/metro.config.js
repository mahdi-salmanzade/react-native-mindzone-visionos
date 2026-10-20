// @noflow
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('node:path');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      // Both dependency names must resolve to one physical runtime, including
      // imports made by third-party packages with their own react-native peer.
      if (/^(react-native|react-native-mindzone-visionos)(\/|$)/.test(moduleName)) {
        moduleName = moduleName.replace(
          /^(react-native-mindzone-visionos|react-native)(?=\/|$)/,
          'react-native-mindzone-visionos',
        );
        context = {
          ...context,
          originModulePath: path.join(__dirname, 'package.json'),
        };
      } else if (/^react(\/|$)/.test(moduleName)) {
        context = {
          ...context,
          originModulePath: path.join(__dirname, 'package.json'),
        };
      }

      // Native Platform.OS remains ios. The native debug URL and release
      // bundler opt in to .visionos sources with this custom resolver option.
      if (
        platform === 'ios' &&
        context.customResolverOptions.platformExtension === 'visionos'
      ) {
        context = {
          ...context,
          sourceExts: [
            ...context.sourceExts.map(ext => `visionos.${ext}`),
            ...context.sourceExts,
          ],
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
});
