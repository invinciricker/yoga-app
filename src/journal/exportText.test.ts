/**
 * How answers read, and the text of "Export my journal" (docs/phases/phase-5.md, section 4).
 */
import { pageAt } from './guided';
import { answerLines, EXPORT_LIMIT, exportParts, journalPages, PAGE_BREAK } from './exportText';
import { testJournal, wrote } from './testJournal';
import type { JournalEntry } from './types';

const j = testJournal;
const free = (id: string, created: string, text: string, prompt?: string): JournalEntry => ({
  id,
  kind: 'free',
  day: created.slice(0, 10),
  created,
  updated: created,
  text,
  ...(prompt ? { prompt } : null),
});

describe('answerLines', () => {
  const scale = pageAt(j, { section: 'week', page: 'a' })!.page.prompts[1];

  it('reads a scale as "7 out of 10", yes or no as words, a list as its lines', () => {
    expect(answerLines({ ask: 'How?', value: 7 }, scale)).toEqual(['7 out of 10']);
    expect(answerLines({ ask: 'How?', value: 7 })).toEqual(['7']); // the scale is gone from the content
    expect(answerLines({ ask: 'Sent?', value: true })).toEqual(['Yes']);
    expect(answerLines({ ask: 'Sent?', value: false })).toEqual(['No']);
    expect(answerLines({ ask: 'Three things.', value: ['Tea', '', 'Sun'] })).toEqual(['Tea', 'Sun']);
    expect(answerLines({ ask: 'Why?', value: 'Because.\nAnd more.' })).toEqual(['Because.\nAnd more.']);
  });

  it('puts the blanks of a fill back into its sentence, from the words kept with the answer', () => {
    expect(answerLines({ ask: 'I am glad of ___ and ___.', value: ['rain', ''] })).toEqual(['I am glad of rain and ___.']);
  });
});

describe('the export text', () => {
  it('gives every page, oldest first: a free page as its day, its prompt line and its text', () => {
    const pages = journalPages(
      [free('f2', '2026-11-21T08:00:00.000Z', 'Second.'), free('f1', '2026-11-20T08:00:00.000Z', 'First words.', 'after-practice')],
      [j],
    );
    expect(pages).toEqual([
      'Friday 20 November 2026\nAfter practice. You have just practised. What did you notice, in your body or in your mind?\n\nFirst words.',
      'Saturday 21 November 2026\n\nSecond.',
    ]);
  });

  it('gives a guided page as its journal, its title, its day, then each question and its answer', () => {
    const page = wrote('a', '2026-11-20T20:00', { values: { good: ['Tea', 'Sun', ''], mood: 7 } });
    expect(journalPages([page], [j])).toEqual([
      'Small\nPage A\nFriday 20 November 2026\n\nWords of mood\n7 out of 10\n\nWords of good\nTea\nSun',
    ]);
  });

  it('keeps a page readable when its journal is gone, with the words and titles it kept', () => {
    const page = {
      ...wrote('gone', '2026-11-20T20:00', { values: { x: 'Kept.' } }),
      journal: 'old',
      titles: { journal: 'Old journal', section: 'Week 1', page: 'An old page' },
    };
    expect(journalPages([page], [j])).toEqual(['Old journal\nAn old page\nFriday 20 November 2026\n\nWords of x\nKept.']);
  });

  it('leaves out a skipped page: nothing was written', () => {
    expect(journalPages([wrote('b', '2026-11-20T20:00', { skipped: true, values: {} })], [j])).toEqual([]);
  });
});

describe('exportParts', () => {
  it('is one text when it is small enough', () => {
    expect(exportParts(['One.', 'Two.'])).toEqual([`One.${PAGE_BREAK}Two.`]);
  });

  it('comes in parts above 100,000 characters, each starting "Part 1 of 3", nothing cut', () => {
    // 500 pages of about 1,000 characters each.
    const pages = Array.from({ length: 500 }, (_, i) => `Page ${i + 1}. ${'Words of a page. '.repeat(60)}`);
    const parts = exportParts(pages);
    expect(parts.length).toBeGreaterThan(1);
    parts.forEach((part, i) => {
      expect(part.length).toBeLessThanOrEqual(EXPORT_LIMIT);
      expect(part.startsWith(`Part ${i + 1} of ${parts.length}\n\n`)).toBe(true);
    });
    // Every page whole, in order: no page is cut between two parts.
    const bodies = parts.map((part) => part.replace(/^Part \d+ of \d+\n\n/, ''));
    expect(bodies.join(PAGE_BREAK)).toBe(pages.join(PAGE_BREAK));
  });

  it('cuts a single page longer than a part between two lines, and loses nothing', () => {
    const huge = Array.from({ length: 30_000 }, (_, i) => `Line ${i}`).join('\n'); // about 319,000 characters
    const parts = exportParts([huge]);
    expect(parts).toHaveLength(4);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(EXPORT_LIMIT);
    expect(parts.map((part) => part.replace(/^Part \d+ of \d+\n\n/, '')).join('')).toBe(huge);
  });

  it('keeps one answer of 10,000 characters whole', () => {
    const long = 'x'.repeat(10_000);
    const page = wrote('c', '2026-11-20T20:00', { values: { c1: long } });
    const [part] = exportParts(journalPages([page], [j]));
    expect(part).toContain(long);
  });
});
