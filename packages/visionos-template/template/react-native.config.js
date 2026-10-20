// @noflow
const path = require('node:path');

module.exports = {
  reactNativePath: path.dirname(
    require.resolve('react-native-mindzone-visionos/package.json'),
  ),
};
