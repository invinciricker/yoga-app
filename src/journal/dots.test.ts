/**
 * The week as rows of dots (docs/phases/phase-6.md, 1.5, and "Watch out for" 1: a week that is not
 * quite a week), on the real Habit and Health journals.
 */
import type { GuidedJournal, GuidedPrompt } from '../../shared/content-schema';

import { DOT_NO, DOT_SMALLEST, dotSize, dotsOf, dotsSentence, yesCount, type DotQuestion } from './dots';
import { nothingToAnswer, pageAt, type Step } from './guided';
import { realJournal } from './realJournals';
import type { AnswerValue, JournalEntry } from './types';

let habit: GuidedJournal;
let health: GuidedJournal;
beforeAll(async () => {
  [habit, health] = await Promise.all([realJournal('habit'), realJournal('health')]);
});

const DID = [{ of: 'h-did', label: 'Did it' }];
const week = (round: number): Step => ({ section: 'days', round, page: 'week', time: 1 });
const day = (round: number, time: number): Step => ({ section: 'days', round, page: 'day', time });

let n = 0;
/** A page of a journal at a step, written on a day, with answers by id. */
function page(journal: string, step: Step, onDay: string, values: Record<string, AnswerValue>, more: Partial<JournalEntry> = {}): JournalEntry {
  n += 1;
  return {
    id: `p${n}`,
    kind: 'guided',
    day: onDay,
    created: `${onDay}T20:00:00.000Z`,
    updated: `${onDay}T20:05:00.000Z`,
    journal,
    ...step,
    answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { ask: id, value }])),
    ...more,
  };
}

describe('dotsOf: a week that is not quite a week', () => {
  it('puts each answer in the cell of its step, whatever day it was written on, with missed days, a skip and an empty question as no answer', () => {
    const entries = [
      page('habit', day(2, 1), '2026-11-10', { 'h-did': true }),
      // Days 2 and 3 missed for a week, then written late: still days 2 and 3.
      page('habit', day(2, 2), '2026-11-20', { 'h-did': false }),
      page('habit', day(2, 3), '2026-11-21', { 'h-easier': 'Earlier' }), // the question left empty
      page('habit', day(2, 4), '2026-11-22', {}, { skipped: true }),
      // Begun before midnight, finished after: one page, on the day it was begun.
      page('habit', day(2, 5), '2026-11-23', { 'h-did': true }, { updated: '2026-11-24T00:10:00.000Z' }),
      // Another round, and another journal with the same ids: never mixed in.
      page('habit', day(1, 6), '2026-11-08', { 'h-did': true }),
      page('health', day(2, 6), '2026-11-24', { 'h-did': true }),
    ];
    const [row] = dotsOf(habit, entries, week(2), DID, { answers: {} });
    expect(row.values).toEqual([true, false, undefined, undefined, true, undefined, undefined]);
    expect(row.here).toBe(6);
    expect(yesCount(row)).toBe(2);
  });

  it('shows the page on screen as it is on screen now, not as it was saved', () => {
    const saved = page('habit', week(1), '2026-11-07', { 'h-did': false });
    const entries = [page('habit', day(1, 1), '2026-11-01', { 'h-did': true }), saved];
    const [row] = dotsOf(habit, entries, week(1), DID, { id: saved.id, answers: { 'h-did': { ask: 'x', value: true } } });
    expect(row.values).toEqual([true, undefined, undefined, undefined, undefined, undefined, true]);
    // Not yet written: the page on screen still has its cell.
    const [fresh] = dotsOf(habit, entries.slice(0, 1), week(1), DID, { answers: {} });
    expect(fresh.values[6]).toBeUndefined();
    expect(fresh.here).toBe(6);
  });

  it('reads a week page reread a month later with the answers of its own week', () => {
    const entries: JournalEntry[] = [];
    for (let t = 1; t <= 6; t++) entries.push(page('habit', day(3, t), `2026-11-${10 + t}`, { 'h-did': t % 2 === 0, 'h-auto': t <= 5 ? t : 9 }));
    const reread = page('habit', week(3), '2026-11-17', { 'h-did': true, 'h-auto': 4 });
    // Weeks 4 to 7 after it.
    for (let r = 4; r <= 7; r++) for (let t = 1; t <= 6; t++) entries.push(page('habit', day(r, t), `2026-12-0${t}`, { 'h-did': false }));
    const rows = dotsOf(habit, [...entries, reread], week(3), [...DID, { of: 'h-auto', label: 'Automatic' }], { id: reread.id, answers: reread.answers! });
    expect(rows[0].values).toEqual([false, true, false, true, false, true, true]);
    // A scale answer outside its range (9) is no answer.
    expect(rows[1].values).toEqual([1, 2, 3, 4, 5, undefined, 4]);
  });

  it('never counts more than the days of a week, even with two pages at one step', () => {
    const entries: JournalEntry[] = [];
    for (let t = 1; t <= 6; t++) {
      entries.push(page('habit', day(1, t), '2026-11-01', { 'h-did': true }));
      entries.push(page('habit', day(1, t), '2026-11-02', { 'h-did': true }));
    }
    const [row] = dotsOf(habit, entries, week(1), DID, { answers: { 'h-did': { ask: 'x', value: true } } });
    expect(row.values).toHaveLength(7);
    expect(yesCount(row)).toBe(7);
    expect(dotsSentence(row)).toBe('Did it: yes, yes, yes, yes, yes, yes, yes. 7 of 7.');
  });

  it('shows another round when a row asks for it (week 1 next to week 10), without marking a cell', () => {
    const entries = [page('habit', day(1, 1), '2026-09-01', { 'h-auto': 2 }), page('habit', day(10, 1), '2026-11-10', { 'h-auto': 5 })];
    const rows = dotsOf(habit, entries, week(10), [
      { of: 'h-auto', label: 'Week 1', round: 1 },
      { of: 'h-auto', label: 'Week 10' },
    ], { answers: {} });
    expect(rows.map((r) => [r.values[0], r.here])).toEqual([
      [2, -1],
      [5, 6],
    ]);
  });

  it('reads the six rows of the Health week, and an option since renamed as no answer', () => {
    const dotsPrompt = pageAt(health, week(1))!.page.prompts.find((p) => p.kind === 'dots') as Extract<GuidedPrompt, { kind: 'dots' }>;
    const entries = [
      page('health', day(1, 1), '2026-11-01', { 'hl-slept': '7 to 8', 'hl-rested': 4, 'hl-energy': 3, 'hl-moved': 'A little', 'hl-outside': true, 'hl-talked': false }),
      page('health', day(1, 2), '2026-11-02', { 'hl-slept': 'Seven hours', 'hl-moved': '20 minutes or more' }),
    ];
    const rows = dotsOf(health, entries, week(1), dotsPrompt.rows, { answers: {} });
    expect(rows.map((r) => r.label)).toEqual(['Sleep', 'Rested', 'Energy', 'Moved', 'Outside', 'Talked']);
    expect(rows.map((r) => r.values.slice(0, 2))).toEqual([
      ['7 to 8', undefined],
      [4, undefined],
      [3, undefined],
      ['A little', '20 minutes or more'],
      [true, undefined],
      [false, undefined],
    ]);
    expect(dotsSentence(rows[2])).toBe('Energy: 3 of 5, no answer, no answer, no answer, no answer, no answer, no answer.');
    expect(dotsSentence(rows[0])).toBe('Sleep: 7 to 8, no answer, no answer, no answer, no answer, no answer, no answer.');
    expect(dotsSentence(rows[5])).toBe('Talked: no, no answer, no answer, no answer, no answer, no answer, no answer. 0 of 7.');
  });
});

