#import <TargetConditionals.h>

#if TARGET_OS_VISION

#import <React/RCTXRModule.h>

#import <FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS.h>

#import <React/RCTUtils.h>
#if defined(SWIFT_PACKAGE)
@import RCTXR;
#else
#import "RCTXR-Swift.h"
#endif

// Events consumed by RCTMainWindow's SwiftUI scene context.
static NSString *const RCTOpenImmersiveSpace = @"RCTOpenImmersiveSpace";
static NSString *const RCTDismissImmersiveSpace = @"RCTDismissImmersiveSpace";

@interface RCTXRModule () <NativeXRModuleSpec>
@end

@implementation RCTXRModule {
  UIViewController *_immersiveBridgeView;
  NSString *_currentSessionId;
  RCTPromiseResolveBlock _requestResolve;
  RCTPromiseRejectBlock _requestReject;
  BOOL _endingSession;
}

RCT_EXPORT_MODULE(XRModule)

RCT_EXPORT_METHOD(endSession : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (self->_immersiveBridgeView == nil) {
      resolve(nil);
      return;
    }

    self->_endingSession = YES;
    if (self->_requestReject != nil) {
      self->_requestReject(@"ERROR", @"Immersive Space ended before opening", nil);
      self->_requestResolve = nil;
      self->_requestReject = nil;
    }
    UIViewController *bridgeView = self->_immersiveBridgeView;
    [SwiftUIBridgeFactory dismissImmersiveBridgeView:bridgeView
                                   completionHandler:^{
                                     // Keep the session ID until SwiftUI has finished closing the space.
                                     if (self->_immersiveBridgeView == bridgeView) {
                                       [self clearSession];
                                     }
                                     resolve(nil);
                                   }];
  });
}

RCT_EXPORT_METHOD(requestSession : (NSString *)sessionId userInfo : (NSDictionary *)
                      userInfo resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (!RCTSharedApplication().supportsMultipleScenes) {
      reject(@"ERROR", @"Multiple scenes not supported", nil);
      return;
    }
    if (self->_immersiveBridgeView != nil) {
      reject(@"ERROR", @"Immersive Space already opened", nil);
      return;
    }
    UIViewController *rootViewController = RCTKeyWindow().rootViewController;
    if (rootViewController == nil) {
      reject(@"ERROR", @"No root view controller is available to open an Immersive Space", nil);
      return;
    }

    self->_currentSessionId = [sessionId copy];
    self->_requestResolve = resolve;
    self->_requestReject = reject;
    self->_endingSession = NO;
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTOpenImmersiveSpace
                                                        object:self
                                                      userInfo:@{
                                                        @"id" : sessionId,
                                                        @"userInfo" : userInfo ?: @{}
                                                      }];

    __weak RCTXRModule *weakSelf = self;
    self->_immersiveBridgeView = [SwiftUIBridgeFactory
        makeImmersiveBridgeViewWithSpaceId:sessionId
                         completionHandler:^(enum ImmersiveSpaceResult result) {
                           RCTXRModule *strongSelf = weakSelf;
                           if (strongSelf == nil || strongSelf->_endingSession) {
                             return;
                           }
                           RCTPromiseResolveBlock requestResolve = strongSelf->_requestResolve;
                           RCTPromiseRejectBlock requestReject = strongSelf->_requestReject;
                           strongSelf->_requestResolve = nil;
                           strongSelf->_requestReject = nil;
                           if (result == ImmersiveSpaceResultOpened) {
                             if (requestResolve != nil) {
                               requestResolve(nil);
                             }
                           } else {
                             [strongSelf clearSession];
                             if (requestReject != nil) {
                               NSString *message = result == ImmersiveSpaceResultUserCancelled
                                   ? @"Immersive Space canceled by user"
                                   : @"Immersive Space failed to open, the system cannot fulfill the request.";
                               requestReject(@"ERROR", message, nil);
                             }
                           }
                         }];

    [rootViewController addChildViewController:self->_immersiveBridgeView];
    [rootViewController.view addSubview:self->_immersiveBridgeView.view];
    [self->_immersiveBridgeView didMoveToParentViewController:rootViewController];
  });
}

// All callers run on the main queue, including the Swift bridge's completion handlers.
- (void)clearSession
{
  NSString *sessionId = _currentSessionId;
  UIViewController *bridgeView = _immersiveBridgeView;
  _currentSessionId = nil;
  _immersiveBridgeView = nil;
  _requestResolve = nil;
  _requestReject = nil;
  _endingSession = NO;
  [bridgeView willMoveToParentViewController:nil];
  [bridgeView.view removeFromSuperview];
  [bridgeView removeFromParentViewController];
  if (sessionId != nil) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDismissImmersiveSpace
                                                        object:self
                                                      userInfo:@{@"id" : sessionId}];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeXRModuleSpecJSI>(params);
}

@end

#endif // TARGET_OS_VISION
