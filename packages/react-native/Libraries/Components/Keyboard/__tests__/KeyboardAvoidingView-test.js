/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from '../../../Utilities/Platform';
import View from '../../View/View';
import Keyboard from '../Keyboard';
import KeyboardAvoidingView from '../KeyboardAvoidingView';
import * as React from 'react';

const render = require('@react-native/jest-preset/jest/renderer');

it('forwards layout events without keyboard avoidance on visionOS', async () => {
  const isVision = jest
    .spyOn(Platform, 'isVision', 'get')
    .mockReturnValue(true);
  const addListener = jest.spyOn(Keyboard, 'addListener');
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const onLayout = jest.fn();
  let output;

  try {
    output = await render.create(
      <KeyboardAvoidingView
        behavior="padding"
        style={{height: 200}}
        onLayout={onLayout}
      />,
    );
    const view = output.root.findByType(View);
    const event = {
      nativeEvent: {layout: {x: 0, y: 0, width: 300, height: 200}},
    };
    view.props.onLayout(event);

    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(onLayout).toHaveBeenCalledWith(event);
    expect(view.props.style).toEqual({height: 200});
    expect(addListener).not.toHaveBeenCalled();
  } finally {
    if (output != null) {
      await render.unmount(output);
    }
    warn.mockRestore();
    addListener.mockRestore();
    isVision.mockRestore();
  }
});
