/**
 * Starting a journal again (docs/phases/phase-6.md, 1.8: "Start a new habit").
 *
 * Every guided page keeps the start ("cycle") it was written in: 1 for the first, 2 after the first
 * "start again", and so on. The current start of each journal started again is kept on the phone
 * under ywm:journal:v1:cycles, for example { "habit": 2 }; a journal not in it is at its first.
 *
 * The rules of src/journal/guided.ts never see cycles: the pages are filtered HERE, once, before
 * they reach them. Today, the shelf, the page numbers, "one new page a day", recalls and dots then
 * look only at the pages of the current start. A page of an earlier start, reread, is given the
 * pages of ITS start (`atCycle`), so its recalls and dots read the habit it was written for.
 * "Your pages" and the export read every page.
 *
 * Pure functions. Tested in cycles.test.ts.
 */
import { cycleOf, type JournalEntry } from './types';

/** The current start of each journal started again, by slug. */
export type Cycles = Readonly<Record<string, number>>;

/** The current start of one journal (1 until it is started again). */
export const currentCycle = (cycles: Cycles, slug: string): number => cycles[slug] ?? 1;

/** The pages as the rules see them: every free page, and each journal's pages of its current start. */
export function inCycles(entries: readonly JournalEntry[], cycles: Cycles): JournalEntry[] {
  return entries.filter((e) => e.kind !== 'guided' || e.journal === undefined || cycleOf(e) === currentCycle(cycles, e.journal));
}

/** The same, with one journal read at another start: for a page written before the latest "start again". */
export function atCycle(entries: readonly JournalEntry[], cycles: Cycles, slug: string, cycle: number): JournalEntry[] {
  return inCycles(entries, { ...cycles, [slug]: cycle });
}

/** The saved cycles, read back leniently: anything that is not a whole number from 2 up is left out. */
export function parseCycles(raw: unknown): Record<string, number> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [slug, n] of Object.entries(raw)) {
    if (typeof n === 'number' && Number.isInteger(n) && n >= 2) out[slug] = n;
  }
  return out;
}

/** The cycles after one journal is started again. */
export function startedAgain(cycles: Cycles, slug: string): Record<string, number> {
  return { ...cycles, [slug]: currentCycle(cycles, slug) + 1 };
}
