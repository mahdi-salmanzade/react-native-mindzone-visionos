/**
 * @flow strict-local
 * @format
 */

'use strict';

beforeEach(() => {
  jest.resetModules();
});

it('forwards sessions and normalizes omitted or null props', async () => {
  const requestSession = jest.fn().mockResolvedValue(undefined);
  const endSession = jest.fn().mockResolvedValue(undefined);
  jest.doMock('../NativeXRModule', () => ({requestSession, endSession}));
  const XR = require('../../../index').XR;
  await XR.requestSession('Space');
  await XR.requestSession('Space', null);
  const props = {nested: {value: 1}};
  await XR.requestSession('Space', props);
  expect(requestSession.mock.calls).toEqual([
    ['Space', {}],
    ['Space', {}],
    ['Space', props],
  ]);
  await XR.endSession();
  expect(endSession).toHaveBeenCalledTimes(1);
});

it('preserves native failures', async () => {
  const error = new Error('The user cancelled');
  jest.doMock('../NativeXRModule', () => ({
    requestSession: jest.fn().mockRejectedValue(error),
    endSession: jest.fn().mockRejectedValue(error),
  }));
  const XR = require('../XR').default;
  await expect(XR.requestSession('Space')).rejects.toBe(error);
  await expect(XR.endSession()).rejects.toBe(error);
});

it('can be imported without a native visionOS module', async () => {
  jest.doMock('../NativeXRModule', () => null);
  const XR = require('../XR').default;
  await expect(XR.requestSession('Space')).rejects.toThrow(
    'NativeXRModule is not available',
  );
  await expect(XR.endSession()).rejects.toThrow(
    'NativeXRModule is not available',
  );
});
