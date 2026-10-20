/** @format */

export interface WindowStatic {
  id: string;
  /**
   * Opens the RCTWindow registered with this ID, passing initial props.
   * Reopening the same ID reuses its window and shallowly merges supplied props.
   * Null and undefined prop values are ignored.
   */
  open(props?: object | null): Promise<void>;
  /**
   * Shallowly merges props into the registered window's React root.
   * Null and undefined prop values do not clear or override existing props.
   * An omitted or null payload is an empty update.
   */
  update(props?: object | null): Promise<void>;
  close(): Promise<void>;
}

export type Window = WindowStatic;

export interface WindowManagerStatic {
  getWindow(id: string): Window;
  /** Requires UIApplicationSupportsMultipleScenes in UIApplicationSceneManifest. */
  supportsMultipleScenes: boolean;
}

export const WindowManager: WindowManagerStatic;
export type WindowManager = WindowManagerStatic;
