/**
 * The rules of a guided journal (docs/phases/phase-5.md, section 3), as pure functions.
 *
 * A journal is read in one order: its sections, each section's rounds (`repeat`), each round's
 * pages, each page's `times`. A "step" is one place in that order. A pool (`repeat: forever`) has
 * no end: after its last page it starts again from its first.
 *
 *   - Progress is by page, not by date: a missed day or week changes nothing.
 *   - Nobody is sent back: the next page is the first one after the FURTHEST page done (written or
 *     skipped), in the journal's order as it is now. A page added in a part already passed is
 *     never reached; a page removed simply drops out.
 *   - One new page a day per journal: once a page was written on a day, the next waits for the next
 *     day, except inside a `together` section. A skip does not use up the day.
 *
 * No React, no storage. Tested in guided.test.ts.
 */
import type { GuidedJournal, GuidedPage, GuidedPrompt, GuidedSection } from '../../shared/content-schema';

import { strings } from '@/strings';

import { entriesOf, isEmptyValue, type Answer, type AnswerValue, type JournalEntry } from './types';

/** One place in a journal's order. Rounds and times count from 1. */
export type Step = { section: string; round: number; page: string; time: number };

/** The same place by position: section index, round, page index, time. */
type Place = { si: number; round: number; pi: number; time: number };

function placeOf(journal: GuidedJournal, step: Pick<Step, 'section' | 'page'> & Partial<Step>): Place | undefined {
  const si = journal.sections.findIndex((s) => s.id === step.section);
  if (si < 0) return undefined;
  const pi = journal.sections[si].pages.findIndex((p) => p.id === step.page);
  if (pi < 0) return undefined;
  return { si, round: step.round ?? 1, pi, time: step.time ?? 1 };
}

function stepOf(journal: GuidedJournal, place: Place): Step {
  const section = journal.sections[place.si];
  return { section: section.id, round: place.round, page: section.pages[place.pi].id, time: place.time };
}

/** -1, 0 or 1: which place comes first in the order. */
function compare(a: Place, b: Place): number {
  for (const key of ['si', 'round', 'pi', 'time'] as const) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  return 0;
}

/** The place right after this one, or undefined at the end of a journal without a pool. */
function after(journal: GuidedJournal, { si, round, pi, time }: Place): Place | undefined {
  const section = journal.sections[si];
  const nextSection = si + 1 < journal.sections.length ? { si: si + 1, round: 1, pi: 0, time: 1 } : undefined;
  // A round past the section's repeats (the section now repeats fewer times): on to the next section.
  if (section.repeat !== 'forever' && round > section.repeat) return nextSection;
  if (time < section.pages[pi].times) return { si, round, pi, time: time + 1 };
  if (pi + 1 < section.pages.length) return { si, round, pi: pi + 1, time: 1 };
  if (section.repeat === 'forever' || round < section.repeat) return { si, round: round + 1, pi: 0, time: 1 };
  return nextSection;
}

/** Where a written (or skipped) page sits in the journal as it is now; undefined if its page is gone. */
function placeOfEntry(journal: GuidedJournal, entry: JournalEntry): Place | undefined {
  if (entry.section === undefined || entry.page === undefined) return undefined;
  return placeOf(journal, { section: entry.section, page: entry.page, round: entry.round, time: entry.time });
}

/** The furthest place done (written or skipped) that still exists, or undefined. */
function furthest(journal: GuidedJournal, entries: readonly JournalEntry[]): Place | undefined {
  let best: Place | undefined;
  for (const entry of entriesOf(journal.slug, entries)) {
    const place = placeOfEntry(journal, entry);
    if (place && (!best || compare(place, best) > 0)) best = place;
  }
  return best;
}

/** The section and the page at a step, if they still exist. */
export function pageAt(journal: GuidedJournal, step: Pick<Step, 'section' | 'page'>): { section: GuidedSection; page: GuidedPage } | undefined {
  const place = placeOf(journal, step);
  if (!place) return undefined;
  const section = journal.sections[place.si];
  return { section, page: section.pages[place.pi] };
}

