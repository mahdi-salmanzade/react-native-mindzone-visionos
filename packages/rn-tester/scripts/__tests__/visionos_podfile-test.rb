# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'test/unit'
require 'cocoapods'

class RNTesterVisionOSOptInTests < Test::Unit::TestCase
    # Evaluate the real Podfile with CocoaPods' target/dependency DSL, without
    # installing dependencies, invoking CMake, or configuring React Native.
    class PodfileProbe < Pod::Podfile
        attr_reader :react_native_targets

        def require_relative(_path); end
        def prepare_react_native_project!; end
        def min_ios_version_supported; '15.1'; end
        def min_visionos_version_supported; '1.0'; end

        def `(command)
            raise "Unexpected command: #{command}" unless command == 'command -v cmake'
            '/mock/bin/cmake'
        end

        def use_react_native!(**_options)
            (@react_native_targets ||= []) << current_target_definition.name
        end
    end

    IOS_TARGETS = ['RNTester', 'RNTesterUnitTests', 'RNTesterIntegrationTests'].freeze

    def setup
        @environment = ENV.to_h
        ENV.delete('RCT_ENABLE_VISIONOS')
        ENV.delete('RCT_USE_PREBUILT_RNCORE')
        ENV.delete('USE_FRAMEWORKS')
        @podfile_path = Pathname.new(File.expand_path('../../Podfile', __dir__))
        @podfile = PodfileProbe.new(@podfile_path) {}
    end

    def teardown
        ENV.replace(@environment)
    end

    def evaluate_podfile
        @podfile.instance_eval(File.read(@podfile_path), @podfile_path.to_s)
    end

    def test_default_install_has_only_upstream_ios_targets
        evaluate_podfile
        assert_equal(IOS_TARGETS, @podfile.react_native_targets)
        assert_nil(ENV['RCT_USE_PREBUILT_RNCORE'])
    end

    def test_source_core_alone_has_only_upstream_ios_targets
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        evaluate_podfile
        assert_equal(IOS_TARGETS, @podfile.react_native_targets)
        assert_equal('0', ENV['RCT_USE_PREBUILT_RNCORE'])
    end

    def test_explicit_opt_out_with_source_core_has_only_ios_targets
        ENV['RCT_ENABLE_VISIONOS'] = '0'
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        evaluate_podfile
        assert_equal(IOS_TARGETS, @podfile.react_native_targets)
    end

    def test_explicit_opt_in_adds_visionos_target_with_source_core
        ENV['RCT_ENABLE_VISIONOS'] = '1'
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        evaluate_podfile
        assert_equal(IOS_TARGETS + ['RNTester-visionOS'], @podfile.react_native_targets)
        assert_equal(:visionos, @podfile.target_definitions['RNTester-visionOS'].platform.name)
        IOS_TARGETS.each do |name|
            assert_equal(:ios, @podfile.target_definitions[name].platform.name)
        end
    end

    def test_opt_in_rejects_default_core_before_configuring_any_target
        ENV['RCT_ENABLE_VISIONOS'] = '1'
        error = assert_raise(RuntimeError) { evaluate_podfile }
        assert_include(error.message, 'RCT_USE_PREBUILT_RNCORE=0')
        assert_nil(@podfile.react_native_targets)
        assert_nil(ENV['RCT_USE_PREBUILT_RNCORE'])
    end

    def test_opt_in_rejects_explicit_prebuilt_core_before_configuring_any_target
        ENV['RCT_ENABLE_VISIONOS'] = '1'
        ENV['RCT_USE_PREBUILT_RNCORE'] = '1'
        assert_raise(RuntimeError) { evaluate_podfile }
        assert_nil(@podfile.react_native_targets)
        assert_equal('1', ENV['RCT_USE_PREBUILT_RNCORE'])
    end
end
