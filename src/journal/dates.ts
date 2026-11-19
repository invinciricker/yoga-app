/**
 * The days of the Journal in words. A day is kept as text, "2026-11-20" (the phone's own calendar);
 * it is read at its local noon, so no change of summer time can move it to another day.
 */
import { longDate } from '@/lib/billboard';

/** "2026-11-20" → the local noon of that day. */
export function noonOf(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** "Friday 20 November". */
export function longDay(day: string): string {
  return longDate(noonOf(day));
}

/** "Friday 20 November 2026": in the export, which is kept for years. */
export function longDayWithYear(day: string): string {
  return `${longDay(day)} ${noonOf(day).getFullYear()}`;
}
