#!/usr/bin/env python3
"""Exercise production visionOS launch-link methods with real Foundation delivery.

UIKit scene/session/options containers are stubbed for this macOS host probe.
Method bodies are extracted unchanged from RCTLinkingManager.
This checks the capture policy. The SwiftUI ordering it encodes (scene activation
before a cold-launch onOpenURL) was measured on a visionOS 27.0 simulator.
Run: python3 visionos-port/tests/linking-launch-probe.py
"""

from pathlib import Path
import hashlib
import re
import shlex
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "packages/react-native/Libraries/LinkingIOS/RCTLinkingManager.mm"
MODULE_HEADER = ROOT / "packages/react-native/React/Base/RCTBridgeModule.h"

PREAMBLE = r'''
#import <Foundation/Foundation.h>

#undef TARGET_OS_VISION
#define TARGET_OS_VISION 1
#define RCT_EXTERN extern
void RCTRegisterModule(__unused Class moduleClass) {}

static NSString *const UIWindowSceneSessionRoleApplication = @"application";
static NSString *const UISceneDidActivateNotification = @"UISceneDidActivateNotification";
typedef void (^RCTPromiseResolveBlock)(id);
typedef void (^RCTPromiseRejectBlock)(NSString *, NSString *, NSError *);
static id RCTNullIfNil(id value) { return value ?: [NSNull null]; }

@interface UISceneSession : NSObject
@property (nonatomic, copy) NSString *role;
@end
@implementation UISceneSession
@end

@interface UIScene : NSObject
@property (nonatomic, strong) UISceneSession *session;
@end
@implementation UIScene
@end

@interface UIOpenURLContext : NSObject
@property (nonatomic, strong) NSURL *URL;
@end
@implementation UIOpenURLContext
@end

@interface UISceneConnectionOptions : NSObject
@property (nonatomic, copy) NSSet<UIOpenURLContext *> *URLContexts;
@property (nonatomic, copy) NSSet<NSUserActivity *> *userActivities;
@end
@implementation UISceneConnectionOptions
@end

@interface RCTLinkingManager : NSObject
+ (void)sceneSession:(UISceneSession *)session willConnectWithOptions:(UISceneConnectionOptions *)options;
+ (void)onOpenURL:(NSURL *)url;
- (void)getInitialURL:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)startObserving;
@end
'''

