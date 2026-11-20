/**
 * Sample progress, for checking the screens (docs/phases/phase-4.md, "Sample progress"): four days
 * in a row ending today, two lessons of a series done, one lesson saved, one answer. Made from the
 * content of the moment. Shown in memory only, never saved (src/practice/demo.ts).
 * Today's lesson counts 25 minutes (docs/phases/phase-6.md, section 5), so the Health journal's
 * "How much did you move today?" shows its answer filled in from today's practice.
 *
 * Phase 7: also a 3-minute "Long exhale" yesterday (History shows it), and nothing breathed today
 * (Today offers its Breathe card).
 *
 * The saved lesson is one not done, so its bookmark shows in the lists (a tick would hide it).
 * The last two days use other lessons when there are some, else the series' two again.
 */
import type { ContentFile, Lesson } from '../../shared/content-schema';

import { lessonsOfSeries, newestLessons } from '@/content/selectors';
import { addDays, type DayEntry } from '@/day/record';

import type { Practice } from './types';

/** The minutes of today's sample lesson: enough for "20 minutes or more". */
export const SAMPLE_TODAY_MINUTES = 25;

/** A lesson that does not exist, for content with no lessons at all: lists simply skip it. */
const nothing = { slug: 'sample-lesson', minutes: 12 };

/** The minutes of yesterday's sample breathing session. */
export const SAMPLE_BREATH_MINUTES = 3;

export function sampleProgress(content: ContentFile, today: string): { entries: DayEntry[]; practice: Practice } {
  // The first series with two lessons or more: its first two are done.
  const series = content.series.map((s) => lessonsOfSeries(content, s.slug)).find((lessons) => lessons.length >= 2) ?? [];
  const inSeries = series.slice(0, 2);
  const others = newestLessons(content, content.lessons.length).filter((l) => !inSeries.includes(l));
  const pick = (...choices: (Lesson | undefined)[]) => choices.find((l) => l !== undefined) ?? nothing;
  // The saved one: the oldest of the other lessons, kept out of the days done.
  const saved = others[others.length - 1];
  const free = others.filter((l) => l !== saved);

  // Four days in a row, ending today.
  const days: { lesson: { slug: string; minutes: number }; ago: number }[] = [
    { lesson: pick(inSeries[0], free[0], saved), ago: 3 },
    { lesson: pick(inSeries[1], free[1], free[0], saved), ago: 2 },
    { lesson: pick(free[0], inSeries[0], saved), ago: 1 },
    { lesson: pick(free[1], free[0], inSeries[0], saved), ago: 0 },
  ];
  const entries = days.map(({ lesson, ago }): DayEntry => {
    const day = addDays(today, -ago);
    return { day, kind: 'move', ref: lesson.slug, minutes: ago === 0 ? SAMPLE_TODAY_MINUTES : lesson.minutes, at: `${day}T18:30:00.000Z` };
  });

  // Yesterday evening, three minutes of Long exhale (or of the first exercise there is).
  const exercises = content.breath ?? [];
  const breath = exercises.find((e) => e.slug === 'long-exhale') ?? exercises[0];
  if (breath) {
    const yesterday = addDays(today, -1);
    entries.push({ day: yesterday, kind: 'breathe', ref: breath.slug, minutes: SAMPLE_BREATH_MINUTES, at: `${yesterday}T20:15:00.000Z` });
  }

  const answered = pick(inSeries[1], inSeries[0], others[0]).slug;
  return {
    entries,
    practice: {
      saved: [pick(saved, inSeries[0]).slug],
      reactions: { [answered]: { difficulty: 'right', feeling: 'calmer', at: `${addDays(today, -2)}T18:45:00.000Z`, sent: false } },
    },
  };
}