/** The page to write next: the first one after the furthest page done. Undefined once finished. */
export function nextPageOf(journal: GuidedJournal, entries: readonly JournalEntry[]): Step | undefined {
  const done = furthest(journal, entries);
  if (!done) return stepOf(journal, { si: 0, round: 1, pi: 0, time: 1 });
  const next = after(journal, done);
  return next ? stepOf(journal, next) : undefined;
}

/** The pages of a journal written (not skipped) on a day. */
function writtenOn(journal: GuidedJournal, entries: readonly JournalEntry[], day: string): JournalEntry[] {
  return entriesOf(journal.slug, entries).filter((e) => e.day === day && !e.skipped);
}

/**
 * True when the next page can be written today: nothing of this journal was written today, or the
 * next page is in a `together` section and everything written today is in that same section.
 */
export function isOpenToday(journal: GuidedJournal, entries: readonly JournalEntry[], today: string): boolean {
  const next = nextPageOf(journal, entries);
  if (!next) return false;
  const written = writtenOn(journal, entries, today);
  if (written.length === 0) return true;
  const section = journal.sections.find((s) => s.id === next.section);
  return !!section?.together && written.every((e) => e.section === next.section);
}

/** How many steps one round of a section holds (every page, each as many times as it says). */
const roundSize = (section: GuidedSection) => section.pages.reduce((sum, p) => sum + p.times, 0);

/** The numbered part: every step of every section before the pool. */
function numberedTotal(journal: GuidedJournal): number {
  let total = 0;
  for (const section of journal.sections) {
    if (section.repeat === 'forever') break;
    total += section.repeat * roundSize(section);
  }
  return total;
}

/** "Page 6 of 28", or, in the pool, its title and a count ("Keep going · 4"). */
export type PageNumber = { pool: false; n: number; total: number } | { pool: true; title: string; n: number; total: number };

export function pageNumber(journal: GuidedJournal, step: Step): PageNumber | undefined {
  const place = placeOf(journal, step);
  if (!place) return undefined;
  const section = journal.sections[place.si];
  const before = section.pages.slice(0, place.pi).reduce((sum, p) => sum + p.times, 0);
  const inSection = (place.round - 1) * roundSize(section) + before + Math.min(place.time, section.pages[place.pi].times);
  const total = numberedTotal(journal);
  if (section.repeat === 'forever') return { pool: true, title: section.title, n: inSection, total };
  let earlier = 0;
  for (const s of journal.sections.slice(0, place.si)) earlier += s.repeat === 'forever' ? 0 : s.repeat * roundSize(s);
  return { pool: false, n: earlier + inSection, total };
}

export function pageNumberText(number: PageNumber): string {
  return number.pool ? strings.journal.poolPage(number.title, number.n) : strings.journal.pageOf(number.n, number.total);
}

/**
 * True when a prompt shows: it has no showIf, or the earlier prompt it names has the answer `is`
 * (among the answers chosen, for a choice of several), or any answer when `is` is not given.
 */
export function isVisible(prompt: GuidedPrompt, answers: Readonly<Record<string, Answer>>): boolean {
  if (!prompt.showIf) return true;
  const answer = answers[prompt.showIf.prompt];
  if (!answer || isEmptyValue(answer.value)) return false;
  const { is } = prompt.showIf;
  if (is === undefined) return true;
  return Array.isArray(answer.value) ? answer.value.includes(String(is)) : answer.value === is;
}

/** An earlier answer, with the day its page was written. */
export type Recalled = { ask: string; value: AnswerValue; day: string };

/**
 * The first or the latest answer to a prompt of this journal, never from the page being written.
 * Undefined when nothing was answered.
 */
