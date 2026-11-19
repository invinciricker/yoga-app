/**
 * Starting a journal again (docs/phases/phase-6.md, 1.8, and "Watch out for" 2), on the real Habit
 * journal: the rules see only the pages of the current start, and a page of an earlier start reads
 * its own.
 */
import type { GuidedJournal } from '../../shared/content-schema';

import { atCycle, currentCycle, inCycles, parseCycles, startedAgain } from './cycles';
import { dotsOf } from './dots';
import { isFree, isOpenToday, journalToday, nextPageOf, pageNumber, pageNumberText, recallOf } from './guided';
import { realJournal } from './realJournals';
import type { AnswerValue, JournalEntry } from './types';

let habit: GuidedJournal;
beforeAll(async () => {
  habit = await realJournal('habit');
});

let n = 0;
/** A page of the Habit journal written at a moment ("2026-11-17T20:00"), at the next step of its start. */
function habitPage(entries: JournalEntry[], at: string, cycle: number, values: Record<string, AnswerValue> = {}): JournalEntry {
  const step = nextPageOf(habit, inCycles(entries, { habit: cycle }))!;
  n += 1;
  return {
    id: `h${n}`,
    kind: 'guided',
    day: at.slice(0, 10),
    created: `${at}:00.000Z`,
    updated: `${at}:00.000Z`,
    journal: 'habit',
    ...step,
    cycle,
    answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { ask: id, value }])),
  };
}

/** Writes pages one a day from a day, at the current start of `cycles`; returns all the pages. */
function writeDays(entries: JournalEntry[], from: number, count: number, cycle: number, values: (i: number) => Record<string, AnswerValue | undefined>) {
  const out = [...entries];
  for (let i = 0; i < count; i++) {
    const day = `2026-11-${String(from + i).padStart(2, '0')}T20:00`;
    const given = Object.entries(values(i)).filter((pair): pair is [string, AnswerValue] => pair[1] !== undefined);
    out.push(habitPage(out, day, cycle, Object.fromEntries(given)));
  }
  return out;
}

describe('parseCycles and startedAgain', () => {
  it('reads only whole numbers from 2, and counts on from 1', () => {
    expect(parseCycles({ habit: 2, health: 1, x: 'three', y: 2.5, z: 0 })).toEqual({ habit: 2 });
    expect(parseCycles(undefined)).toEqual({});
    expect(parseCycles([1, 2])).toEqual({});
    expect(startedAgain({}, 'habit')).toEqual({ habit: 2 });
    expect(startedAgain({ habit: 2 }, 'habit')).toEqual({ habit: 3 });
    expect(currentCycle({ habit: 3 }, 'health')).toBe(1);
  });
});

describe('inCycles', () => {
  it('keeps free pages, other journals, and this journal at its current start (a page without a cycle is of the first)', () => {
    const free: JournalEntry = { id: 'f', kind: 'free', day: '2026-11-17', created: 'x', updated: 'x', text: 'Hi' };
    const old: JournalEntry = { id: 'o', kind: 'guided', day: '2026-11-17', created: 'x', updated: 'x', journal: 'habit', section: 'getting-ready', page: 's01' };
    const now = { ...old, id: 'n', cycle: 2 };
    const other = { ...old, id: 'g', journal: 'gratitude' };
    expect(inCycles([free, old, now, other], {}).map((e) => e.id)).toEqual(['f', 'o', 'g']);
    expect(inCycles([free, old, now, other], { habit: 2 }).map((e) => e.id)).toEqual(['f', 'n', 'g']);
    expect(atCycle([free, old, now, other], { habit: 2 }, 'habit', 1).map((e) => e.id)).toEqual(['f', 'o', 'g']);
  });
});