HARNESS = r'''
static void require(BOOL condition, NSString *message)
{
  if (!condition) {
    fprintf(stderr, "FAIL: %s\n", message.UTF8String);
    exit(1);
  }
}

static UISceneSession *session(NSString *role)
{
  UISceneSession *result = [UISceneSession new];
  result.role = role;
  return result;
}

static void activate(NSString *role)
{
  UIScene *scene = [UIScene new];
  scene.session = session(role);
  [[NSNotificationCenter defaultCenter] postNotificationName:UISceneDidActivateNotification object:scene];
}

static void connect(NSString *role, NSString *url, NSArray<NSUserActivity *> *activities)
{
  UISceneConnectionOptions *options = [UISceneConnectionOptions new];
  if (url != nil) {
    UIOpenURLContext *context = [UIOpenURLContext new];
    context.URL = [NSURL URLWithString:url];
    options.URLContexts = [NSSet setWithObject:context];
  } else {
    options.URLContexts = [NSSet set];
  }
  options.userActivities = [NSSet setWithArray:activities];
  [RCTLinkingManager sceneSession:session(role) willConnectWithOptions:options];
}

static void checkInitial(NSString *expected)
{
  __block BOOL resolved = NO;
  // A fresh module instance must still read the process's original launch value.
  [[RCTLinkingManager new] getInitialURL:^(id actual) {
    resolved = YES;
    require([actual isEqual:RCTNullIfNil(expected)],
            [NSString stringWithFormat:@"initial URL %@, expected %@", actual, expected]);
  } reject:^(__unused NSString *code, __unused NSString *message, __unused NSError *error) {
    require(NO, @"getInitialURL must resolve");
  }];
  require(resolved, @"getInitialURL must resolve synchronously on the module queue");
}

static id observe(NSMutableArray<NSString *> *events)
{
  return [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTOpenURLNotification"
                                                          object:nil
                                                           queue:nil
                                                      usingBlock:^(NSNotification *notification) {
    [events addObject:notification.userInfo[@"url"]];
  }];
}

int main(int argc, const char *argv[])
{
  @autoreleasepool {
    require(argc == 2, @"one scenario argument is required");
    NSString *scenario = [NSString stringWithUTF8String:argv[1]];
    NSString *cold = @"rntester://cold";
    NSString *warm = @"rntester://warm";
    NSString *expected = nil;
    NSMutableArray<NSString *> *events = [NSMutableArray new];
    id observer;

    if ([scenario isEqualToString:@"restored-url"] || [scenario isEqualToString:@"restored-after-activation"]) {
      if ([scenario isEqualToString:@"restored-after-activation"]) {
        // Measured SwiftUI order: the scene activates ~100 ms before a cold onOpenURL.
        activate(UIWindowSceneSessionRoleApplication);
      }
      // SwiftUI's cold delivery may precede any React Native listener.
      [RCTLinkingManager onOpenURL:[NSURL URLWithString:cold]];
      observer = observe(events);
      expected = cold;
    } else {
      observer = observe(events);
      if ([scenario isEqualToString:@"new-url"]) {
        connect(UIWindowSceneSessionRoleApplication, cold, @[]);
        expected = cold;
      } else if ([scenario isEqualToString:@"new-empty"]) {
        connect(UIWindowSceneSessionRoleApplication, nil, @[]);
      } else if ([scenario isEqualToString:@"new-universal"] ||
                 [scenario isEqualToString:@"new-url-precedence"]) {
        NSUserActivity *empty = [[NSUserActivity alloc] initWithActivityType:NSUserActivityTypeBrowsingWeb];
        NSUserActivity *universal = [[NSUserActivity alloc] initWithActivityType:NSUserActivityTypeBrowsingWeb];
        universal.webpageURL = [NSURL URLWithString:@"https://example.org/cold"];
        BOOL hasURL = [scenario isEqualToString:@"new-url-precedence"];
        connect(UIWindowSceneSessionRoleApplication, hasURL ? cold : nil, @[empty, universal]);
        expected = hasURL ? cold : universal.webpageURL.absoluteString;
      } else if ([scenario isEqualToString:@"restored-after-read"]) {
        checkInitial(nil);
      } else if ([scenario isEqualToString:@"restored-after-listener"]) {
        // A JS listener receives the URL as an event, so it must not also be initial.
        [[RCTLinkingManager new] startObserving];
        [RCTLinkingManager onOpenURL:[NSURL URLWithString:cold]];
        require([events isEqualToArray:@[cold]], @"listener-first delivery must emit its event");
        [events removeAllObjects];
      } else if ([scenario isEqualToString:@"restored-empty-then-warm"]) {
        // Documented choice: with no capture, read or listener yet, the first link is
        // the only way JS can still see it, so it becomes the initial URL.
        expected = warm;
      } else if ([scenario isEqualToString:@"restored-other-role"]) {
        connect(@"immersive", warm, @[]);
        activate(@"immersive");
        activate(@"external");
        [RCTLinkingManager onOpenURL:[NSURL URLWithString:cold]];
        expected = cold;
        require([events isEqualToArray:@[cold]], @"cold fallback must also emit its event");
        [events removeAllObjects];
      } else {
        require(NO, @"unknown scenario");
      }
    }

    // Exercise delivery before the first read, including the empty-new-session case.
    [RCTLinkingManager onOpenURL:[NSURL URLWithString:warm]];
    checkInitial(expected);
    activate(UIWindowSceneSessionRoleApplication);
    [RCTLinkingManager onOpenURL:[NSURL URLWithString:cold]];
    [RCTLinkingManager onOpenURL:[NSURL URLWithString:cold]];
    connect(UIWindowSceneSessionRoleApplication, @"rntester://later-scene", @[]);
    connect(UIWindowSceneSessionRoleApplication, nil, @[]);
    checkInitial(expected);
    require([events isEqualToArray:@[warm, cold, cold]],
            @"every warm/repeated delivery must emit exactly once, even when identical to the initial URL");
    [[NSNotificationCenter defaultCenter] removeObserver:observer];
    printf("PASS: %s; immutable initial URL, later scenes/recreation, and repeated URL events\n", argv[1]);
  }
}
'''


