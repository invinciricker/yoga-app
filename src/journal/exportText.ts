/**
 * The words of the Journal as text: how one answer reads (also on the screen, in a recall), and the
 * text that "Export my journal" hands to another app (docs/phases/phase-5.md, section 4).
 *
 *   - every page, oldest first; a skipped page is left out (nothing was written);
 *   - a free page: its day, its prompt line if any, its text;
 *   - a guided page: the journal's title, the page's title, its day, then each question and its
 *     answer, with the words kept on the phone when the content no longer has them;
 *   - above 100,000 characters (Android refuses very large shares) it comes in parts, oldest first,
 *     each starting "Part 1 of 3". A page is never cut between two parts unless it alone is
 *     longer than a part; then it is cut between two lines, and nothing is lost.
 *
 * Pure functions. Tested in exportText.test.ts.
 */
import { sentencePieces, type GuidedJournal, type GuidedPrompt } from '../../shared/content-schema';

import { strings } from '@/strings';

import { longDayWithYear } from './dates';
import { pageAt } from './guided';
import type { Answer, JournalEntry } from './types';

/** The most characters one part may hold, its "Part 1 of 3" line included. */
export const EXPORT_LIMIT = 100_000;
/** Between two pages. */
export const PAGE_BREAK = '\n\n---\n\n';

/** How an answer reads, line by line: a list as its lines, a scale as "7 out of 10", yes or no as words. */
export function answerLines(answer: Answer, prompt?: GuidedPrompt): string[] {
  const { value } = answer;
  if (typeof value === 'boolean') return [value ? strings.journal.yes : strings.journal.no];
  if (typeof value === 'number') return [prompt?.kind === 'scale' ? strings.journal.outOf(value, prompt.to) : String(value)];
  if (typeof value === 'string') return [value];
  // A list of lines: the blanks of a fill (its sentence is the words kept with the answer), or lines.
  const pieces = sentencePieces(answer.ask);
  if (pieces.length > 1) {
    return [pieces.map((piece, i) => (i === 0 ? piece : `${value[i - 1]?.trim() || '___'}${piece}`)).join('')];
  }
  return value.filter((line) => line.trim() !== '');
}

/** The prompts of a page by id, when the page is still in the content. */
function promptsOf(journal: GuidedJournal | undefined, entry: JournalEntry): Map<string, GuidedPrompt> {
  const page = journal && entry.section && entry.page ? pageAt(journal, { section: entry.section, page: entry.page })?.page : undefined;
  const byId = new Map<string, GuidedPrompt>();
  for (const prompt of page?.prompts ?? []) if ('id' in prompt) byId.set(prompt.id, prompt);
  return byId;
}

/** One page as text. */
function pageText(entry: JournalEntry, journals: readonly GuidedJournal[]): string {
  const day = longDayWithYear(entry.day);
  if (entry.kind === 'free') {
    const prompt = strings.journal.freePrompts.find((p) => p.id === entry.prompt)?.text;
    return [day, ...(prompt ? [prompt] : [])].join('\n') + `\n\n${entry.text ?? ''}`;
  }
  const journal = journals.find((j) => j.slug === entry.journal);
  const at = journal && entry.section && entry.page ? pageAt(journal, { section: entry.section, page: entry.page }) : undefined;
  const head = [journal?.title ?? entry.titles?.journal ?? entry.journal ?? '', at?.page.title ?? entry.titles?.page ?? entry.page ?? '', day];
  // The answers in the order of the page's prompts, then any the page no longer has.
  const prompts = promptsOf(journal, entry);
  const answers = Object.entries(entry.answers ?? {});
  const order = [...prompts.keys()];
  answers.sort(([a], [b]) => {
    const [ia, ib] = [order.indexOf(a), order.indexOf(b)];
    return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
  });
  const blocks = answers.map(([id, answer]) => [answer.ask, ...answerLines(answer, prompts.get(id))].join('\n'));
  return [head.join('\n'), ...blocks].join('\n\n');
}

/** Every page with writing, oldest first, each as text. */
export function journalPages(entries: readonly JournalEntry[], journals: readonly GuidedJournal[]): string[] {
  return entries
    .filter((e) => !e.skipped)
    .sort((a, b) => (a.day !== b.day ? (a.day < b.day ? -1 : 1) : a.created < b.created ? -1 : a.created > b.created ? 1 : 0))
    .map((entry) => pageText(entry, journals));
}

/** Room for the "Part 12 of 34" line and the empty line under it. */
const HEADER_ROOM = 40;

/** A page longer than a part, in pieces cut between two lines (or two words, or anywhere). */
function cut(text: string, room: number): string[] {
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > room) {
    const window = rest.slice(0, room);
    const at = Math.max(window.lastIndexOf('\n'), window.lastIndexOf(' '));
    const end = at > room / 2 ? at + 1 : room; // keep the line break with the piece before it
    pieces.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  pieces.push(rest);
  return pieces;
}

/**
 * The export as one text, or as parts when it is longer than `limit`. Pages are joined by
 * PAGE_BREAK; a part never ends in the middle of a page unless that page alone is too long.
 */
export function exportParts(pages: readonly string[], limit: number = EXPORT_LIMIT): string[] {
  const whole = pages.join(PAGE_BREAK);
  if (whole.length <= limit) return [whole];

  const room = limit - HEADER_ROOM;
  const bodies: string[] = [];
  let body = '';
  const close = () => {
    if (body !== '') bodies.push(body);
    body = '';
  };
  for (const page of pages) {
    if (page.length > room) {
      // A page longer than a part gets parts of its own.
      close();
      bodies.push(...cut(page, room));
      continue;
    }
    const joined = body === '' ? page : `${body}${PAGE_BREAK}${page}`;
    if (joined.length > room) {
      close();
      body = page;
    } else {
      body = joined;
    }
  }
  close();
  return bodies.map((text, i) => `${strings.journal.partHeader(i + 1, bodies.length)}\n\n${text}`);
}
