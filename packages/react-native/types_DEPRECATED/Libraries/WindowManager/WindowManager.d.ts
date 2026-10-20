/** @format */

export interface WindowStatic {
  id: string;
  open(props?: object | null): Promise<void>;
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