describe('starting the Habit journal again', () => {
  it('on the same day as a week page: the set-up opens at once, and its three pages may all be written that day', () => {
    // The set-up on the 1st, then seven daily pages: the week page is written on the 8th.
    let pages = writeDays([], 1, 3, 1, () => ({ 'h-want': 'Stretch' }));
    pages = pages.map((p) => ({ ...p, day: '2026-11-01' }));
    pages = writeDays(pages, 2, 7, 1, () => ({ 'h-did': true }));
    expect(pages[pages.length - 1]).toMatchObject({ page: 'week', day: '2026-11-08' });
    expect(isOpenToday(habit, inCycles(pages, {}), '2026-11-08')).toBe(false);

    const cycles = startedAgain({}, 'habit');
    const seen = inCycles(pages, cycles);
    expect(nextPageOf(habit, seen)).toEqual({ section: 'getting-ready', round: 1, page: 's01', time: 1 });
    expect(isOpenToday(habit, seen, '2026-11-08')).toBe(true);
    expect(pageNumberText(pageNumber(habit, nextPageOf(habit, seen)!)!)).toBe('Page 1 of 3');

    // The three set-up pages, the same day.
    let again = [...pages];
    for (let i = 0; i < 3; i++) {
      expect(isOpenToday(habit, inCycles(again, cycles), '2026-11-08')).toBe(true);
      again = [...again, habitPage(again, `2026-11-08T21:0${i}`, 2, { 'h-want': 'Read' })];
    }
    // Then the first daily page waits for tomorrow.
    expect(nextPageOf(habit, inCycles(again, cycles))).toEqual({ section: 'days', round: 1, page: 'day', time: 1 });
    expect(isOpenToday(habit, inCycles(again, cycles), '2026-11-08')).toBe(false);
    expect(isOpenToday(habit, inCycles(again, cycles), '2026-11-09')).toBe(true);
  });

  it('twice: each start counts its own pages, and Today suggests the first page of the latest', () => {
    let pages = writeDays([], 1, 4, 1, () => ({ 'h-want': 'First' }));
    let cycles = startedAgain({}, 'habit');
    pages = writeDays(pages, 10, 2, 2, () => ({ 'h-want': 'Second' }));
    cycles = startedAgain(cycles, 'habit');
    expect(cycles).toEqual({ habit: 3 });
    const seen = inCycles(pages, cycles);
    expect(seen).toEqual([]);
    expect(isFree(habit, seen)).toBe(true);
    expect(journalToday([habit], seen, '2026-11-20', ['habit'])).toMatchObject({ kind: 'write', step: { page: 's01' } });
  });

  it('a page of the first habit, reread, recalls and counts the first habit, not the new one', () => {
    // First habit: set-up, then a week with 5 Yes.
    let pages = writeDays([], 1, 3, 1, (i) => (i === 1 ? { 'h-plan': ['tea', 'stretch'] } : { 'h-want': 'Stretch' }));
    pages = writeDays(pages, 4, 7, 1, (i) => ({ 'h-did': i !== 2 && i !== 4 }));
    const firstWeek = pages[pages.length - 1];
    // Started again: a new plan.
    const cycles = startedAgain({}, 'habit');
    pages = writeDays(pages, 20, 3, 2, (i) => (i === 1 ? { 'h-plan': ['coffee', 'read'] } : { 'h-want': 'Read' }));

    // Today's recall sees the new plan…
    expect(recallOf(habit, inCycles(pages, cycles), 'h-plan', 'latest')?.value).toEqual(['coffee', 'read']);
    // …the old week page, reread, its own.
    const ofItsStart = atCycle(pages, cycles, 'habit', firstWeek.cycle!);
    expect(recallOf(habit, ofItsStart, 'h-plan', 'latest', firstWeek.id)?.value).toEqual(['tea', 'stretch']);
    const [did] = dotsOf(habit, ofItsStart, { section: 'days', round: 1, page: 'week', time: 1 }, [{ of: 'h-did', label: 'Did it' }], {
      id: firstWeek.id,
      answers: firstWeek.answers!,
    });
    expect(did.values).toEqual([true, true, false, true, false, true, true]);
  });
});
