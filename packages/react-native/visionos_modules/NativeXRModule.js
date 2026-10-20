/**
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../Libraries/TurboModule/RCTExport';
import type {UnsafeObject} from '../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly requestSession: (
    sessionId: string,
    userInfo: UnsafeObject,
  ) => Promise<void>;
  readonly endSession: () => Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('XRModule') as ?Spec;
