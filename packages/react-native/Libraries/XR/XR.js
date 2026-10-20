/**
 * @flow strict-local
 * @format
 */

import type {UnsafeObject} from '../Types/CodegenTypes';

import NativeXRModule from './NativeXRModule';

export interface XRStatic {
  /**
   * Opens the SwiftUI ImmersiveSpace registered with this ID on visionOS.
   * The app must enable multiple scenes in UIApplicationSceneManifest.
   * Resolves when opened; rejects if unavailable, cancelled, or already open.
   */
  requestSession(
    sessionId: string,
    userInfo?: UnsafeObject | null,
  ): Promise<void>;
  /** Dismisses the current immersive space. */
  endSession(): Promise<void>;
}

const XR: XRStatic = {
  requestSession(sessionId, userInfo) {
    if (NativeXRModule != null && NativeXRModule.requestSession != null) {
      return NativeXRModule.requestSession(sessionId, userInfo ?? {});
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
  endSession() {
    if (NativeXRModule != null && NativeXRModule.endSession != null) {
      return NativeXRModule.endSession();
    }
    return Promise.reject(new Error('NativeXRModule is not available'));
  },
};

export default XR;
