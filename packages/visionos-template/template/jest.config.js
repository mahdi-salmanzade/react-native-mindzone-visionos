// @noflow
const path = require('node:path');

const reactNativePath = path.dirname(
  require.resolve('react-native-mindzone-visionos/package.json'),
);

module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^(react-native|react-native-mindzone-visionos)/(setup-env|react-private-interface|asset-registry|unstable-internals-do-not-use)$':
      `${reactNativePath}/src/$2.js`,
    '^(react-native|react-native-mindzone-visionos)($|/.*)': `${reactNativePath}/$2`,
    '^react($|/.*)': `${path.dirname(require.resolve('react/package.json'))}/$1`,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-mindzone-visionos|@react-native(-community)?)/)',
  ],
};
