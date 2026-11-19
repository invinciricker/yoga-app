/**
 * The sample journal pages (docs/phases/phase-5.md, section 7, and docs/phases/phase-6.md, section 5),
 * on the real Gratitude, Habit and Health journals.
 */
import path from 'node:path';

import { guidedJournal, type GuidedJournal } from '../../shared/content-schema';
import { readContent } from '../../tools/content/read';

import { dotsOf } from './dots';
import { isOpenToday, journalToday, nextPageOf, pageNumber, pageNumberText, progressOf } from './guided';
import { sampleJournal } from './sample';

let gratitude: GuidedJournal;
let habit: GuidedJournal;
let health: GuidedJournal;
beforeAll(async () => {
  const { loaded } = await readContent(path.join(__dirname, '..', '..', 'content'));
  const read = (slug: string) => guidedJournal.parse(loaded!.guidedJournals.find((g) => g.slug === slug)!.built);
  [gratitude, habit, health] = [read('gratitude'), read('habit'), read('health')];
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

describe('Phase 6: the Habit and Health samples', () => {
  const today = '2026-11-20';
  it('set up Habit 17 days ago, then two full weeks (11 Yes, 3 No), the latest yesterday: next is Week 3 · Day 1', () => {
    const { entries, begun } = sampleJournal([gratitude, habit, health], today);
    const pages = entries.filter((e) => e.journal === 'habit');
    expect(pages).toHaveLength(17);
    expect(pages.slice(0, 3).map((e) => [e.page, e.day])).toEqual([
      ['s01', '2026-11-03'],
      ['s02', '2026-11-03'],
      ['s03', '2026-11-03'],
    ]);
    expect(pages[pages.length - 1].day).toBe('2026-11-19');
    const did = pages.slice(3).map((e) => e.answers?.['h-did']?.value);
    expect([did.filter((v) => v === true).length, did.filter((v) => v === false).length]).toEqual([11, 3]);
    expect(pageNumberText(pageNumber(habit, nextPageOf(habit, pages)!)!)).toBe('Week 3 · Day 1');
    expect(begun).toEqual(['gratitude', 'habit', 'health']);
    // The second week's dots: 6 of 7, the automatic feeling higher than in week 1.
    const week = { section: 'days', round: 2, page: 'week', time: 1 };
    const saved = pages.find((e) => e.round === 2 && e.page === 'week')!;
    const [didRow, autoRow] = dotsOf(habit, pages, week, [{ of: 'h-did', label: 'Did it' }, { of: 'h-auto', label: 'Automatic' }], { id: saved.id, answers: saved.answers! });
    expect(didRow.values.filter((v) => v === true)).toHaveLength(6);
    expect(autoRow.values).toEqual([3, 3, 4, undefined, 3, 4, 4]);
  });

  it('begin Health 9 days ago: a full week with its look back, a day missed, then yesterday: next is Week 2 · Day 2', () => {
    const { entries } = sampleJournal([gratitude, habit, health], today);
    const pages = entries.filter((e) => e.journal === 'health');
    expect(pages.map((e) => e.day)).toEqual(['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-19']);
    expect(pages[6]).toMatchObject({ page: 'week', round: 1 });
    expect(pages[6].answers?.['hl-change']?.value).toBe('A ten-minute walk after lunch');
    expect(progressOf(health, pages, ['health'])).toMatchObject({ number: { kind: 'week', week: 2, day: 2 }, done: 1 });
    expect(isOpenToday(health, pages, today)).toBe(true);
  });
});
