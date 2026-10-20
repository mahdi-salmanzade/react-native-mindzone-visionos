#import "RCTReactViewController.h"

#if TARGET_OS_VISION

#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <React/RCTConstants.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTUtils.h>

@protocol RCTFocusedWindowProtocol <NSObject>

@property (nonatomic, nullable) UIWindow *lastFocusedWindow;

@end

@implementation RCTReactViewController {
  __weak UIWindow *_reactWindow;
  __weak UIWindowScene *_reactWindowScene;
}

- (instancetype)initWithModuleName:(NSString *)moduleName initProps:(NSDictionary *)initProps
{
  if (self = [super init]) {
    _moduleName = moduleName;
    _initialProps = initProps;
  }
  return self;
}

- (void)viewWillTransitionToSize:(CGSize)size
       withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  BOOL enqueued = [coordinator animateAlongsideTransition:nil
                                               completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
                                                 [self notifyWindowFrameChanged];
                                               }];
  if (!enqueued) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self notifyWindowFrameChanged];
    });
  }
}

- (void)loadView
{
  RCTAppDelegate *appDelegate = (RCTAppDelegate *)[UIApplication sharedApplication].delegate;
  if ([appDelegate respondsToSelector:@selector(rootViewFactory)]) {
    self.view = [appDelegate.rootViewFactory viewWithModuleName:_moduleName initialProperties:_initialProps];
  } else {
    [NSException raise:@"UIApplicationDelegate:viewWithModuleName:initialProperties:launchOptions: not implemented"
                format:@"Make sure you subclass RCTAppDelegate"];
  }
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(windowSceneDidDisconnect:)
                                               name:UISceneDidDisconnectNotification
                                             object:nil];
  UITapGestureRecognizer *tapGesture = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                               action:@selector(tapGesture:)];
  tapGesture.cancelsTouchesInView = NO;
  [self.view addGestureRecognizer:tapGesture];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  _reactWindow = self.view.window;
  _reactWindowScene = _reactWindow.windowScene;
  [self focusWindow:_reactWindow];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)notifyWindowFrameChanged
{
  UIWindow *window = self.viewIfLoaded.window;
  if (window != nil) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:window];
  }
}

- (void)tapGesture:(UITapGestureRecognizer *)recognizer
{
  [self focusWindow:recognizer.view.window];
}

- (void)focusWindow:(UIWindow *)targetWindow
{
  if (targetWindow == nil) {
    return;
  }
  id<RCTFocusedWindowProtocol> appDelegate = (id<RCTFocusedWindowProtocol>)RCTSharedApplication().delegate;
  if ([appDelegate respondsToSelector:@selector(setLastFocusedWindow:)]) {
    appDelegate.lastFocusedWindow = targetWindow;
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:targetWindow];
}

- (void)windowSceneDidDisconnect:(NSNotification *)notification
{
  if (_reactWindowScene == nil || notification.object != _reactWindowScene) {
    return;
  }
  UIWindow *window = _reactWindow;
  id<RCTFocusedWindowProtocol> appDelegate = (id<RCTFocusedWindowProtocol>)RCTSharedApplication().delegate;
  if ([appDelegate respondsToSelector:@selector(lastFocusedWindow)] && appDelegate.lastFocusedWindow == window) {
    appDelegate.lastFocusedWindow = nil;
  }
  _reactWindow = nil;
  _reactWindowScene = nil;
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:window];
}

- (void)updateProps:(NSDictionary *)newProps
{
  RCTSurfaceHostingProxyRootView *rootView = (RCTSurfaceHostingProxyRootView *)self.view;
  if (rootView.appProperties == newProps) {
    return;
  }
  if (newProps != nil && ![rootView.appProperties isEqualToDictionary:newProps]) {
    NSMutableDictionary *newProperties = [rootView.appProperties mutableCopy] ?: [NSMutableDictionary new];
    [newProperties addEntriesFromDictionary:newProps];
    [rootView setAppProperties:newProperties];
  }
}
@end

#endif // TARGET_OS_VISION
