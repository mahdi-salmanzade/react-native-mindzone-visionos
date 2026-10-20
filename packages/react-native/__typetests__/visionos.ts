/** @format */

import {Platform, WindowManager, XR} from 'react-native';
import type {
  Window,
  WindowManagerStatic,
  WindowStatic,
  XRStatic,
} from 'react-native';

const xr: XRStatic = XR;
const manager: WindowManagerStatic = WindowManager;
const window: Window = manager.getWindow('SecondWindow');
const handle: WindowStatic = window;
const id: string = handle.id;
const supportsMultipleScenes: boolean = manager.supportsMultipleScenes;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  const isVision: boolean = Platform.isVision;
}
const open: Promise<void> = handle.open();
const update: Promise<void> = handle.update({
  title: 'Updated',
  nested: {value: 1},
});
const close: Promise<void> = handle.close();
const session: Promise<void> = xr.requestSession('ImmersiveSpace');
const end: Promise<void> = xr.endSession();

handle.open(null);
handle.update(null);
handle.update();
xr.requestSession('ImmersiveSpace', null);
xr.requestSession('ImmersiveSpace', {arbitrary: ['payload', 123]});

// @ts-expect-error IDs are primitive strings.
manager.getWindow(123);
// @ts-expect-error The immersive space ID is required.
xr.requestSession();
// @ts-expect-error Window is a type, not a runtime constructor.
const invalidWindow = new Window('SecondWindow');
