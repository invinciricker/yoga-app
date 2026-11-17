/**
 * The words and pictures of the welcome's three screens (app/welcome.tsx).
 * A pure function, tested in welcome.test.ts: the second screen speaks of the whole day only once
 * Breathe, Meditate and Journal are all built, so the welcome never names a room that is not there.
 */
import type { BuildingArea } from '@/config';
import { strings } from '@/strings';
import type { AuraName } from '@/theme';

export type WelcomeSlide = {
  aura: AuraName;
  overline: string;
  title: string;
  sentence: string;
  /** The words of the gold button. */
  button: string;
  /** Whether the quiet "Skip" shows at the top right. */
  skip: boolean;
};

export function welcomeSlides(
  built: Record<BuildingArea, boolean>,
  names: { app: string; teacher: string },
): WelcomeSlide[] {
  const w = strings.welcome;
  const wholeDay = built.breathe && built.meditate && built.journal;
  return [
    { aura: 'saffron', overline: w.first.overline, title: names.app, sentence: w.first.sentence, button: w.next, skip: true },
    wholeDay
      ? {
          aura: 'tide',
          overline: w.everyDay.overline,
          title: w.everyDay.title,
          sentence: w.everyDay.sentence(names.teacher),
          button: w.next,
          skip: true,
        }
      : {
          aura: 'forest',
          overline: w.lessons.overline(names.teacher),
          title: w.lessons.title,
          sentence: w.lessons.sentence(names.teacher),
          button: w.next,
          skip: true,
        },
    { aura: 'dusk', overline: w.yours.overline, title: w.yours.title, sentence: w.yours.sentence, button: w.begin, skip: false },
  ];
}
