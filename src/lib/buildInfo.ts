/**
 * What Expo says about the copy of the app that is running (see version.ts for the words).
 * The web preview has its own version: buildInfo.web.ts.
 */
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import type { BuildInfo } from './version';

export function buildInfo(): BuildInfo {
  return {
    where: 'phone',
    version: Constants.expoConfig?.version ?? '',
    embedded: Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt ?? undefined,
    runtimeVersion: Updates.runtimeVersion ?? undefined,
  };
}