def extract_method(source, signature):
    start = source.index(signature)
    opening = source.index("\n{", start) + 1
    depth = 0
    for position in range(opening, len(source)):
        if source[position] == "{":
            depth += 1
        elif source[position] == "}":
            depth -= 1
            if depth == 0:
                method = source[start:position + 1]
                digest = hashlib.sha256(method.encode()).hexdigest()
                print(f"EXTRACT: line {source.count(chr(10), 0, start) + 1}, sha256 {digest}, {signature}", flush=True)
                return method
    raise AssertionError(f"Unbalanced method: {signature}")


def main():
    source = SOURCE.read_text()
    globals_match = re.search(r"static NSString \*const kOpenURLNotification.*?\n#endif", source, re.S)
    assert globals_match, "Expected the production notification and visionOS capture globals"
    methods = [extract_method(source, signature) for signature in [
        "+ (void)postNotificationWithURL:(NSURL *)URL\n{",
        "+ (void)sceneSession:",
        "+ (void)onOpenURL:",
        "- (void)getInitialURL:",
        "- (void)startObserving\n{",
    ]]
    # startObserving registers this selector; the event emitter itself is not needed here.
    methods.append("- (void)handleOpenURLNotification:(__unused NSNotification *)notification\n{\n}")
    # Include the actual static-registration macro so its +load cannot silently
    # collide with the production lifecycle hook in this host compilation.
    module_macro = re.search(
        r"#define RCT_EXPORT_MODULE\(js_name\)[^\n]*\\\n  RCT_EXTERN void RCTRegisterModule\(Class\);.*?(?=\n\n#else)",
        MODULE_HEADER.read_text(), re.S)
    assert module_macro and "+(void)load" in module_macro.group()
    with tempfile.TemporaryDirectory(prefix="T11-linking-launch-") as directory:
        directory = Path(directory)
        probe = directory / "probe.mm"
        probe.write_text(PREAMBLE + module_macro.group() + "\n" + globals_match.group() +
                         "\n@implementation RCTLinkingManager\nRCT_EXPORT_MODULE()\n" +
                         "\n\n".join(methods) + "\n@end\n" + HARNESS)
        executable = directory / "linking-launch-probe"
        command = ["xcrun", "--sdk", "macosx", "clang++", "-fobjc-arc", "-fblocks", "-fmodules",
                   f"-fmodules-cache-path={directory / 'module-cache'}", "-Wall", "-Wextra", "-Werror",
                   "-framework", "Foundation", str(probe), "-o", str(executable)]
        print("+ " + shlex.join(command), flush=True)
        subprocess.run(command, check=True)
        for scenario in ["new-url", "new-empty", "new-universal", "new-url-precedence", "restored-url",
                         "restored-after-read", "restored-after-activation", "restored-after-listener",
                         "restored-empty-then-warm", "restored-other-role"]:
            command = [str(executable), scenario]
            print("+ " + shlex.join(command), flush=True)
            subprocess.run(command, check=True)
    print("LIMIT: host probe of the policy; whether visionOS ever restores a session without the configuration callback is unconfirmed", flush=True)


if __name__ == "__main__":
    main()
