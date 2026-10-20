/**
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../Libraries/TurboModule/RCTExport';
import type {UnsafeObject} from '../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../Libraries/TurboModule/TurboModuleRegistry';

export type WindowManagerConstants = {
  readonly supportsMultipleScenes?: boolean,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => WindowManagerConstants;
  readonly openWindow: (
    windowId: string,
    userInfo: UnsafeObject,
  ) => Promise<void>;
  readonly updateWindow: (
    windowId: string,
    userInfo: UnsafeObject,
  ) => Promise<void>;
  readonly closeWindow: (windowId: string) => Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('WindowManager') as ?Spec;
