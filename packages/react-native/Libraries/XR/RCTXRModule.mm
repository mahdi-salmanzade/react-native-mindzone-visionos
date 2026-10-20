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

// SwiftUI permits one immersive space per app. Keep reload's replacement module
// from opening until the old module has dismissed its space and scene data.
// All access is confined to the main queue.
static __weak RCTXRModule *RCTActiveImmersiveSessionOwner;

@interface RCTXRModule () <NativeXRModuleSpec>
@end

@implementation RCTXRModule {
  UIViewController *_immersiveBridgeView;
  NSString *_currentSessionId;
  RCTPromiseResolveBlock _requestResolve;
  RCTPromiseRejectBlock _requestReject;
  NSMutableArray<RCTPromiseResolveBlock> *_endResolves;
  NSMutableArray<RCTPromiseRejectBlock> *_endRejects;
  NSObject *_sessionToken;
  BOOL _endingSession;
  BOOL _invalidated;
}

RCT_EXPORT_MODULE(XRModule)

RCT_EXPORT_METHOD(endSession : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (self->_invalidated) {
      reject(@"ERROR", @"XR module was invalidated", nil);
      return;
    }
    if (self->_immersiveBridgeView == nil) {
      resolve(nil);
      return;
    }

    if (self->_endResolves == nil) {
      self->_endResolves = [NSMutableArray new];
      self->_endRejects = [NSMutableArray new];
    }
    [self->_endResolves addObject:[resolve copy]];
    [self->_endRejects addObject:[reject copy]];
    if (self->_endingSession) {
      return;
    }
    self->_endingSession = YES;
    if (self->_requestReject != nil) {
      RCTPromiseRejectBlock requestReject = self->_requestReject;
      self->_requestResolve = nil;
      self->_requestReject = nil;
      requestReject(@"ERROR", @"Immersive Space ended before opening", nil);
    }
    UIViewController *bridgeView = self->_immersiveBridgeView;
    [SwiftUIBridgeFactory dismissImmersiveBridgeView:bridgeView
                                   completionHandler:^{
                                     // Keep the session ID until SwiftUI has finished closing the space.
                                     if (self->_immersiveBridgeView == bridgeView) {
                                       [self clearSession];
                                     }
                                   }];
  });
}

RCT_EXPORT_METHOD(requestSession : (NSString *)sessionId userInfo : (NSDictionary *)
                      userInfo resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (self->_invalidated) {
      reject(@"ERROR", @"XR module was invalidated", nil);
      return;
    }
    if (!RCTSharedApplication().supportsMultipleScenes) {
      reject(@"ERROR", @"Multiple scenes not supported", nil);
      return;
    }
    if (self->_immersiveBridgeView != nil || RCTActiveImmersiveSessionOwner != nil) {
      reject(@"ERROR", @"Immersive Space already opened or closing", nil);
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
    NSObject *sessionToken = [NSObject new];
    self->_sessionToken = sessionToken;
    RCTActiveImmersiveSessionOwner = self;
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTOpenImmersiveSpace
                                                        object:self
                                                      userInfo:@{
                                                        @"id" : sessionId,
                                                        @"userInfo" : userInfo ?: @{}
                                                      }];

    __weak RCTXRModule *weakSelf = self;
    self->_immersiveBridgeView = [SwiftUIBridgeFactory makeImmersiveBridgeViewWithSpaceId:sessionId
        completionHandler:^(enum ImmersiveSpaceResult result) {
          RCTXRModule *strongSelf = weakSelf;
          if (strongSelf == nil || strongSelf->_sessionToken != sessionToken || strongSelf->_endingSession ||
              strongSelf->_invalidated) {
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
        }
        dismissalHandler:^{
          RCTXRModule *strongSelf = weakSelf;
          if (strongSelf != nil && strongSelf->_sessionToken == sessionToken) {
            [strongSelf clearSession];
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
  if (_immersiveBridgeView == nil) {
    return;
  }
  NSString *sessionId = _currentSessionId;
  UIViewController *bridgeView = _immersiveBridgeView;
  RCTPromiseRejectBlock requestReject = _requestReject;
  NSArray<RCTPromiseResolveBlock> *endResolves = _endResolves;
  _currentSessionId = nil;
  _immersiveBridgeView = nil;
  _sessionToken = nil;
  _requestResolve = nil;
  _requestReject = nil;
  _endResolves = nil;
  _endRejects = nil;
  _endingSession = NO;
  [bridgeView willMoveToParentViewController:nil];
  [bridgeView.view removeFromSuperview];
  [bridgeView removeFromParentViewController];
  if (sessionId != nil) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDismissImmersiveSpace
                                                        object:self
                                                      userInfo:@{@"id" : sessionId}];
  }
  if (RCTActiveImmersiveSessionOwner == self) {
    RCTActiveImmersiveSessionOwner = nil;
  }
  if (requestReject != nil) {
    requestReject(@"ERROR", @"Immersive Space closed before opening", nil);
  }
  for (RCTPromiseResolveBlock resolve in endResolves) {
    resolve(nil);
  }
}

- (void)invalidate
{
  RCTExecuteOnMainQueue(^{
    if (self->_invalidated) {
      return;
    }
    self->_invalidated = YES;
    self->_endingSession = YES;
    RCTPromiseRejectBlock requestReject = self->_requestReject;
    NSArray<RCTPromiseRejectBlock> *endRejects = self->_endRejects;
    self->_requestResolve = nil;
    self->_requestReject = nil;
    self->_endResolves = nil;
    self->_endRejects = nil;
    if (requestReject != nil) {
      requestReject(@"ERROR", @"XR module was invalidated", nil);
    }
    for (RCTPromiseRejectBlock reject in endRejects) {
      reject(@"ERROR", @"XR module was invalidated", nil);
    }

    UIViewController *bridgeView = self->_immersiveBridgeView;
    if (bridgeView != nil) {
      // Retain this module until an in-flight open has finished and the space is
      // dismissed. Removing the host alone does not invalidate its SwiftUI task.
      [SwiftUIBridgeFactory dismissImmersiveBridgeView:bridgeView
                                     completionHandler:^{
                                       [self clearSession];
                                     }];
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeXRModuleSpecJSI>(params);
}

@end

#endif // TARGET_OS_VISION
