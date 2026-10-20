#!/usr/bin/env node
// @noflow

'use strict';

console.log(`
Run your visionOS app from the project root:

  bundle install
  cd visionos
  RCT_USE_PREBUILT_RNCORE=0 bundle exec pod install
  cd ..
  npm start

Then, in another terminal:

  npm run visionos -- --simulator "Apple Vision Pro"

See README.md for Xcode setup, runtime resolution, iOS and Android commands.
`);
