/**
 * Selectors: small pure functions that answer "what do I show?" from the content.
 * No React, no storage: give them the content, get a list back. Tested in selectors.test.ts.
 */
import type { ContentFile, JournalEntry, Lesson, Level, Series } from '../../shared/content-schema';

import { focusLabel } from './labels';

/** A local calendar day as "2026-11-16". Never through UTC: the day must be the phone's day. */
export function dayOf(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** Newest first, then by title: the order used everywhere. */
function byNewest<T extends { published: string; title: string }>(a: T, b: T): number {
  if (a.published !== b.published) return a.published < b.published ? 1 : -1;
  return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

export function findLesson(content: ContentFile, slug: string | undefined): Lesson | undefined {
  return content.lessons.find((l) => l.slug === slug);
}
export function findSeries(content: ContentFile, slug: string | undefined): Series | undefined {
  return content.series.find((s) => s.slug === slug);
}
/**
 * Maria's tips and notes. In the content they are still called "journal" (content/journal/ and the
 * key `journal` in content.json): those data names are permanent (docs/V2.md). Everywhere else they
 * are "notes"; "journal" now means the person's own journal.
 */
export function findNote(content: ContentFile, slug: string | undefined): JournalEntry | undefined {
  return content.journal.find((j) => j.slug === slug);
}

/**
 * The lesson of the big card on Today: the newest one marked "featured", else the newest.
 * A lesson dated after today waits for its day, unless there is nothing else to show.
 */
export function featuredLesson(content: ContentFile, now: Date): Lesson | undefined {
  const today = dayOf(now);
  const sorted = [...content.lessons].sort(byNewest);
  const arrived = sorted.filter((l) => l.published <= today);
  const pool = arrived.length > 0 ? arrived : sorted;
  return pool.find((l) => l.featured) ?? pool[0];
}

/** The newest lessons, for "New from Maria": five at most, without the one already on the big card. */
export function newestLessons(content: ContentFile, count = 5, exceptSlug?: string): Lesson[] {
  return [...content.lessons]
    .sort(byNewest)
    .filter((l) => l.slug !== exceptSlug)
    .slice(0, count);
}

/** The lessons of a series, in the order the series gives. A slug that is gone is skipped. */
export function lessonsOfSeries(content: ContentFile, seriesSlug: string): Lesson[] {
  const series = findSeries(content, seriesSlug);
  if (!series) return [];
  return series.lessons.map((slug) => findLesson(content, slug)).filter((l): l is Lesson => l !== undefined);
}

/** Where a lesson sits in its series: "2 of 7". Undefined when it has no series (or it is gone). */
export function placeInSeries(
  content: ContentFile,
  lesson: Lesson,
): { series: Series; position: number; count: number } | undefined {
  const series = findSeries(content, lesson.series);
  if (!series) return undefined;
  const index = series.lessons.indexOf(lesson.slug);
  return index < 0 ? undefined : { series, position: index + 1, count: series.lessons.length };
}

/** The minutes of a series, all lessons together. */
export function seriesMinutes(content: ContentFile, seriesSlug: string): number {
  return lessonsOfSeries(content, seriesSlug).reduce((total, l) => total + l.minutes, 0);
}

// How far into a series the person is: seriesProgress in src/practice/progress.ts (Phase 4).

/**
 * docs/V2.md, limit 3: no search and no filter on a list of fewer than 8 items. Practice counts its
 * lessons, Notes counts its notes.
 */
export const FILTERS_FROM = 8;

/** The choices of the filter row on Practice. One at a time. */
export type LessonFilter = 'all' | 'saved' | Level | 'short';
/** "Under 15 min". */
export const SHORT_MINUTES = 15;

/**
 * Search and filter for Practice. Every word typed must be found in the title, the summary
 * or the focus of a lesson. Capitals do not matter. Newest first. "saved" keeps the lessons whose
 * slugs are given in `saved`.
 */
export function searchLessons(
  content: ContentFile,
  query: string,
  filter: LessonFilter = 'all',
  saved: readonly string[] = [],
): Lesson[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return [...content.lessons].sort(byNewest).filter((lesson) => {
    if (filter === 'short' && lesson.minutes >= SHORT_MINUTES) return false;
    if (filter === 'saved' && !saved.includes(lesson.slug)) return false;
    if (filter !== 'all' && filter !== 'short' && filter !== 'saved' && lesson.level !== filter) return false;
    if (words.length === 0) return true;
    const haystack = [lesson.title, lesson.summary, ...lesson.focus, ...lesson.focus.map(focusLabel)]
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

/** The newest of Maria's notes that has a saying of hers, for "A note from Maria" on Today. */
export function latestQuote(content: ContentFile): JournalEntry | undefined {
  return [...content.journal].sort(byNewest).find((entry) => !!entry.quote);
}

/** Maria's tips and notes, newest first, all of them or one kind. */
export function notesOfKind(content: ContentFile, kind: 'all' | JournalEntry['kind'] = 'all'): JournalEntry[] {
  return [...content.journal].sort(byNewest).filter((entry) => kind === 'all' || entry.kind === kind);
}
