/** @format */

export interface XRStatic {
  /** Opens a registered SwiftUI ImmersiveSpace on visionOS. */
  requestSession(sessionId: string, userInfo?: object | null): Promise<void>;
  /** Dismisses the current immersive space. */
  endSession(): Promise<void>;
}

export const XR: XRStatic;
export type XR = XRStatic;
