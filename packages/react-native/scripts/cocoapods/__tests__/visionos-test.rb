# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'test/unit'
require 'tmpdir'
require_relative '../helpers'
require_relative '../new_architecture'
require_relative '../rncore'
require_relative '../rndeps_facades'

class VisionOSBuildTests < Test::Unit::TestCase
    Platform = Struct.new(:name)
    Configuration = Struct.new(:build_settings)
    NativeTarget = Struct.new(:build_configurations)

    def setup
        @environment = ENV.to_h
        @build_from_source = ReactNativeCoreUtils.class_variable_get(:@@build_from_source)
        ReactNativeCoreUtils.class_variable_set(:@@build_from_source, true)
        ENV.delete('RCT_USE_PREBUILT_RNCORE')
        ENV.delete('RCT_TESTONLY_RNCORE_TARBALL_PATH')
    end

    def teardown
        ENV.replace(@environment)
        ReactNativeCoreUtils.class_variable_set(:@@build_from_source, @build_from_source)
    end

    def test_visionos_rejects_default_prebuilt_mode_without_mutating_ios_defaults
        assert_nothing_raised { ReactNativeCoreUtils.ensure_source_for_visionos!(Platform.new(:ios)) }
        error = assert_raise(RuntimeError) { ReactNativeCoreUtils.ensure_source_for_visionos!(Platform.new(:visionos)) }
        assert_include(error.message, 'RCT_USE_PREBUILT_RNCORE=0 before the first use_react_native!')
        assert_nil(ENV['RCT_USE_PREBUILT_RNCORE'])
    end

    def test_explicit_source_core_accepts_both_target_orders
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        [[:ios, :visionos], [:visionos, :ios]].each do |platforms|
            platforms.each do |platform|
                assert_nothing_raised { ReactNativeCoreUtils.ensure_source_for_visionos!(Platform.new(platform)) }
            end
        end
    end

    def test_visionos_rejects_late_env_change_after_ios_prebuilt_setup
        ReactNativeCoreUtils.class_variable_set(:@@build_from_source, false)
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        assert_raise(RuntimeError) { ReactNativeCoreUtils.ensure_source_for_visionos!(Platform.new(:visionos)) }
        assert_false(ReactNativeCoreUtils.build_rncore_from_source)
    end

    def test_visionos_rejects_local_prebuilt_override
        ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
        ENV['RCT_TESTONLY_RNCORE_TARBALL_PATH'] = '/tmp/react-core.tar.gz'
        assert_raise(RuntimeError) { ReactNativeCoreUtils.ensure_source_for_visionos!(Platform.new(:visionos)) }
    end

    def test_artifact_version_uses_upstream_base_and_falls_back_for_upstream_packages
        Dir.mktmpdir do |path|
            package_path = File.join(path, 'package.json')
            File.write(package_path, JSON.generate({version: '0.88.4', reactNativeUpstreamVersion: '0.88.0'}))
            assert_equal('0.88.4', NewArchitectureHelper.extract_react_native_version(path))
            assert_equal('0.88.0', NewArchitectureHelper.extract_react_native_upstream_version(path))
            File.write(package_path, JSON.generate({version: '0.88.0'}))
            assert_equal('0.88.0', NewArchitectureHelper.extract_react_native_upstream_version(path))
        end
    end

    def test_visionos_settings_preserve_higher_deployment_targets_and_expressions
        configs = [nil, '0.9', '2.1', '$(inherited)'].map do |version|
            Configuration.new(version ? {'XROS_DEPLOYMENT_TARGET' => version} : {})
        end
        ReactNativePodsUtils.set_visionos_build_settings(NativeTarget.new(configs))
        assert_equal(['1.0', '1.0', '2.1', '$(inherited)'], configs.map { |c| c.build_settings['XROS_DEPLOYMENT_TARGET'] })
        configs.each do |config|
            assert_equal('xros xrsimulator', config.build_settings['SUPPORTED_PLATFORMS'])
            assert_equal('7', config.build_settings['TARGETED_DEVICE_FAMILY'])
            assert_equal('NO', config.build_settings['SUPPORTS_MACCATALYST'])
            assert_nil(config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'])
        end
    end

    def test_post_install_only_changes_visionos_targets
        ios = NativeTarget.new([Configuration.new({'IPHONEOS_DEPLOYMENT_TARGET' => '16.0'})])
        vision = NativeTarget.new([Configuration.new({})])
        result_type = Struct.new(:target, :native_target, :resource_bundle_targets, :test_native_targets,
            :app_native_targets, :test_resource_bundle_targets, :app_resource_bundle_targets, :test_app_host_targets)
        pod_type = Struct.new(:platform)
        results = {
            'iOS' => result_type.new(pod_type.new(Platform.new(:ios)), ios, [], [], {}, {}, {}, []),
            'visionOS' => result_type.new(pod_type.new(Platform.new(:visionos)), vision, [], [], {}, {}, {}, []),
        }
        installation_results = Struct.new(:pod_target_installation_results).new(results)
        installer = Struct.new(:target_installation_results, :aggregate_targets).new(installation_results, [])
        ReactNativePodsUtils.updateOSDeploymentTarget(installer)
        ReactNativePodsUtils.update_visionos_build_settings(installer)
        assert_equal({'IPHONEOS_DEPLOYMENT_TARGET' => '16.0'}, ios.build_configurations.first.build_settings)
        assert_equal('1.0', vision.build_configurations.first.build_settings['XROS_DEPLOYMENT_TARGET'])
        assert_nil(vision.build_configurations.first.build_settings['IPHONEOS_DEPLOYMENT_TARGET'])
    end
end
