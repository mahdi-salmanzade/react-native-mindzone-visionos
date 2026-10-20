/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const nativeWindows = require('../../../../../react-native/Libraries/WindowManager/NativeWindowManager');
const nativeXR = require('../../../../../react-native/Libraries/XR/NativeXRModule');
const SecondWindow = require('../../SecondWindow/SecondWindow');
const {
  create,
  unmount,
  update,
} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');
const {Alert, Button, Text} = require('react-native');
const {act} = require('react-test-renderer');

jest.mock('../../../../../react-native/Libraries/XR/NativeXRModule', () => ({
  requestSession: jest.fn(),
  endSession: jest.fn(),
}));
jest.mock(
  '../../../../../react-native/Libraries/WindowManager/NativeWindowManager',
  () => ({
    getConstants: jest.fn(() => ({supportsMultipleScenes: true})),
    openWindow: jest.fn(),
    updateWindow: jest.fn(),
    closeWindow: jest.fn(),
  }),
);

function Example() {
  const Component = require('../XRExample').examples[0].render;
  return <Component />;
}

async function press(renderer, title) {
  const button = renderer.root
    .findAllByType(Button)
    .find(node => node.props.title === title);
  await act(async () => {
    await button.props.onPress();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('opens and ends an immersive session and keeps cancellation visible', async () => {
  const renderer = await create(<Example />);
  const state = () =>
    renderer.root.findAllByType(Text)[0].props.children.join('');
  expect(state()).toBe('Is XR session open: false');
  await press(renderer, 'Open XR Session');
  expect(nativeXR.requestSession).toHaveBeenCalledWith(
    'TestImmersiveSpace',
    {},
  );
  expect(state()).toBe('Is XR session open: true');
  await press(renderer, 'Close XR Session');
  expect(nativeXR.endSession).toHaveBeenCalledTimes(1);
  expect(state()).toBe('Is XR session open: false');

  nativeXR.requestSession.mockRejectedValueOnce(new Error('User cancelled'));
  await press(renderer, 'Open XR Session');
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'User cancelled');
  expect(state()).toBe('Is XR session open: false');
  await unmount(renderer);
});

it('checks scene support and catches errors from every window operation', async () => {
  const renderer = await create(<Example />);
  nativeWindows.getConstants.mockReturnValueOnce({
    supportsMultipleScenes: false,
  });
  await press(renderer, 'Open XR Session');
  expect(nativeXR.requestSession).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith(
    'Error',
    'Multiple scenes are not supported',
  );

  await press(renderer, 'Open Second Window');
  expect(nativeWindows.openWindow).toHaveBeenCalledWith('SecondWindow', {
    title: 'React Native Window',
  });
  await press(renderer, 'Update Second Window');
  expect(nativeWindows.updateWindow).toHaveBeenCalledWith('SecondWindow', {
    title: 'Updated Window',
  });
  await press(renderer, 'Close Second Window');
  expect(nativeWindows.closeWindow).toHaveBeenCalledWith('SecondWindow');

  for (const [method, title] of [
    [nativeWindows.openWindow, 'Open Second Window'],
    [nativeWindows.updateWindow, 'Update Second Window'],
    [nativeWindows.closeWindow, 'Close Second Window'],
    [nativeXR.endSession, 'Close XR Session'],
  ]) {
    method.mockRejectedValueOnce('Unavailable');
    await press(renderer, title);
    expect(Alert.alert).toHaveBeenLastCalledWith('Error', 'Unavailable');
  }
  await unmount(renderer);
});

it('updates secondary-window props without losing its counter and catches close errors', async () => {
  const renderer = await create(<SecondWindow title="Initial" />);
  await press(renderer, 'Increment');
  await update(renderer, <SecondWindow title="Updated" />);
  expect(
    renderer.root
      .findAllByType(Text)
      .slice(0, 2)
      .map(node => node.props.children),
  ).toEqual(['Updated', 1]);
  nativeWindows.closeWindow.mockRejectedValueOnce(new Error('Cannot close'));
  await press(renderer, 'Close window');
  expect(nativeWindows.closeWindow).toHaveBeenCalledWith('SecondWindow');
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cannot close');
  await unmount(renderer);
});
