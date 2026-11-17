/**
 * The bundled fallback: a copy of the content that travels inside the app, used the very first
 * time the app is opened if the phone has no network at that moment.
 *
 * The file assets/content-fallback.json is made by `npm run content:fallback` just before the app
 * is bundled, and it is NOT kept in git. So it may be absent (a local run, the checks): then the
 * app starts from an empty content file instead of failing.
 */
import type { ContentFile } from '../../shared/content-schema';

import { strings } from '@/strings';

/** Content with nothing in it: what the app holds before anything else is known. */
export const emptyContent: ContentFile = {
  schemaVersion: 1,
  generatedAt: '',
  site: { appName: strings.app.name, teacherFirstName: strings.app.teacher },
  studio: { name: strings.app.teacher, benefits: [], classes: [], contact: {}, body: [] },
  series: [],
  lessons: [],
  journal: [],
};

/**
 * The bundled copy as it is in the file (not yet checked), or undefined when there is none.
 *
 * `require.context` asks the bundler for "every file in assets/ with this name". Unlike a plain
 * import, it does not fail when the file is missing: it simply finds nothing.
 */
export function bundledFallback(): unknown {
  try {
    // The bundler rewrites this exact call when it builds the app. Outside the bundler (the
    // tests) require.context does not exist: the call fails and we land in "catch" below.
    const files = require.context('../../assets', false, /content-fallback\.json$/);
    const [first] = files.keys();
    return first ? files(first) : undefined;
  } catch {
    return undefined;
  }
}
