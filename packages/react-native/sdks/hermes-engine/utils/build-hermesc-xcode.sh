#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x -e

hermesc_dir_path="$1"; shift
jsi_path="$1"

# Check the target SDK before replacing SDKROOT with the macOS host SDK.
case "$PLATFORM_NAME" in
  xros|xrsimulator)
    cmake_version=$("$CMAKE_BINARY" --version)
    if [[ ! "$cmake_version" =~ cmake\ version\ ([0-9]+)\.([0-9]+)\.([0-9]+) ]] ||
       (( 10#${BASH_REMATCH[1]:-0} < 3 || (10#${BASH_REMATCH[1]:-0} == 3 && 10#${BASH_REMATCH[2]:-0} < 28) )); then
      echo "error: Building Hermes for visionOS requires CMake 3.28.0 or newer." >&2
      exit 1
    fi
    ;;
esac

# This script is supposed to be executed from Xcode "run script" phase.
# Xcode sets up its build environment based on the build target (iphone, iphonesimulator, macosx).
# We want to make sure that hermesc is built for mac.
# So we clean the environment with env -i, and explicitly set SDKROOT to macosx
SDKROOT=$(xcode-select -p)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk

env -i \
  PATH="$PATH" \
  SDKROOT="$SDKROOT" \
  "$CMAKE_BINARY" -S "${PODS_ROOT}/hermes-engine" -B "$hermesc_dir_path" -DJSI_DIR="$jsi_path" -DCMAKE_BUILD_TYPE=Release

env -i \
  PATH="$PATH" \
  SDKROOT="$SDKROOT" \
  "$CMAKE_BINARY" --build "$hermesc_dir_path" --target hermesc -j "$(sysctl -n hw.ncpu)"
