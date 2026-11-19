/**
 * A small guided journal for the tests of this folder. Not used by the app.
 *
 *   week     a, b, c                       (one a day)
 *   setup    s1, s2       together         (both may be written on one day)
 *   twice    r (times 2)  repeat 2         → r, r, r, r
 *   pool     k1, k2       forever          → k1, k2, k1, k2…
 *
 * So the numbered part has 3 + 2 + 4 = 9 pages, then the pool keeps going.
 */
import { guidedJournal, type GuidedJournal } from '../../shared/content-schema';

import type { AnswerValue, JournalEntry } from './types';

const text = (id: string, ask = `Question ${id}?`) => ({ kind: 'text', id, ask });

/** Loosely typed, so a test can add, move or remove pages before reading it. */
type RawJournal = { [key: string]: unknown; sections: { [key: string]: unknown; pages: unknown[] }[] };

export const rawTestJournal: RawJournal = {
  slug: 'small',
  title: 'Small',
  summary: 'A small journal.',
  aura: 'rose',
  order: 1,
  minutes: 3,
  intro: [{ title: 'About', text: [{ type: 'paragraph', spans: [{ text: 'Hello.' }] }] }],
  sections: [
    {
      id: 'week',
      title: 'Week',
      pages: [
        {
          id: 'a',
          title: 'Page A',
          prompts: [
            { kind: 'note', text: [{ type: 'paragraph', spans: [{ text: 'Read me.' }] }] },
            { kind: 'scale', id: 'mood', ask: 'How are you?', from: 0, to: 10, low: 'Low', high: 'High' },
            { kind: 'list', id: 'good', ask: 'Three good things.', count: 3 },
          ],
        },
        {
          id: 'b',
          title: 'Page B',
          skip: 'Not today',
          prompts: [
            { kind: 'yesno', id: 'sent', ask: 'Did you send it?' },
            { ...text('felt', 'How did it feel?'), showIf: { prompt: 'sent', is: true } },
            { kind: 'note', text: [], showIf: { prompt: 'sent', is: false } },
            { kind: 'choice', id: 'often', ask: 'How often?', options: ['Rarely', 'Often'], many: true },
            { ...text('why'), showIf: { prompt: 'often', is: 'Often' } },
            { ...text('more'), showIf: { prompt: 'why', answered: true } },
          ],
        },
        { id: 'c', title: 'Page C', prompts: [{ kind: 'recall', of: 'good', which: 'first', label: 'You wrote' }, text('c1')] },
      ],
    },
    { id: 'setup', title: 'Setup', together: true, pages: [{ id: 's1', title: 'S1', prompts: [text('s1')] }, { id: 's2', title: 'S2', prompts: [text('s2')] }] },
    { id: 'twice', title: 'Twice', repeat: 2, pages: [{ id: 'r', title: 'R', times: 2, prompts: [text('r')] }] },
    {
      id: 'pool',
      title: 'Keep going',
      repeat: 'forever',
      pages: [
        { id: 'k1', title: 'K1', prompts: [text('k1'), { kind: 'recall', of: 'k1' }] },
        { id: 'k2', title: 'K2', prompts: [{ kind: 'fill', id: 'k2', sentence: 'I am glad of ___ and ___.' }] },
      ],
    },
  ],
};

export const testJournal: GuidedJournal = guidedJournal.parse(rawTestJournal);

let count = 0;
/**
 * One page written of the test journal. `at` is the moment it was first written ("2026-11-17T20:00").
 * Answers are given as { promptId: value }; their question words are made up.
 */
export function wrote(
  page: string,
  at: string,
  more: Partial<JournalEntry> & { values?: Record<string, AnswerValue> } = {},
): JournalEntry {
  const section = testJournal.sections.find((s) => s.pages.some((p) => p.id === page))?.id ?? 'gone';
  const { values = { [page]: 'Something.' }, ...rest } = more;
  count += 1;
  return {
    id: `e${count}`,
    kind: 'guided',
    day: at.slice(0, 10),
    created: `${at}:00.000Z`,
    updated: `${at}:00.000Z`,
    journal: 'small',
    section,
    page,
    round: 1,
    time: 1,
    answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { ask: `Words of ${id}`, value }])),
    ...rest,
  };
}
