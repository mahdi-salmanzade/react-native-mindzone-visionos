# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'test/unit'

class VisionOSPodspecDependenciesTests < Test::Unit::TestCase
    def test_visionos_only_pods_are_not_platform_scoped_podspec_dependencies
        react_native_path = File.expand_path('../../..', __dir__)
        pod_helpers = File.read(File.join(react_native_path, 'scripts/react_native_pods.rb'))
        visionos_blocks = pod_helpers.scan(/if current_target_definition\.platform&\.name == :visionos\n(.*?)^  end/m)
        visionos_only_pods = visionos_blocks.flatten.join("\n").scan(/\bpod ['"]([^'"]+)['"]/).flatten
        assert_not_empty(visionos_only_pods, 'Must discover the pods installed only for visionOS targets')

        # CocoaPods resolves even another platform's scoped dependencies. An iOS
        # target has no local source for these pods, so such a dependency breaks
        # pod install before platform filtering can remove it.
        violations = Dir.glob(File.join(react_native_path, '**/*.podspec')).flat_map do |path|
            dependencies = File.read(path).scan(/\.visionos\s*\.\s*dependency\s*\(?\s*['"]([^'"]+)['"]/).flatten
            dependencies.select { |name| visionos_only_pods.include?(name.split('/').first) }
                .map { |name| "#{path}: #{name}" }
        end
        assert_empty(violations, "Use use_react_native!'s visionOS target branch instead:\n#{violations.join("\n")}")
    end
end
