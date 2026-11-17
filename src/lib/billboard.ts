/**
 * The billboard at the top of Home: Maria, her next class, today's date, and whether to show it
 * at all today. Pure functions: give them values, get answers. Tested in billboard.test.ts.
 */
import type { Studio } from '../../shared/content-schema';

import { strings } from '@/strings';

export type StudioClass = Studio['classes'][number];

/** The weekdays of the content, in the order of Date.getDay() (Sunday is 0). */
const weekdayKeys: StudioClass['day'][] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYS_IN_WEEK = 7;

/** "18:30" → [18, 30]; undefined when the time cannot be read. */
function clock(text: string): [number, number] | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!m) return undefined;
  const [hour, minute] = [Number(m[1]), Number(m[2])];
  return hour < 24 && minute < 60 ? [hour, minute] : undefined;
}

/**
 * The next class from now, on the phone's own clock: later today, else the coming days, wrapping
 * round the week. A class that starts this very minute still counts. Nothing when there are no classes.
 */
export function nextClass(classes: StudioClass[], now: Date): { item: StudioClass; at: Date } | undefined {
  let best: { item: StudioClass; at: Date } | undefined;
  for (const item of classes) {
    const time = clock(item.start);
    const weekday = weekdayKeys.indexOf(item.day);
    if (!time || weekday < 0) continue;
    const ahead = (weekday - now.getDay() + DAYS_IN_WEEK) % DAYS_IN_WEEK;
    // Built from the calendar date (not by adding hours), so a change of summer time cannot shift it.
    let at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead, time[0], time[1]);
    const thisMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    if (at < thisMinute) {
      at = new Date(at.getFullYear(), at.getMonth(), at.getDate() + DAYS_IN_WEEK, time[0], time[1]);
    }
    if (!best || at < best.at) best = { item, at };
  }
  return best;
}

/** "Tuesday 17 November". */
export function longDate(date: Date): string {
  return `${strings.today.weekdays[date.getDay()]} ${date.getDate()} ${strings.common.months[date.getMonth()]}`;
}

/** The billboard shows the first time the app is opened on a calendar day ("2026-11-17"). */
export function showBillboard(lastDay: string | undefined, today: string): boolean {
  return lastDay !== today;
}
