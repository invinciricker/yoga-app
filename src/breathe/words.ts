/**
 * The words of a breathing exercise: a step's word ("In", "Top up"), how ("through the nose",
 * "left side"), the round in short ("In 2 · Top up 1 · Out 6"), a step in words ("In · 4 seconds ·
 * through the nose"), and which exercise to offer now. Pure functions, tested in words.test.ts.
 */
import type { BreathExercise, BreathStep, EvidenceLevel } from '../../shared/content-schema';

import type { DayEntry } from '@/day/record';
import { partOfDay } from '@/lib/greeting';
import { strings } from '@/strings';

type StepWords = Pick<BreathStep, 'do' | 'seconds' | 'via' | 'side' | 'label'>;

/** The big word of a step: its label, or "In", "Hold", "Out". */
export function stepWord(step: StepWords): string {
  return step.label ?? strings.breathe.word[step.do];
}

/** The small line under the word: "left side" or "right side", else "through the nose" or "through the mouth". */
export function stepWay(step: StepWords): string | undefined {
  if (step.side) return strings.breathe.side[step.side];
  if (step.via) return strings.breathe.via[step.via];
  return undefined;
}

/** "In 4 · Out 6", "In 2 · Top up 1 · Out 6". */
export function roundInShort(steps: readonly StepWords[]): string {
  return steps.map((step) => strings.breathe.short(stepWord(step), step.seconds)).join(' · ');
}

/** "In · 4 seconds · through the nose", "In · 4 seconds · through the nose · left side". */
export function stepLine(step: StepWords): string {
  const parts = [stepWord(step), strings.breathe.seconds(step.seconds)];
  if (step.via) parts.push(strings.breathe.via[step.via]);
  if (step.side) parts.push(strings.breathe.side[step.side]);
  return parts.join(' · ');
}

/** The level of evidence in plain words, or undefined when this version does not know it. */
export function levelWords(level: EvidenceLevel | undefined): { title: string; line: string } | undefined {
  return level ? strings.breathe.levels[level] : undefined;
}

/** By `order`, then by slug. */
export function byOrder(exercises: readonly BreathExercise[]): BreathExercise[] {
  return [...exercises].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/**
 * The one exercise to offer now (the Breathe tab's suggestion and Today's card): the first by
 * order whose `suggest` holds the part of the day (morning before 12, afternoon to 17, evening
 * after), else the first by order. Undefined when there is none.
 */
export function breatheNow(exercises: readonly BreathExercise[], date: Date): BreathExercise | undefined {
  const sorted = byOrder(exercises);
  const part = partOfDay(date);
  return sorted.find((exercise) => exercise.suggest.includes(part)) ?? sorted[0];
}

/** Was anything breathed on this day? */
export function breathedOn(entries: readonly DayEntry[], day: string): boolean {
  return entries.some((e) => e.kind === 'breathe' && e.day === day);
}
