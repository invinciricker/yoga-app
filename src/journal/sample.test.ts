/**
 * The sample journal pages (docs/phases/phase-5.md, section 7), on the real Gratitude journal.
 */
import path from 'node:path';

import { guidedJournal, type GuidedJournal } from '../../shared/content-schema';
import { readContent } from '../../tools/content/read';

import { isOpenToday, journalToday, nextPageOf } from './guided';
import { sampleJournal } from './sample';

let gratitude: GuidedJournal;
beforeAll(async () => {
  const { loaded } = await readContent(path.join(__dirname, '..', '..', 'content'));
  gratitude = guidedJournal.parse(loaded!.guidedJournals.find((g) => g.slug === 'gratitude')!.built);
});

it('starts the Gratitude journal six days ago, with five pages written, one of them yesterday, and two free pages', () => {
  const today = '2026-11-20';
  const { entries, begun, days } = sampleJournal([gratitude], today);
  const guided = entries.filter((e) => e.kind === 'guided');
  expect(guided.map((e) => [e.page, e.day])).toEqual([
    ['d01', '2026-11-14'],
    ['d02', '2026-11-15'],
    ['d03', '2026-11-16'],
    ['d04', '2026-11-18'],
    ['d05', '2026-11-19'],
  ]);
  expect(guided[0].answers?.['g-start-satisfaction']).toEqual({ ask: expect.stringContaining('satisfied'), value: 6 });
  expect(entries.filter((e) => e.kind === 'free')).toHaveLength(2);
  expect(begun).toEqual(['gratitude']);
  // Every page lights its candle; today is still open.
  expect(days).toHaveLength(7);
  expect(nextPageOf(gratitude, entries)).toMatchObject({ page: 'd06' });
  expect(isOpenToday(gratitude, entries, today)).toBe(true);
  expect(journalToday([gratitude], entries, today, begun)).toMatchObject({ kind: 'write', page: { id: 'd06' } });
});

it('gives only the free pages without journals', () => {
  const { entries, begun } = sampleJournal([], '2026-11-20');
  expect(entries.map((e) => e.kind)).toEqual(['free', 'free']);
  expect(begun).toEqual([]);
});
