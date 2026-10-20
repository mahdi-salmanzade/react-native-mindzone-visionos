#import <TargetConditionals.h>

#if TARGET_OS_VISION

#import <UIKit/UIKit.h>

/**
  A `UIViewController` hosting a Fabric root view created by the app delegate's shared root view factory.

  Note: Used to in `RCTRootViewRepresentable` to display React views.
 */
@interface RCTReactViewController : UIViewController

@property (nonatomic, strong, nonnull) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;

- (instancetype _Nonnull)initWithModuleName:(NSString *_Nonnull)moduleName initProps:(NSDictionary *_Nullable)initProps;

- (void)updateProps:(NSDictionary *_Nullable)newProps;

@end

#endif // TARGET_OS_VISION
