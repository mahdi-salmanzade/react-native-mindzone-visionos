# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'test/unit'
require_relative '../autolinking_utils'

class AutolinkingUtilsTests < Test::Unit::TestCase
    Platform = Struct.new(:name)
    Target = Struct.new(:platform)

    def test_visionos_uses_its_enabled_configuration_when_ios_is_disabled
        visionos = {'podspecPath' => 'Vision.podspec', 'configurations' => ['Debug']}
        package = {'platforms' => {'ios' => nil, 'visionos' => visionos}}
        assert_same(visionos, AutolinkingUtils.dependency_config(package, Target.new(Platform.new(:visionos))))
        assert_nil(AutolinkingUtils.dependency_config(package, Target.new(Platform.new(:ios))))
    end

    def test_visionos_exclusion_does_not_disable_other_platforms
        ios = {'podspecPath' => 'Shared.podspec', 'scriptPhases' => [{'script' => 'echo ios'}]}
        package = {'platforms' => {'ios' => ios, 'visionos' => nil}}
        assert_nil(AutolinkingUtils.dependency_config(package, Target.new(Platform.new(:visionos))))
        [:ios, :osx, :tvos, nil].each do |platform|
            target = Target.new(platform && Platform.new(platform))
            assert_same(ios, AutolinkingUtils.dependency_config(package, target))
        end
    end

    def test_visionos_selects_its_own_podspec_and_scripts_when_both_are_enabled
        ios = {'podspecPath' => 'IOS.podspec'}
        visionos = {'podspecPath' => 'Vision.podspec', 'scriptPhases' => [{'script' => 'echo visionos'}]}
        package = {'platforms' => {'ios' => ios, 'visionos' => visionos}}
        assert_same(visionos, AutolinkingUtils.dependency_config(package, Target.new(Platform.new(:visionos))))
        assert_same(ios, AutolinkingUtils.dependency_config(package, Target.new(Platform.new(:ios))))
    end
end
