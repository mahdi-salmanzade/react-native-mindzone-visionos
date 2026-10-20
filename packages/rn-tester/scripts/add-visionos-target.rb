#!/usr/bin/env ruby
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Reapply the visionOS target after rebasing RNTesterPods.xcodeproj on upstream:
#   bundle exec ruby packages/rn-tester/scripts/add-visionos-target.rb
# Existing targets are left untouched. CocoaPods supplies its own phases,
# configuration files, library linkage and header paths during pod install.

require 'xcodeproj'
require_relative '../../react-native/scripts/cocoapods/helpers'

TARGET_NAME = 'RNTester-visionOS'
PROJECT_PATH = File.expand_path('../RNTesterPods.xcodeproj', __dir__)

COMMON_SETTINGS = {
  'ASSETCATALOG_COMPILER_APPICON_NAME' => 'AppIcon',
  'CODE_SIGN_ENTITLEMENTS' => 'RNTester-visionOS/RNTester-visionOS.entitlements',
  'CODE_SIGN_STYLE' => 'Automatic',
  'CURRENT_PROJECT_VERSION' => '1',
  'DEVELOPMENT_ASSET_PATHS' => '"RNTester-visionOS/Preview Content"',
  'ENABLE_PREVIEWS' => 'YES',
  'ENABLE_USER_SCRIPT_SANDBOXING' => 'NO',
  'GENERATE_INFOPLIST_FILE' => 'YES',
  'INFOPLIST_FILE' => 'RNTester-visionOS/Info.plist',
  'LD_RUNPATH_SEARCH_PATHS' => ['$(inherited)', '@executable_path/Frameworks'],
  'MARKETING_VERSION' => '1.0',
  'PRODUCT_BUNDLE_IDENTIFIER' => 'com.meta.RNTester.localDevelopment.RNTester-visionOS',
  'PRODUCT_NAME' => '$(TARGET_NAME)',
  'SDKROOT' => 'xros',
  'SUPPORTED_PLATFORMS' => 'xros xrsimulator',
  'SUPPORTS_MACCATALYST' => 'NO',
  'SWIFT_VERSION' => '5.0',
  'TARGETED_DEVICE_FAMILY' => '7',
  'XROS_DEPLOYMENT_TARGET' => Helpers::Constants.min_visionos_version_supported,
}.freeze

DEBUG_SETTINGS = {
  'DEBUG_INFORMATION_FORMAT' => 'dwarf',
  'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => '$(inherited) DEBUG',
  'SWIFT_OPTIMIZATION_LEVEL' => '-Onone',
}.freeze

RELEASE_SETTINGS = {
  'DEBUG_INFORMATION_FORMAT' => 'dwarf-with-dsym',
  'SWIFT_COMPILATION_MODE' => 'wholemodule',
}.freeze

BUNDLE_JS_SCRIPT = <<~'SH'
  set -e

  export PROJECT_ROOT="$SRCROOT"
  export ENTRY_FILE="$SRCROOT/js/RNTesterApp.ios.js"
  export SOURCEMAP_FILE="$CONFIGURATION_BUILD_DIR/RNTester-visionOS.map"
  export PODFILE_DIR="$SRCROOT"

  WITH_ENVIRONMENT="$SRCROOT/../react-native/scripts/xcode/with-environment.sh"
  REACT_NATIVE_XCODE="$SRCROOT/../react-native/scripts/react-native-xcode.sh"

  "$WITH_ENVIRONMENT" "$REACT_NATIVE_XCODE"
SH

project = Xcodeproj::Project.open(PROJECT_PATH)
target = project.targets.find { |candidate| candidate.name == TARGET_NAME }
scheme_path = File.join(PROJECT_PATH, 'xcshareddata', 'xcschemes', "#{TARGET_NAME}.xcscheme")

if target.nil?
  group = project.main_group.new_group(TARGET_NAME, TARGET_NAME)
  preview_group = group.new_group('Preview Content', 'Preview Content')

  target = project.new_target(:application, TARGET_NAME, :visionos,
                            Helpers::Constants.min_visionos_version_supported, nil, :swift)

  # Xcodeproj otherwise embeds the SDK version current when the gem was released.
  foundation = target.frameworks_build_phase.files_references.find { |file| file.path.end_with?('/Foundation.framework') }
  foundation.path = 'System/Library/Frameworks/Foundation.framework'
  foundation.source_tree = 'SDKROOT'

  target.build_configurations.each do |config|
    extra = config.name == 'Release' ? RELEASE_SETTINGS : DEBUG_SETTINGS
    config.build_settings = COMMON_SETTINGS.merge(extra)
    # Inherit 0.88's C++ language standard and warning settings from the project.
  end

  %w[App.swift AppDelegate.swift].each do |name|
    target.add_file_references([group.new_reference(name)])
  end

  privacy_manifest = project.files.find { |file| file.real_path.to_s == File.expand_path('../PrivacyInfo.xcprivacy', __dir__) }
  raise 'Missing shared RNTester PrivacyInfo.xcprivacy resource' unless privacy_manifest

  target.add_resources([
    group.new_reference('Assets.xcassets'),
    preview_group.new_reference('Preview Assets.xcassets'),
    privacy_manifest,
  ])
  group.new_reference('Info.plist')
  group.new_reference('RNTester-visionOS.entitlements')

  bundle_js = target.new_shell_script_build_phase('Build JS Bundle')
  bundle_js.shell_path = '/bin/sh'
  bundle_js.shell_script = BUNDLE_JS_SCRIPT
  # .xcode.env.local is optional and must not become a required build input.
  bundle_js.input_paths = ['$(SRCROOT)/.xcode.env']
  bundle_js.always_out_of_date = '1'

  project.save
  puts "Added #{TARGET_NAME} target to #{File.basename(PROJECT_PATH)}."
else
  puts "#{TARGET_NAME} target already exists; leaving it unchanged."
end

unless File.exist?(scheme_path)
  scheme = Xcodeproj::XCScheme.new
  scheme.add_build_target(target)
  scheme.set_launch_target(target)
  scheme.save_as(PROJECT_PATH, TARGET_NAME, true)
  puts "Added #{TARGET_NAME} shared scheme."
end