export function recallOf(
  journal: GuidedJournal,
  entries: readonly JournalEntry[],
  promptId: string,
  which: 'first' | 'latest',
  excludingEntry?: string,
): Recalled | undefined {
  const answered = entriesOf(journal.slug, entries)
    .filter((e) => e.id !== excludingEntry && !e.skipped && !isEmptyValue(e.answers?.[promptId]?.value))
    .sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0));
  const entry = which === 'first' ? answered[0] : answered[answered.length - 1];
  if (!entry) return undefined;
  const { ask, value } = entry.answers![promptId];
  return { ask, value, day: entry.day };
}

/** Started: "Begin" was pressed, or something was written or skipped in it. */
export function isStarted(journal: GuidedJournal, entries: readonly JournalEntry[], begun: readonly string[]): boolean {
  return begun.includes(journal.slug) || entriesOf(journal.slug, entries).length > 0;
}

/** When something was last written in a journal (ISO time), or "" if never. */
function lastWritten(journal: GuidedJournal, entries: readonly JournalEntry[]): string {
  return entriesOf(journal.slug, entries)
    .filter((e) => !e.skipped)
    .reduce((latest, e) => (e.updated > latest ? e.updated : latest), '');
}

const byOrder = (a: GuidedJournal, b: GuidedJournal) => a.order - b.order || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);

/** What Today and the Journal tab suggest: one thing. */
export type JournalSuggestion =
  | { kind: 'begin'; journal: GuidedJournal }
  | { kind: 'write'; journal: GuidedJournal; step: Step; section: GuidedSection; page: GuidedPage; number: PageNumber }
  | { kind: 'written'; journal: GuidedJournal; entry: JournalEntry };

/**
 * Among the started journals whose next page is open today, the one written least recently.
 * When every started journal has today's page written: that page, to read. When nothing is
 * started: "begin" the first journal. Undefined without journals.
 */
export function journalToday(
  journals: readonly GuidedJournal[],
  entries: readonly JournalEntry[],
  today: string,
  begun: readonly string[],
): JournalSuggestion | undefined {
  const sorted = [...journals].sort(byOrder);
  const started = sorted.filter((journal) => isStarted(journal, entries, begun));

  const open = started
    .filter((journal) => isOpenToday(journal, entries, today))
    .sort((a, b) => {
      const [la, lb] = [lastWritten(a, entries), lastWritten(b, entries)];
      return la !== lb ? (la < lb ? -1 : 1) : byOrder(a, b);
    });
  for (const journal of open) {
    const step = nextPageOf(journal, entries)!;
    const at = pageAt(journal, step);
    const number = pageNumber(journal, step);
    if (at && number) return { kind: 'write', journal, step, ...at, number };
  }

  // Everything started is written today: the latest page written today, to read.
  const writtenToday = started
    .flatMap((journal) => writtenOn(journal, entries, today).map((entry) => ({ journal, entry })))
    .sort((a, b) => (a.entry.updated < b.entry.updated ? 1 : -1));
  if (writtenToday.length > 0) return { kind: 'written', ...writtenToday[0] };

  const fresh = sorted.find((journal) => !isStarted(journal, entries, begun));
  return fresh ? { kind: 'begin', journal: fresh } : undefined;
}

/** Where a person is in a journal: for its cover, its row on the shelf, its progress line. */
export type Progress = {
  started: boolean;
  /** The next page, unless the journal (without a pool) is finished. */
  next?: Step;
  number?: PageNumber;
  finished: boolean;
  /** Pages in the numbered part, and how many of them are done. */
  total: number;
  done: number;
  /** Pages done in the pool. */
  pool: number;
};

export function progressOf(journal: GuidedJournal, entries: readonly JournalEntry[], begun: readonly string[]): Progress {
  const started = isStarted(journal, entries, begun);
  const total = numberedTotal(journal);
  const next = nextPageOf(journal, entries);
  if (!next) return { started, finished: true, total, done: total, pool: 0 };
  const number = pageNumber(journal, next);
  if (!number) return { started, next, finished: false, total, done: 0, pool: 0 };
  return number.pool
    ? { started, next, number, finished: false, total, done: total, pool: number.n - 1 }
    : { started, next, number, finished: false, total, done: number.n - 1, pool: 0 };
}
