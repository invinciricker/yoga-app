/**
 * What the record of the day says about lessons: done or not, when, how far into a series, and
 * the person's history (lessons and, from Phase 7, breathing). Pure functions, tested in progress.test.ts.
 *
 * Lessons no longer in the content stay in the record (they keep lighting candles and counting in
 * the totals); every list made here simply skips them.
 */
import type { BreathExercise, ContentFile, Lesson } from '../../shared/content-schema';

import { dayLabel } from '@/content/labels';
import { findLesson } from '@/content/selectors';
import { addDays, type DayEntry } from '@/day/record';
import { strings } from '@/strings';

/** The lessons done (entries of kind "move"). */
function lessonEntries(entries: readonly DayEntry[]): DayEntry[] {
  return entries.filter((e) => e.kind === 'move');
}

/** Was this lesson ever done? */
export function isDone(entries: readonly DayEntry[], slug: string): boolean {
  return entries.some((e) => e.kind === 'move' && e.ref === slug);
}

/** The latest day this lesson was done, "2026-11-16", or undefined. */
export function lastDone(entries: readonly DayEntry[], slug: string): string | undefined {
  let latest: string | undefined;
  for (const e of entries) {
    if (e.kind === 'move' && e.ref === slug && (latest === undefined || e.day > latest)) latest = e.day;
  }
  return latest;
}

export type SeriesProgress = {
  /** How many of the lessons were done (each counted once). */
  done: number;
  total: number;
  /** The first lesson, in order, not yet done. Undefined once all are done. */
  next: string | undefined;
};

/**
 * How far into a series: give the slugs of its lessons, in order (only the ones still in the
 * content: lessonsOfSeries in src/content/selectors.ts).
 */
export function seriesProgress(entries: readonly DayEntry[], lessonSlugs: readonly string[]): SeriesProgress {
  const done = new Set(lessonEntries(entries).map((e) => e.ref));
  return {
    done: lessonSlugs.filter((slug) => done.has(slug)).length,
    total: lessonSlugs.length,
    next: lessonSlugs.find((slug) => !done.has(slug)),
  };
}

/** "16 November", or "30 December 2025" when it was another year. */
function dateWords(day: string, today: string): string {
  const year = day.slice(0, 4);
  return year === today.slice(0, 4) ? dayLabel(day) : `${dayLabel(day)} ${year}`;
}

/** "Today", "Yesterday", then the date. */
function dayWords(day: string, today: string, words: { today: string; yesterday: string }): string {
  if (day === today) return words.today;
  if (day === addDays(today, -1)) return words.yesterday;
  return dateWords(day, today);
}

/** The quiet line above a lesson's bar: "Done today", "Done yesterday" or "Done on 16 November". */
export function doneLine(day: string, today: string): string {
  const l = strings.lesson;
  if (day === today) return l.doneToday;
  if (day === addDays(today, -1)) return l.doneYesterday;
  return l.doneOn(dateWords(day, today));
}

/** The saved lessons, in the order given (the most recently saved first), without the ones gone. */
export function savedLessons(content: ContentFile, saved: readonly string[]): Lesson[] {
  return saved.map((slug) => findLesson(content, slug)).filter((l): l is Lesson => l !== undefined);
}

/**
 * One line of History: a lesson, or a breathing exercise (Phase 7), and the minutes recorded for it.
 * The journal's pages are not listed here: they are read in the Journal.
 */
export type HistoryItem =
  | { key: string; kind: 'move'; lesson: Lesson; minutes: number }
  | { key: string; kind: 'breathe'; exercise: BreathExercise; minutes: number };
export type HistoryDay = { day: string; label: string; items: HistoryItem[] };

/** The line of History for one entry, or undefined when it is not listed or no longer in the content. */
function historyItem(entry: DayEntry, key: string, content: ContentFile): HistoryItem | undefined {
  if (entry.kind === 'move') {
    const lesson = findLesson(content, entry.ref);
    return lesson ? { key, kind: 'move', lesson, minutes: entry.minutes } : undefined;
  }
  if (entry.kind === 'breathe') {
    const exercise = (content.breath ?? []).find((e) => e.slug === entry.ref);
    return exercise ? { key, kind: 'breathe', exercise, minutes: entry.minutes } : undefined;
  }
  return undefined;
}

/**
 * History: the lessons done and the breathing sessions, grouped by day, the newest day first and the
 * newest first within a day. Days are labelled "Today", "Yesterday", then "16 November".
 */
export function historyDays(entries: readonly DayEntry[], content: ContentFile, today: string): HistoryDay[] {
  const sorted = entries
    .map((entry, i) => ({ entry, item: historyItem(entry, `${entry.at}-${i}`, content) }))
    .filter((x): x is { entry: DayEntry; item: HistoryItem } => x.item !== undefined)
    .sort((a, b) => (a.entry.day !== b.entry.day ? (a.entry.day < b.entry.day ? 1 : -1) : a.entry.at < b.entry.at ? 1 : -1));

  const days: HistoryDay[] = [];
  for (const { entry, item } of sorted) {
    let group = days[days.length - 1];
    if (!group || group.day !== entry.day) {
      group = { day: entry.day, label: dayWords(entry.day, today, strings.history), items: [] };
      days.push(group);
    }
    group.items.push(item);
  }
  return days;
}
