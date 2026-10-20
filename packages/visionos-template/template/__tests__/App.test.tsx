/** @format */

import * as React from 'react';
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
