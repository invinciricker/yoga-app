/**
 * The words shown for what the content files say: levels, focus areas, minutes, dates.
 * Pure functions, so they are easy to test.
 */
import type { Lesson } from '../../shared/content-schema';

import { strings } from '@/strings';

/** "gentle" → "Gentle". */
export function levelLabel(level: Lesson['level']): string {
  return strings.levels[level];
}

/**
 * "whole-body" → "Whole body". A word this version of the app does not know (added to the
 * content after it was released) is shown as it is, with a capital: "wrists" → "Wrists".
 */
export function focusLabel(focus: string): string {
  const known = (strings.focus as Record<string, string>)[focus];
  return known ?? focus.charAt(0).toUpperCase() + focus.slice(1);
}

/** "12 min · Gentle", for covers and cards. */
export function lessonMeta(lesson: Pick<Lesson, 'minutes' | 'level'>): string {
  return `${strings.common.minutes(lesson.minutes)} · ${levelLabel(lesson.level)}`;
}

/** "12 min · Gentle · Hips", for rows: the first focus only. */
export function lessonMetaLong(lesson: Pick<Lesson, 'minutes' | 'level' | 'focus'>): string {
  const first = lesson.focus[0];
  return first ? `${lessonMeta(lesson)} · ${focusLabel(first)}` : lessonMeta(lesson);
}

/** "Hips, back, sleep": every focus on one line, only the first with a capital. */
export function focusLine(focus: string[]): string {
  return focus.map((f, i) => (i === 0 ? focusLabel(f) : focusLabel(f).toLowerCase())).join(', ');
}

/** "2026-11-16" → "16 November". Read from the text itself, so no time zone can shift the day. */
export function dayLabel(day: string): string {
  const [, month, date] = day.split('-').map(Number);
  const name = strings.common.months[month - 1];
  return name && date ? `${date} ${name}` : day;
}

/** "3:45" → 225 seconds; "1:02:03" → 3723. Undefined when it is not a time. */
export function secondsOf(at: string | undefined): number | undefined {
  if (!at || !/^\d{1,2}(:[0-5]\d){1,2}$/.test(at)) return undefined;
  return at.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}
