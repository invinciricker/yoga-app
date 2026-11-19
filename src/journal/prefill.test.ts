/**
 * A choice filled in from today's lessons (docs/phases/phase-6.md, 1.6, and "Watch out for" 3), on
 * the real Health journal's "How much did you move today?".
 */
import type { GuidedJournal, GuidedPrompt } from '../../shared/content-schema';

import type { DayEntry } from '@/day/record';

import { pageAt } from './guided';
import { canPrefill, lessonMinutes, suggestedOption, suggestionsOf } from './prefill';
import { realJournal } from './realJournals';

let health: GuidedJournal;
let prompts: GuidedPrompt[];
let moved: GuidedPrompt;
beforeAll(async () => {
  health = await realJournal('health');
  prompts = pageAt(health, { section: 'days', page: 'day' })!.page.prompts;
  moved = prompts.find((p) => 'id' in p && p.id === 'hl-moved')!;
});

const lesson = (day: string, minutes: number, kind: DayEntry['kind'] = 'move'): DayEntry => ({ day, kind, ref: 'a-lesson', minutes, at: `${day}T08:00:00.000Z` });

describe('lessonMinutes', () => {
  it('adds up the lessons of the day only', () => {
    const days = [lesson('2026-11-19', 10), lesson('2026-11-19', 15), lesson('2026-11-18', 40), lesson('2026-11-19', 5, 'write')];
    expect(lessonMinutes(days, '2026-11-19')).toBe(25);
    expect(lessonMinutes([], '2026-11-19')).toBe(0);
  });
});

describe('suggestedOption', () => {
  it('picks the highest rule reached: nothing, a little, twenty minutes or more', () => {
    expect([0, 1, 10, 19, 20, 25].map((m) => suggestedOption(moved, m))).toEqual([
      undefined,
      'A little',
      'A little',
      'A little',
      '20 minutes or more',
      '20 minutes or more',
    ]);
    expect(canPrefill(moved)).toBe(true);
  });

  it('suggests nothing for a "from" this version does not know, a choice of several, or another kind', () => {
    const choice = moved as Extract<GuidedPrompt, { kind: 'choice' }>;
    expect(suggestedOption({ ...choice, prefill: { ...choice.prefill!, from: 'steps-today' } }, 25)).toBeUndefined();
    expect(suggestedOption({ ...choice, many: true }, 25)).toBeUndefined();
    expect(suggestedOption({ ...choice, prefill: { from: 'lessons-today', pick: [{ atLeast: 1, option: 'Gone' }] } }, 25)).toBeUndefined();
    expect(suggestedOption(prompts[1], 25)).toBeUndefined();
  });
});

describe('suggestionsOf', () => {
  const ask = (value: string) => ({ ask: 'How much did you move today?', value });
  it('fills in the choice on a page of today with no answer', () => {
    expect(suggestionsOf(prompts, {}, [], 25, true, 1)).toEqual({ 'hl-moved': ask('20 minutes or more') });
    expect(suggestionsOf(prompts, {}, [], 10, true, 1)).toEqual({ 'hl-moved': ask('A little') });
  });
  it('fills in nothing without a lesson, on a page of another day, or once it was tapped away', () => {
    expect(suggestionsOf(prompts, {}, [], 0, true, 1)).toEqual({});
    expect(suggestionsOf(prompts, {}, [], 25, false, 1)).toEqual({});
    expect(suggestionsOf(prompts, {}, ['hl-moved'], 25, true, 1)).toEqual({});
  });
  it('never replaces an answer', () => {
    expect(suggestionsOf(prompts, { 'hl-moved': ask('Hardly at all') }, [], 25, true, 1)).toEqual({});
  });
});
