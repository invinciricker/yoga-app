/**
 * Today's Move suggestion: the big card on Home (docs/V2.md: one suggestion per area, never a list).
 *
 *   1. the next lesson of a series that is begun, not finished, and practised in the last 7 days
 *      (the one practised most recently, if there are several);
 *   2. else the featured lesson;
 *   3. else the newest.
 *
 * It is chosen from what was done BEFORE today, so once its lesson is done today the card stays
 * where it is, with a tick, instead of jumping to the next one. Tested in todayMove.test.ts.
 */
import type { ContentFile, Lesson, Series } from '../../shared/content-schema';

import { dayOf, featuredLesson, lessonsOfSeries, placeInSeries } from '@/content/selectors';
import { seriesProgress } from '@/practice/progress';

import { addDays, type DayEntry } from './record';

/** "The last 7 days": today and the six days before. */
export const SERIES_FRESH_DAYS = 7;

export type MoveSuggestion = {
  lesson: Lesson;
  /** When the lesson continues a series (or simply belongs to one): "Seven evenings of rest · 3 of 7". */
  series?: { series: Series; position: number; count: number };
  /** Its lesson was done today: the card shows the tick and "Done today". */
  doneToday: boolean;
};

/** The series to continue, chosen from the lessons done before today. */
function seriesToContinue(content: ContentFile, before: readonly DayEntry[], today: string): Lesson | undefined {
  const since = addDays(today, -(SERIES_FRESH_DAYS - 1));
  let best: { lesson: Lesson; last: string } | undefined;
  for (const series of content.series) {
    const lessons = lessonsOfSeries(content, series.slug);
    const slugs = lessons.map((l) => l.slug);
    const progress = seriesProgress(before, slugs);
    const next = lessons.find((l) => l.slug === progress.next);
    if (progress.done === 0 || !next) continue; // not begun, or finished
    const last = before.filter((e) => slugs.includes(e.ref)).reduce((latest, e) => (e.day > latest ? e.day : latest), '');
    if (last < since) continue; // not practised in the last 7 days
    if (!best || last > best.last) best = { lesson: next, last };
  }
  return best?.lesson;
}

export function todayMove(content: ContentFile, entries: readonly DayEntry[], now: Date): MoveSuggestion | undefined {
  const today = dayOf(now);
  const lessonsDone = entries.filter((e) => e.kind === 'move');
  const before = lessonsDone.filter((e) => e.day < today);
  const continued = seriesToContinue(content, before, today);
  const lesson = continued ?? featuredLesson(content, now);
  if (!lesson) return undefined;
  const place = continued ? placeInSeries(content, lesson) : undefined;
  return {
    lesson,
    series: place,
    doneToday: lessonsDone.some((e) => e.day === today && e.ref === lesson.slug),
  };
}
