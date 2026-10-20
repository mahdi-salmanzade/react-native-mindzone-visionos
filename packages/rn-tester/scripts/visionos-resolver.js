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

module.exports = (context, moduleName, platform) => {
  if (
    platform === 'ios' &&
    context.customResolverOptions.platformExtension === 'visionos'
  ) {
    // Keep iOS package conditions and fallback files while preferring visionOS.
    return context.resolveRequest(
      {
        ...context,
        sourceExts: [
          ...context.sourceExts.map(extension => `visionos.${extension}`),
          ...context.sourceExts,
        ],
      },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};
