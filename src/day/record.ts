/**
 * The record of the day: one list of the things a person did, each on one local calendar day.
 * A day's candle is lit as soon as anything is done on it (docs/V2.md, "One day, four small things").
 * Lessons write "move" entries, the Journal "write" entries (Phase 5), Breathe "breathe" entries
 * (Phase 7); Meditate will write "sit" entries.
 *
 * Pure functions only: give them the list and today's day, get an answer. Tested in record.test.ts.
 * Days are "YYYY-MM-DD" text in the phone's own calendar (dayOf in src/content/selectors.ts) and are
 * compared as text. Never through UTC timestamps: a streak would break at midnight otherwise.
 */
import type { BuildingArea } from '@/config';
import { strings } from '@/strings';

/** What kind of thing was done: a lesson, a breathing exercise, a sitting, a page written. */
export type DayKind = 'move' | 'breathe' | 'sit' | 'write';
export const dayKinds: readonly DayKind[] = ['move', 'breathe', 'sit', 'write'];

/** One thing done on one local day. On the phone only, never sent. */
export type DayEntry = {
  /** The phone's calendar day, "2026-11-17". */
  day: string;
  kind: DayKind;
  /** What it was: for "move", the lesson's slug; for "breathe", the exercise's slug. */
  ref: string;
  /** Whole minutes, at least 1. */
  minutes: number;
  /** When it was recorded (ISO time). */
  at: string;
};

/** "2026-11-17" → the local noon of that day. Noon, so no change of summer time can move the day. */
function noonOf(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** The local calendar day of a moment (the same as dayOf in src/content/selectors.ts). */
function dayText(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** The day `n` days after (or before, with a negative n): addDays("2026-11-30", 1) = "2026-12-01". */
export function addDays(day: string, n: number): string {
  const date = noonOf(day);
  date.setDate(date.getDate() + n);
  return dayText(date);
}

/** The days on which something was done (each once). */
function litDays(entries: readonly DayEntry[]): Set<string> {
  return new Set(entries.map((e) => e.day));
}

/**
 * How many days in a row have something done, ending today, or ending yesterday when nothing is
 * recorded yet today (the candle burns until midnight). 0 otherwise.
 */
export function streak(entries: readonly DayEntry[], today: string): number {
  const lit = litDays(entries);
  let day = lit.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (lit.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/** The longest run of days in a row with something done, ever. */
export function longestStreak(entries: readonly DayEntry[]): number {
  const days = [...litDays(entries)].sort();
  let longest = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && addDays(days[i - 1], 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}

/** One day of the week card. */
export type WeekDay = {
  day: string;
  /** "M", "T", "W"… */
  letter: string;
  /** Something was done that day: its candle is lit. */
  lit: boolean;
  isToday: boolean;
  /** A day still to come this week. */
  isFuture: boolean;
};

/** The seven days of the current week, Monday to Sunday. */
export function week(entries: readonly DayEntry[], today: string): WeekDay[] {
  const lit = litDays(entries);
  // getDay(): 0 is Sunday. Days since Monday: Monday 0 … Sunday 6.
  const sinceMonday = (noonOf(today).getDay() + 6) % 7;
  const monday = addDays(today, -sinceMonday);
  return strings.week.letters.map((letter, i) => {
    const day = addDays(monday, i);
    return { day, letter, lit: lit.has(day), isToday: day === today, isFuture: day > today };
  });
}

/** What You shows: the days with something done, every minute, and the lessons done. */
export type Totals = { days: number; minutes: number; lessons: number };

/** The same lesson done twice in a day counts twice in minutes and in lessons (one candle). */
export function totals(entries: readonly DayEntry[]): Totals {
  return {
    days: litDays(entries).size,
    minutes: entries.reduce((sum, e) => sum + e.minutes, 0),
    lessons: entries.filter((e) => e.kind === 'move').length,
  };
}

/** Which tab builds which kind. "move" (the lessons) is always built. */
const areaOfKind: Record<Exclude<DayKind, 'move'>, BuildingArea> = { breathe: 'breathe', sit: 'meditate', write: 'journal' };

/**
 * The one hand-off a closing screen may offer, or nothing: the first kind after the one just done
 * (in the order move → breathe → sit → write) that is built and not yet done today. Nothing after
 * write. `built` is `areas` from src/config.ts.
 */
export function nextStep(
  justDone: DayKind,
  entries: readonly DayEntry[],
  today: string,
  built: Readonly<Record<BuildingArea, boolean>>,
): Exclude<DayKind, 'move'> | undefined {
  const after = dayKinds.slice(dayKinds.indexOf(justDone) + 1) as Exclude<DayKind, 'move'>[];
  const doneToday = new Set(entries.filter((e) => e.day === today).map((e) => e.kind));
  return after.find((kind) => built[areaOfKind[kind]] && !doneToday.has(kind));
}

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The saved list, read back from the phone. Anything that is not a whole, sensible entry (a broken
 * file, a kind this version does not know) is left out instead of breaking the app.
 */
export function parseEntries(raw: unknown): DayEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown): DayEntry[] => {
    if (typeof item !== 'object' || item === null) return [];
    const e = item as Record<string, unknown>;
    const ok =
      typeof e.day === 'string' &&
      dayPattern.test(e.day) &&
      typeof e.kind === 'string' &&
      (dayKinds as readonly string[]).includes(e.kind) &&
      typeof e.ref === 'string' &&
      typeof e.minutes === 'number' &&
      Number.isFinite(e.minutes) &&
      typeof e.at === 'string';
    if (!ok) return [];
    return [{ day: e.day as string, kind: e.kind as DayKind, ref: e.ref as string, minutes: Math.max(1, Math.round(e.minutes as number)), at: e.at as string }];
  });
}

/** The entry a finished lesson writes, on the day of `now` (the moment its closing screen opens). */
export function lessonEntry(lesson: { slug: string; minutes: number }, now: Date): DayEntry {
  return { day: dayText(now), kind: 'move', ref: lesson.slug, minutes: Math.max(1, Math.round(lesson.minutes)), at: now.toISOString() };
}

/**
 * The entry a breathing session writes, on the day of `now` (the moment its closing screen opens,
 * so a session that ends after midnight counts on the day it ended, like a lesson). `minutes` is
 * the whole minutes breathed, at least 1. `at` names the session: the closing screen writes only
 * when no entry has it yet, so opening it again never writes twice.
 */
export function breatheEntry(slug: string, minutes: number, now: Date, at: string = now.toISOString()): DayEntry {
  return { day: dayText(now), kind: 'breathe', ref: slug, minutes: Math.max(1, Math.round(minutes)), at };
}
