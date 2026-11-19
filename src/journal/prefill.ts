/**
 * A choice filled in from today's lessons (docs/phases/phase-6.md, 1.6): "How much did you move
 * today?" already says "20 minutes or more" when a lesson of 25 minutes was marked done today.
 *
 *   - Only on a page of today (written today, or being written today), only on a question with no
 *     answer, and never once the person tapped it away or picked something else on that page.
 *   - It is a suggestion until the page is kept: it is saved with the page's next answer, or by
 *     "Done". On its own it does not make a page written.
 *   - It never replaces an answer.
 *
 * The first case of the rule "what is done in one area is known in the others without asking"
 * (docs/V2.md). Phases 7 and 8 may add other `from`; this version only knows `lessons-today`.
 * Pure functions. Tested in prefill.test.ts.
 */
import type { GuidedPrompt } from '../../shared/content-schema';

import type { DayEntry } from '@/day/record';

import { isVisible } from './guided';
import { isEmptyValue, type Answer } from './types';

type Choice = Extract<GuidedPrompt, { kind: 'choice' }>;

/** The minutes of the lessons marked done on a day (the record of the day, "move"). */
export function lessonMinutes(days: readonly DayEntry[], day: string): number {
  return days.filter((e) => e.kind === 'move' && e.day === day).reduce((sum, e) => sum + e.minutes, 0);
}

/** The option a choice suggests for so many minutes of lessons: the highest rule reached, or undefined. */
export function suggestedOption(prompt: GuidedPrompt, minutes: number): string | undefined {
  if (prompt.kind !== 'choice' || prompt.many || !prompt.prefill || prompt.prefill.from !== 'lessons-today') return undefined;
  let best: { atLeast: number; option: string } | undefined;
  for (const rule of prompt.prefill.pick) {
    if (minutes >= rule.atLeast && prompt.options.includes(rule.option) && (!best || rule.atLeast > best.atLeast)) best = rule;
  }
  return best?.option;
}

/** True for a choice this version can fill in (whatever today's minutes). */
export const canPrefill = (prompt: GuidedPrompt): prompt is Choice => suggestedOption(prompt, Number.MAX_SAFE_INTEGER) !== undefined;

/**
 * Today's suggestions on a page, by prompt id: each visible choice that can be filled in, has no
 * answer and was not declined. Nothing on a page that is not of today.
 */
export function suggestionsOf(
  prompts: readonly GuidedPrompt[],
  answers: Readonly<Record<string, Answer>>,
  declined: readonly string[],
  minutes: number,
  ofToday: boolean,
  round: number,
): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  if (!ofToday || minutes <= 0) return out;
  for (const prompt of prompts) {
    if (prompt.kind !== 'choice' || declined.includes(prompt.id) || !isEmptyValue(answers[prompt.id]?.value)) continue;
    // A choice shown only after another answer is filled in only when it shows.
    if (!isVisible(prompt, { ...answers, ...out }, round)) continue;
    const option = suggestedOption(prompt, minutes);
    if (option !== undefined) out[prompt.id] = { ask: prompt.ask, value: option };
  }
  return out;
}
