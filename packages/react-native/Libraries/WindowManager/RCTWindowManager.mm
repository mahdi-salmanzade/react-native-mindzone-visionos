#import <TargetConditionals.h>

#if TARGET_OS_VISION

#import <React/RCTWindowManager.h>

#import <FBReactNativeSpec_visionOS/FBReactNativeSpec_visionOS.h>

#import <React/RCTUtils.h>

// Events
static NSString *const RCTOpenWindow = @"RCTOpenWindow";
static NSString *const RCTDismissWindow = @"RCTDismissWindow";
static NSString *const RCTUpdateWindow = @"RCTUpdateWindow";

@interface RCTWindowManager () <NativeWindowManagerSpec>
@end

@implementation RCTWindowManager

RCT_EXPORT_MODULE(WindowManager)

RCT_EXPORT_METHOD(openWindow : (NSString *)windowId userInfo : (NSDictionary *)
                      userInfo resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (!RCTSharedApplication().supportsMultipleScenes) {
      reject(@"ERROR", @"Multiple scenes not supported", nil);
      return;
    }
    NSMutableDictionary *userInfoDict = [[NSMutableDictionary alloc] init];
    [userInfoDict setValue:windowId forKey:@"id"];
    if (userInfo != nil) {
      [userInfoDict setValue:userInfo forKey:@"userInfo"];
    }
    [self dispatchWindowNotification:RCTOpenWindow userInfo:userInfoDict resolve:resolve reject:reject];
  });
}

RCT_EXPORT_METHOD(closeWindow : (NSString *)windowId resolve : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (!RCTSharedApplication().supportsMultipleScenes) {
      reject(@"ERROR", @"Multiple scenes not supported", nil);
      return;
    }
    [self dispatchWindowNotification:RCTDismissWindow userInfo:@{@"id" : windowId} resolve:resolve reject:reject];
  });
}

RCT_EXPORT_METHOD(updateWindow : (NSString *)windowId userInfo : (NSDictionary *)
                      userInfo resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTExecuteOnMainQueue(^{
    if (!RCTSharedApplication().supportsMultipleScenes) {
      reject(@"ERROR", @"Multiple scenes not supported", nil);
      return;
    }
    NSMutableDictionary *userInfoDict = [[NSMutableDictionary alloc] init];
    [userInfoDict setValue:windowId forKey:@"id"];
    if (userInfo != nil) {
      [userInfoDict setValue:userInfo forKey:@"userInfo"];
    }
    [self dispatchWindowNotification:RCTUpdateWindow userInfo:userInfoDict resolve:resolve reject:reject];
  });
}

- (void)dispatchWindowNotification:(NSString *)name
                          userInfo:(NSDictionary *)userInfo
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject
{
  // NotificationCenter delivers synchronously on the main queue. The elected
  // SwiftUI host claims this shared request before invoking its window action.
  NSMutableDictionary *request = [@{@"handled" : @NO} mutableCopy];
  [[NSNotificationCenter defaultCenter] postNotificationName:name object:request userInfo:userInfo];
  if ([request[@"handled"] boolValue]) {
    resolve(nil);
  } else {
    reject(@"ERROR", @"No React scene could handle the window operation", nil);
  }
}

- (facebook::react::ModuleConstants<JS::NativeWindowManager::Constants::Builder>)constantsToExport
{
  return [self getConstants];
}

- (facebook::react::ModuleConstants<JS::NativeWindowManager::Constants>)getConstants
{
  __block facebook::react::ModuleConstants<JS::NativeWindowManager::Constants> constants;
  RCTUnsafeExecuteOnMainQueueSync(^{
    constants = facebook::react::typedConstants<JS::NativeWindowManager::Constants>(
        {.supportsMultipleScenes = RCTSharedApplication().supportsMultipleScenes});
  });

  return constants;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeWindowManagerSpecJSI>(params);
}

@end

#endif // TARGET_OS_VISION
