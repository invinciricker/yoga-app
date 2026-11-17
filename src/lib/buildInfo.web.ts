/**
 * The web preview has no build and no over-the-air update: only the version.
 */
import Constants from 'expo-constants';

import type { BuildInfo } from './version';

export function buildInfo(): BuildInfo {
  return { where: 'web', version: Constants.expoConfig?.version ?? '' };
}
