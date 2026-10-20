# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class AutolinkingUtils

    def self.dependency_config(package, current_target_definition)
        # visionOS has its own CLI exclusions and pod configuration. Preserve
        # the upstream iOS configuration for all other CocoaPods targets.
        platform = current_target_definition.platform&.name == :visionos ? "visionos" : "ios"
        return package["platforms"][platform]
    end

    def self.nested_path_exists?(object, *path)
        path.reduce(object) do |obj, method|
            return false unless obj.respond_to?(method)
            obj.public_send(method)
        end
        return true
    end

    def self.is_platform_supported?(current_target_definition, spec)
        platform = current_target_definition.platform
        if !platform
            # Historically we've supported platforms that aren't specifically excluded.
            return true
        end
        return spec.supported_on_platform?(platform.name)
    end

end
