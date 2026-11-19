/**
 * What a person writes in the Journal, and how it is read back from the phone.
 *
 * One `JournalEntry` per page written: a free page, or a page of a guided journal. Each is kept on
 * the phone only, under its own key (src/journal/store.ts). Nothing of it is ever sent, logged or
 * counted outside the phone (docs/V2.md, limit 7).
 *
 * Every answer keeps the words of its question as they were when it was answered, and a guided
 * page keeps the titles it had, so a written page stays readable whatever later happens to the
 * content (a page reworded, moved or removed, a journal taken down).
 *
 * Pure functions only. Tested in types.test.ts.
 */

/** An answer: text, a list of lines (a list, several choices, the blanks of a fill), a number (a scale) or yes/no. */
export type AnswerValue = string | string[] | number | boolean;
export type Answer = { ask: string; value: AnswerValue };

/** One page someone wrote: a free page, or a page of a guided journal. */
export type JournalEntry = {
  /** Made when the page is first written; never reused. */
  id: string;
  kind: 'free' | 'guided';
  /** "YYYY-MM-DD": the day it was FIRST written. It keeps it when edited later. */
  day: string;
  /** ISO times. */
  created: string;
  updated: string;
  // --- a free page
  text?: string;
  /** The id of the "Give me a prompt" line, if one was chosen (strings.journal.freePrompts). */
  prompt?: string;
  // --- a guided page
  /** The journal's slug, its section, its page. */
  journal?: string;
  section?: string;
  page?: string;
  /** Which repeat of its section, from 1. */
  round?: number;
  /** Which of its page's `times`, from 1. */
  time?: number;
  /** Passed with "Not today": nothing written, no candle. */
  skipped?: boolean;
  /**
   * Which start of its journal it was written in, from 1 (Phase 6, "Start a new habit"). Set when the
   * page is first written; absent means 1. The journal's current start is in src/journal/cycles.ts.
   */
  cycle?: number;
  /**
   * The prompts whose answer filled in from today's practice was tapped away or changed (Phase 6,
   * `prefill`): never suggested again on this page.
   */
  declined?: string[];
  /** By prompt id, WITH the question's words as they were when answered. */
  answers?: Record<string, Answer>;
  /** The titles as they were when the page was first written (journal, section, page). */
  titles?: { journal: string; section: string; page: string };
};

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const wholeFrom1 = (v: unknown): number => (typeof v === 'number' && Number.isInteger(v) && v >= 1 ? v : 1);

/** True for an answer that says nothing: empty words, no line written, nothing chosen. */
export function isEmptyValue(value: AnswerValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.every((line) => line.trim() === '');
  return false; // a number or yes/no is always an answer
}

function readValue(v: unknown): AnswerValue | undefined {
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (Array.isArray(v) && v.every((line) => typeof line === 'string')) return v as string[];
  return undefined;
}

/**
 * One entry read back from the phone. Anything broken gives undefined (the page is left out, the
 * app carries on); an answer that cannot be read is left out of its page.
 */
export function parseEntry(raw: unknown): JournalEntry | undefined {
  if (!isObject(raw)) return undefined;
  const { id, kind, day, created, updated } = raw;
  if (typeof id !== 'string' || id === '' || (kind !== 'free' && kind !== 'guided')) return undefined;
  if (typeof day !== 'string' || !dayPattern.test(day) || typeof created !== 'string') return undefined;
  const entry: JournalEntry = { id, kind, day, created, updated: typeof updated === 'string' ? updated : created };

  if (kind === 'free') {
    entry.text = typeof raw.text === 'string' ? raw.text : '';
    if (typeof raw.prompt === 'string') entry.prompt = raw.prompt;
    return entry;
  }

  const { journal, section, page } = raw;
  if (typeof journal !== 'string' || typeof section !== 'string' || typeof page !== 'string') return undefined;
  Object.assign(entry, { journal, section, page, round: wholeFrom1(raw.round), time: wholeFrom1(raw.time) });
  if (raw.skipped === true) entry.skipped = true;
  if (raw.cycle !== undefined) entry.cycle = wholeFrom1(raw.cycle);
  if (Array.isArray(raw.declined)) {
    const declined = raw.declined.filter((d): d is string => typeof d === 'string');
    if (declined.length > 0) entry.declined = declined;
  }
  const answers: Record<string, Answer> = {};
  if (isObject(raw.answers)) {
    for (const [promptId, answer] of Object.entries(raw.answers)) {
      if (!isObject(answer) || typeof answer.ask !== 'string') continue;
      const value = readValue(answer.value);
      if (value !== undefined) answers[promptId] = { ask: answer.ask, value };
    }
  }
  entry.answers = answers;
  const t = raw.titles;
  if (isObject(t) && typeof t.journal === 'string' && typeof t.section === 'string' && typeof t.page === 'string') {
    entry.titles = { journal: t.journal, section: t.section, page: t.page };
  }
  return entry;
}

/** A new id, never reused: the moment in base 36 and a random tail. */
export function newEntryId(now: Date = new Date()): string {
  return `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The same guided page with one answer set (or removed, when it says nothing). */
export function withAnswer(entry: JournalEntry, promptId: string, answer: Answer): JournalEntry {
  const answers = { ...entry.answers };
  if (isEmptyValue(answer.value)) delete answers[promptId];
  else answers[promptId] = answer;
  return { ...entry, answers };
}

/** True when the page holds any writing: a free page's words, or one answer of a guided page. */
export function hasWriting(entry: JournalEntry): boolean {
  if (entry.kind === 'free') return (entry.text ?? '').trim() !== '';
  return Object.values(entry.answers ?? {}).some((a) => !isEmptyValue(a.value));
}

/** Which start of its journal a guided page was written in (1 when it does not say). */
export const cycleOf = (entry: JournalEntry): number => entry.cycle ?? 1;

/** The pages of one guided journal (written or skipped). */
export function entriesOf(journal: string, entries: readonly JournalEntry[]): JournalEntry[] {
  return entries.filter((e) => e.kind === 'guided' && e.journal === journal);
}

/** The free pages, newest first. */
export function freePages(entries: readonly JournalEntry[]): JournalEntry[] {
  return entries.filter((e) => e.kind === 'free').sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
}
