/**
 * The two legal pages, as the app bundles them. Made by "npm run legal" (tools/legal/build.ts);
 * never edit the .json files by hand.
 */
import type { Block } from '../../shared/content-schema';

import licencesFile from './licences.json';
import privacyFile from './privacy.json';

export { fillPlaceholders, placeholderValues } from './fill';

export const privacyPolicy = privacyFile as { title: string; updated: string; blocks: Block[] };
export const licences = licencesFile as { libraries: { name: string; licence: string }[]; fonts: { name: string; licence: string }[] };
