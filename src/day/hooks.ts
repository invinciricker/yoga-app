/**
 * Small hooks that read the record of the day for the screens. The answers come from the pure
 * functions of record.ts; these only connect them to the store and to today's date.
 */
import { dayOf } from '@/content/selectors';

import { streak, week, type WeekDay } from './record';
import { useDays } from './store';

/** The week card: this week's candles, the streak, and whether anything was ever done. */
export function useWeek(): { days: WeekDay[]; streak: number; ever: boolean } {
  const entries = useDays((s) => s.entries);
  const today = dayOf(new Date());
  return { days: week(entries, today), streak: streak(entries, today), ever: entries.length > 0 };
}
