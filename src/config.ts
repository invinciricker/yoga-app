/**
 * Public settings of the app, in one place.
 *
 * Nothing here is secret: this repository is public and so are these addresses.
 */
import { variant } from '@/lib/variant';

/**
 * Where the app downloads Maria's content from (GitHub Pages, built from content/ by the
 * "Pages" workflow).
 *
 * THIS ADDRESS IS PERMANENT ONCE THE APP IS IN THE STORE: it is inside every installed copy,
 * and people keep old versions for months. Never rename the repository or the GitHub account
 * after the release. The "v1" belongs to the format (shared/content-schema.ts): a breaking
 * change would be published next to it as v2, while v1 keeps being built.
 */
export const CONTENT_BASE = 'https://invinciricker.github.io/yoga-app/content/v1/';

/** The preview app (and the web preview) also shows drafts; the public app never does. */
export const CONTENT_FILE = variant === 'preview' ? 'preview.json' : 'content.json';

/** The full address of the file the app downloads. */
export const CONTENT_URL = CONTENT_BASE + CONTENT_FILE;

/** How long the app waits for the download before it keeps working from its saved copy. */
export const CONTENT_TIMEOUT_MS = 6000;

/**
 * Which areas are built. A tab whose area is false is hidden in the public app; the preview app
 * shows a quiet placeholder instead ("This room is being built."). Each later phase turns its area
 * to true: Breathe in Phase 7, Meditate in Phase 8, Journal in Phase 5.
 */
export type BuildingArea = 'breathe' | 'meditate' | 'journal';
export const areas: Record<BuildingArea, boolean> = { breathe: false, meditate: false, journal: false };
