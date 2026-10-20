/**
 * @flow strict-local
 * @format
 */

'use strict';

beforeEach(() => {
  jest.resetModules();
});

it('routes each handle to its own ID and normalizes optional props', async () => {
  const openWindow = jest.fn().mockResolvedValue(undefined);
  const updateWindow = jest.fn().mockResolvedValue(undefined);
  const closeWindow = jest.fn().mockResolvedValue(undefined);
  jest.doMock('../NativeWindowManager', () => ({
    getConstants: () => ({supportsMultipleScenes: true}),
    openWindow,
    updateWindow,
    closeWindow,
  }));
  const ReactNative = require('../../../index');
  const WindowManager = ReactNative.WindowManager;
  expect(Object.hasOwn(ReactNative, 'Window')).toBe(false);
  expect(WindowManager.supportsMultipleScenes).toBe(true);
  const first = WindowManager.getWindow('First');
  const second = WindowManager.getWindow('Second');
  expect(first.id).toBe('First');
  await first.open();
  await second.open(null);
  const props = {title: 'Updated', nested: {value: 1}};
  await second.update(props);
  await first.update(null);
  await first.update();
  await second.close();
  expect(openWindow.mock.calls).toEqual([
    ['First', {}],
    ['Second', {}],
  ]);
  expect(updateWindow.mock.calls).toEqual([
    ['Second', props],
    ['First', {}],
    ['First', {}],
  ]);
  expect(closeWindow).toHaveBeenCalledWith('Second');
});

it('defaults missing support constants to false', () => {
  jest.doMock('../NativeWindowManager', () => ({getConstants: () => ({})}));
  expect(require('../WindowManager').default.supportsMultipleScenes).toBe(
    false,
  );
});

it('omits null and undefined props before calling native without changing the input', async () => {
  const openWindow = jest.fn().mockResolvedValue(undefined);
  const updateWindow = jest.fn().mockResolvedValue(undefined);
  jest.doMock('../NativeWindowManager', () => ({openWindow, updateWindow}));
  const window = require('../WindowManager').default.getWindow('Second');
  const props = Object.freeze({
    nullable: null,
    missing: undefined,
    count: 0,
    enabled: false,
    title: '',
  });

  await window.open(props);
  await window.update(props);
  await window.update({nullable: null});

  const expected = {count: 0, enabled: false, title: ''};
  expect(openWindow).toHaveBeenCalledWith('Second', expected);
  expect(updateWindow.mock.calls).toEqual([
    ['Second', expected],
    ['Second', {}],
  ]);
  expect(props.nullable).toBeNull();
  expect(Object.hasOwn(props, 'missing')).toBe(true);
});

it('preserves native failures', async () => {
  const error = new Error('Multiple scenes are disabled');
  jest.doMock('../NativeWindowManager', () => ({
    openWindow: jest.fn().mockRejectedValue(error),
    updateWindow: jest.fn().mockRejectedValue(error),
    closeWindow: jest.fn().mockRejectedValue(error),
  }));
  const window = require('../WindowManager').default.getWindow('Second');
  await expect(window.open()).rejects.toBe(error);
  await expect(window.update()).rejects.toBe(error);
  await expect(window.close()).rejects.toBe(error);
});

it('can be imported without a native visionOS module', async () => {
  jest.doMock('../NativeWindowManager', () => null);
  const WindowManager = require('../WindowManager').default;
  expect(WindowManager.supportsMultipleScenes).toBe(false);
  const window = WindowManager.getWindow('Second');
  await expect(window.open()).rejects.toThrow(
    'NativeWindowManager is not available',
  );
  await expect(window.update()).rejects.toThrow(
    'NativeWindowManager is not available',
  );
  await expect(window.close()).rejects.toThrow(
    'NativeWindowManager is not available',
  );
});
