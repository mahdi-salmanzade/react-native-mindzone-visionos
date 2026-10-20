#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#define TIMEOUT_SECONDS 60
#define TEXT_TO_LOOK_FOR @"Hello, World!"

@interface HelloWorldTests : XCTestCase
@end

@implementation HelloWorldTests

- (BOOL)findWelcomeInView:(UIView *)view
{
  if ([view.accessibilityLabel isEqualToString:TEXT_TO_LOOK_FOR]) {
    return YES;
  }
  for (UIView *child in view.subviews) {
    if ([self findWelcomeInView:child]) {
      return YES;
    }
  }
  return NO;
}

- (void)testRendersWelcomeScreen
{
  // SwiftUI owns visionOS windows; the app delegate's window may be nil.
  // iOS 0.88 also starts React through a scene delegate.
  NSPredicate *rendered = [NSPredicate predicateWithBlock:^BOOL(id object, NSDictionary *bindings) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if (![scene isKindOfClass:UIWindowScene.class] || scene.activationState != UISceneActivationStateForegroundActive) {
        continue;
      }
      for (UIWindow *window in ((UIWindowScene *)scene).windows) {
        if (!window.hidden && [self findWelcomeInView:window]) {
          return YES;
        }
      }
    }
    return NO;
  }];
  [self expectationForPredicate:rendered evaluatedWithObject:NSNull.null handler:nil];
  [self waitForExpectationsWithTimeout:TIMEOUT_SECONDS handler:nil];
}

@end
