/**
 * The greeting on Today follows the clock.
 *   before 12:00      → morning
 *   12:00 to 16:59    → afternoon
 *   from 17:00        → evening
 * A pure function: give it a date, get the words. Tested in greeting.test.ts.
 */
import { strings } from '@/strings';

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export const AFTERNOON_STARTS = 12;
export const EVENING_STARTS = 17;

export function partOfDay(date: Date): PartOfDay {
  const hour = date.getHours(); // the phone's local time
  if (hour < AFTERNOON_STARTS) return 'morning';
  if (hour < EVENING_STARTS) return 'afternoon';
  return 'evening';
}

export type Greeting = {
  part: PartOfDay;
  /** The small label above, for example "Monday evening". */
  overline: string;
  /** First line, for example "Good evening." */
  hello: string;
  /** Second line, in italics, for example "Let the day settle." */
  line: string;
};

export function greetingFor(date: Date): Greeting {
  const part = partOfDay(date);
  const words = strings.today[part];
  return {
    part,
    overline: `${strings.today.weekdays[date.getDay()]} ${words.part}`,
    hello: words.hello,
    line: words.line,
  };
}
