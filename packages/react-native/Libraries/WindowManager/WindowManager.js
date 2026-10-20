/**
 * @flow strict-local
 * @format
 */

import type {UnsafeObject} from '../Types/CodegenTypes';

import NativeWindowManager from './NativeWindowManager';

export interface WindowStatic {
  id: string;
  /**
   * Opens the RCTWindow registered with this ID, passing initial props.
   * Reopening the same ID reuses its window and shallowly merges supplied props.
   * Null and undefined prop values are ignored.
   */
  open(props?: UnsafeObject | null): Promise<void>;
  /**
   * Shallowly merges props into the registered window's React root.
   * Null and undefined prop values do not clear or override existing props.
   * An omitted or null payload is an empty update.
   */
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

function normalizeProps(props?: UnsafeObject | null): UnsafeObject {
  // The default TurboModule conversion omits null/undefined object values.
  // Make this root-prop contract explicit before crossing the native boundary.
  return Object.fromEntries(
    Object.entries(props ?? {}).filter(([, value]) => value != null),
  );
}

class WindowHandle implements WindowStatic {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  open(props?: UnsafeObject | null): Promise<void> {
    if (NativeWindowManager != null && NativeWindowManager.openWindow != null) {
      return NativeWindowManager.openWindow(this.id, normalizeProps(props));
    }
    return Promise.reject(new Error('NativeWindowManager is not available'));
  }

  update(props?: UnsafeObject | null): Promise<void> {
    if (
      NativeWindowManager != null &&
      NativeWindowManager.updateWindow != null
    ) {
      return NativeWindowManager.updateWindow(this.id, normalizeProps(props));
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