describe('dotSize', () => {
  const yesno: DotQuestion = { kind: 'yesno', id: 'y', ask: 'Y?' };
  const scale: DotQuestion = { kind: 'scale', id: 's', ask: 'S?', from: 1, to: 5, low: 'l', high: 'h' };
  const choice: DotQuestion = { kind: 'choice', id: 'c', ask: 'C?', options: ['a', 'b', 'c'], many: false };
  it('is a full dot for Yes, a small one for No, an empty ring for no answer', () => {
    expect([dotSize(yesno, true), dotSize(yesno, false), dotSize(yesno, undefined), dotSize(yesno, '')]).toEqual([1, DOT_NO, 0, 0]);
  });
  it('grows in equal steps for a scale or a choice, from the smallest to the whole cell', () => {
    expect([1, 2, 3, 4, 5].map((v) => dotSize(scale, v))).toEqual([0, 1, 2, 3, 4].map((i) => DOT_SMALLEST + ((1 - DOT_SMALLEST) * i) / 4));
    expect(['a', 'b', 'c'].map((v) => dotSize(choice, v))).toEqual([DOT_SMALLEST, DOT_SMALLEST + (1 - DOT_SMALLEST) / 2, 1]);
    expect(dotSize(choice, 'gone')).toBe(0);
    expect(dotSize(undefined, true)).toBe(0);
  });
});

describe('a page of dots', () => {
  it('has nothing to answer when it holds only notes, recalls and dots', () => {
    const dots = pageAt(habit, week(1))!.page.prompts.find((p) => p.kind === 'dots')!;
    expect(nothingToAnswer({ id: 'x', title: 'X', times: 1, prompts: [dots, { kind: 'note', text: [] }] })).toBe(true);
    expect(nothingToAnswer(pageAt(habit, week(1))!.page)).toBe(false);
  });
});
