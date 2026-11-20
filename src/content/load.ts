/**
 * Loading the content: the saved copy first, then a fresh download.
 *
 *   1. read the saved copy from the phone; if there is none, use the copy bundled in the app;
 *   2. show it (the store does this);
 *   3. download the file, waiting 6 seconds at most;
 *   4. check it against the contract (shared/content-schema.ts). Only a file that passes replaces
 *      the saved copy. Anything else (no network, a server error, a broken file) changes nothing.
 *
 * Nothing here ever throws to a screen.
 */
import { auraNames, contentFile, type ContentFile } from '../../shared/content-schema';

import { CONTENT_TIMEOUT_MS, CONTENT_URL } from '@/config';
import { readJson, storageKeys, writeJson } from '@/lib/storage';
import { auraForSlug } from '@/theme';

import { bundledFallback } from './fallback';

/**
 * An aura this version of the app does not know (added after it was released) becomes a stable
 * pick from the five it does know, by the slug. Done before the check, on the raw file.
 */
export function withKnownAuras(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw;
  const file = raw as Record<string, unknown>;
  const fix = (list: unknown) =>
    Array.isArray(list)
      ? list.map((item) => {
          if (item === null || typeof item !== 'object') return item;
          const { slug, aura } = item as { slug?: unknown; aura?: unknown };
          const known = typeof aura === 'string' && (auraNames as readonly string[]).includes(aura);
          return known || typeof slug !== 'string' ? item : { ...item, aura: auraForSlug(slug) };
        })
      : list;
  return { ...file, lessons: fix(file.lessons), series: fix(file.series), journal: fix(file.journal) };
}

/** Checks a file against the contract. Unknown fields are ignored; a wrong file gives undefined. */
export function accept(raw: unknown): ContentFile | undefined {
  const checked = contentFile.safeParse(withKnownAuras(raw));
  return checked.success ? checked.data : undefined;
}

/** Step 1: the saved copy, or else the bundled one, or else nothing. */
export async function loadSaved(): Promise<ContentFile | undefined> {
  return accept(await readJson(storageKeys.content)) ?? accept(bundledFallback());
}

/**
 * Steps 3 and 4: downloads the file. Gives the new content (already saved on the phone),
 * or undefined when the refresh failed for any reason.
 */
export async function fetchFresh(
  url: string = CONTENT_URL,
  timeoutMs: number = CONTENT_TIMEOUT_MS,
): Promise<ContentFile | undefined> {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), timeoutMs);
  try {
    // "no-cache": always ask the server whether the file changed, never trust an old copy blindly.
    const response = await fetch(url, { cache: 'no-cache', signal: stop.signal });
    if (!response.ok) return undefined;
    const raw: unknown = await response.json();
    const fresh = accept(raw);
    // Save the file as it came, not as we read it: a newer app may understand more of it.
    if (fresh) await writeJson(storageKeys.content, raw);
    return fresh;
  } catch {
    return undefined; // no network, too slow, or not JSON
  } finally {
    clearTimeout(timer);
  }
}

/**
 * For the web preview only: the pages to prepare when the website is built (one file per lesson,
 * series or note), read from the bundled copy. On a phone this is never called.
 * "journal" is the key of Maria's notes in content.json, a permanent data name (docs/V2.md).
 */
export function slugsForStaticPages(kind: 'lessons' | 'series' | 'journal' | 'guidedJournals' | 'breath'): { slug: string }[] {
  const content = accept(bundledFallback());
  return content ? (content[kind] ?? []).map((item) => ({ slug: item.slug })) : [];
}
