/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const LayoutAnimation =
  require('../../../LayoutAnimation/LayoutAnimation').default;
const dismissKeyboard = require('../../../Utilities/dismissKeyboard').default;
const Keyboard = require('../Keyboard').default;

jest.mock('../../../LayoutAnimation/LayoutAnimation');
jest.mock('../../../Utilities/dismissKeyboard');

describe('Keyboard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses dismissKeyboard utility', () => {
    Keyboard.dismiss();
    expect(dismissKeyboard).toHaveBeenCalled();
  });

  describe('scheduling layout animation', () => {
    const scheduleLayoutAnimation = (
      duration: null | number,
      easing: null | string,
    ): void =>
      // $FlowFixMe[incompatible-type]
      Keyboard.scheduleLayoutAnimation({duration, easing});

    it('triggers layout animation', () => {
      scheduleLayoutAnimation(12, 'spring');
      expect(LayoutAnimation.configureNext).toHaveBeenCalledWith({
        duration: 12,
        update: {
          duration: 12,
          type: 'spring',
        },
      });
    });

    it('does not trigger animation when duration is null', () => {
      scheduleLayoutAnimation(null, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    it('does not trigger animation when duration is 0', () => {
      scheduleLayoutAnimation(0, 'spring');
      expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
    });

    describe('animation update type', () => {
      const assertAnimationUpdateType = (type: string) =>
        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: expect.anything(),
            update: {duration: expect.anything(), type},
          }),
        );

      it('retrieves type from LayoutAnimation', () => {
        scheduleLayoutAnimation(12, 'linear');
        assertAnimationUpdateType('linear');
      });

      it("defaults to 'keyboard' when key in LayoutAnimation is not found", () => {
        scheduleLayoutAnimation(12, 'some-unknown-animation-type');
        assertAnimationUpdateType('keyboard');
      });

      it("defaults to 'keyboard' when easing is null", () => {
        scheduleLayoutAnimation(12, null);
        assertAnimationUpdateType('keyboard');
      });
    });
  });
});

describe('Keyboard on visionOS', () => {
  it('does not subscribe to keyboard events or remove other subscriptions', () => {
    jest.isolateModules(() => {
      const Platform = require('../../../Utilities/Platform').default;
      const NativeEventEmitter =
        require('../../../EventEmitter/NativeEventEmitter').default;
      const isVision = jest
        .spyOn(Platform, 'isVision', 'get')
        .mockReturnValue(true);
      const addListener = jest.spyOn(
        NativeEventEmitter.prototype,
        'addListener',
      );
      const removeAllListeners = jest.spyOn(
        NativeEventEmitter.prototype,
        'removeAllListeners',
      );
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        const VisionKeyboard = require('../Keyboard').default;
        expect(addListener).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();

        const subscription = VisionKeyboard.addListener(
          'keyboardDidShow',
          jest.fn(),
        );
        VisionKeyboard.addListener('keyboardDidHide', jest.fn()).remove();
        subscription.remove();
        subscription.remove();
        VisionKeyboard.removeAllListeners('keyboardDidShow');

        expect(addListener).not.toHaveBeenCalled();
        expect(removeAllListeners).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(VisionKeyboard.isVisible()).toBe(false);
        expect(VisionKeyboard.metrics()).toBeUndefined();
      } finally {
        warn.mockRestore();
        removeAllListeners.mockRestore();
        addListener.mockRestore();
        isVision.mockRestore();
      }
    });
  });
});
