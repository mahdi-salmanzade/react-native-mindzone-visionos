#import <TargetConditionals.h>

#if TARGET_OS_VISION

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCTXRModule : NSObject <RCTBridgeModule>

@end

#endif // TARGET_OS_VISION
