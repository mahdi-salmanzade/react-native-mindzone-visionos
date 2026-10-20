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

// Construct a review link only; this helper never creates a release or tag.
function newGithubReleaseUrl({repoUrl, tag, title, isPrerelease = false}) {
  const repository = new URL(repoUrl);
  if (
    repository.origin !== 'https://github.com' ||
    !/^\/[^/]+\/[^/]+\/?$/.test(repository.pathname)
  ) {
    throw new Error(
      'release-repository must be an https://github.com/owner/repo URL',
    );
  }
  const url = new URL(
    `${repository.pathname.replace(/\/$/, '')}/releases/new`,
    repository.origin,
  );
  url.searchParams.set('tag', tag);
  url.searchParams.set('title', title);
  url.searchParams.set('prerelease', String(isPrerelease));
  return url.toString();
}

module.exports = newGithubReleaseUrl;
