#import <TargetConditionals.h>

#if TARGET_OS_VISION

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

@interface RCTXRModule : NSObject <RCTBridgeModule, RCTInvalidating>

@end

#endif // TARGET_OS_VISION
