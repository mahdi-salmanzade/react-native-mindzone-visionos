/** @format */

import * as React from 'react';
import {Platform, StatusBar} from 'react-native';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import App from '../App';

it('renders the same accessible welcome content as the native smoke test', async () => {
  let app: ReactTestRenderer;
  await act(() => {
    app = create(<App />);
  });
  expect(app!.root.findByProps({testID: 'welcome-title'}).props.children).toBe(
    'Hello, World!',
  );
  await act(() => {
    app!.unmount();
  });
});

it.each([false, true])(
  'renders StatusBar only outside visionOS (isVision=%s)',
  async isVision => {
    const platform = jest
      .spyOn(Platform, 'isVision', 'get')
      .mockReturnValue(isVision);
    let app: ReactTestRenderer;
    try {
      await act(() => {
        app = create(<App />);
      });
      expect(app!.root.findAllByType(StatusBar)).toHaveLength(isVision ? 0 : 1);
    } finally {
      await act(() => {
        app!.unmount();
      });
      platform.mockRestore();
    }
  },
);
