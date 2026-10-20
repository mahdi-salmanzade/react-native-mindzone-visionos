/**
 * @flow strict-local
 * @format
 */

import type {UnsafeObject} from '../Types/CodegenTypes';

import NativeWindowManager from './NativeWindowManager';

export interface WindowStatic {
  id: string;
  /** Opens the RCTWindow registered with this ID, passing initial props. */
  open(props?: UnsafeObject | null): Promise<void>;
  /** Merges props into the registered window's React root. */
  update(props?: UnsafeObject | null): Promise<void>;
  /** Closes the window and removes its scene data. */
  close(): Promise<void>;
}

export type Window = WindowStatic;

export interface WindowManagerStatic {
  getWindow(id: string): Window;
  /** Requires UIApplicationSupportsMultipleScenes in UIApplicationSceneManifest. */
  supportsMultipleScenes: boolean;
}

const WindowManager: WindowManagerStatic = {
  getWindow(id) {
    return new WindowHandle(id);
  },
  // $FlowFixMe[unsafe-getters-setters]
  get supportsMultipleScenes(): boolean {
    if (NativeWindowManager == null) {
      return false;
    }
    return NativeWindowManager.getConstants().supportsMultipleScenes || false;
  },
};

class WindowHandle implements WindowStatic {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  open(props?: UnsafeObject | null): Promise<void> {
    if (NativeWindowManager != null && NativeWindowManager.openWindow != null) {
      return NativeWindowManager.openWindow(this.id, props ?? {});
    }
    return Promise.reject(new Error('NativeWindowManager is not available'));
  }

  update(props?: UnsafeObject | null): Promise<void> {
    if (
      NativeWindowManager != null &&
      NativeWindowManager.updateWindow != null
    ) {
      return NativeWindowManager.updateWindow(this.id, props ?? {});
    }
    return Promise.reject(new Error('NativeWindowManager is not available'));
  }

  close(): Promise<void> {
    if (
      NativeWindowManager != null &&
      NativeWindowManager.closeWindow != null
    ) {
      return NativeWindowManager.closeWindow(this.id);
    }
    return Promise.reject(new Error('NativeWindowManager is not available'));
  }
}

export default WindowManager;
