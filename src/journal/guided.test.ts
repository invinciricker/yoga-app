/**
 * The rules of a guided journal (docs/phases/phase-5.md, section 3), on the small test journal and on
 * the real Gratitude journal.
 */
import path from 'node:path';

import { guidedJournal, type GuidedJournal } from '../../shared/content-schema';
import { readContent } from '../../tools/content/read';

import {
  isOpenToday,
  isVisible,
  journalToday,
  nextPageOf,
  pageAt,
  pageNumber,
  pageNumberText,
  progressOf,
  recallOf,
} from './guided';
import { rawTestJournal, testJournal, wrote } from './testJournal';
import type { JournalEntry } from './types';

const step = (section: string, page: string, round = 1, time = 1) => ({ section, page, round, time });
const j = testJournal;

describe('nextPageOf', () => {
  it('starts at the first page', () => {
    expect(nextPageOf(j, [])).toEqual(step('week', 'a'));
  });

  it('goes through the sections, their repeats and their times, in order', () => {
    const order: string[] = [];
    const entries: JournalEntry[] = [];
    for (let i = 0; i < 13; i++) {
      const next = nextPageOf(j, entries)!;
      order.push(`${next.page}${next.round}.${next.time}`);
      entries.push(wrote(next.page, `2026-11-${String(i + 1).padStart(2, '0')}T20:00`, { section: next.section, round: next.round, time: next.time }));
    }
    expect(order).toEqual(['a1.1', 'b1.1', 'c1.1', 's11.1', 's21.1', 'r1.1', 'r1.2', 'r2.1', 'r2.2', 'k11.1', 'k21.1', 'k12.1', 'k22.1']);
  });

  it('counts a skipped page as passed', () => {
    expect(nextPageOf(j, [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00', { skipped: true, values: {} })])).toEqual(step('week', 'c'));
  });

  it('never sends anyone back: the next page follows the furthest page done, whatever the order of writing', () => {
    // Page c done, then page a reread and changed later: still after c.
    const entries = [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00'), wrote('c', '2026-11-19T20:00')];
    entries[0] = { ...entries[0], updated: '2026-11-25T08:00:00.000Z' };
    expect(nextPageOf(j, entries)).toEqual(step('setup', 's1'));
  });

  it('keeps going forward when a page is added in a part already passed', () => {
    const entries = [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00'), wrote('c', '2026-11-19T20:00')];
    const added = structuredClone(rawTestJournal);
    added.sections[0].pages.splice(1, 0, { id: 'new', title: 'New', prompts: [{ kind: 'text', id: 'n', ask: 'New?' }] } as never);
    expect(nextPageOf(guidedJournal.parse(added), entries)).toEqual(step('setup', 's1'));
  });

  it('keeps going forward when the last page done is removed, or moved earlier', () => {
    const entries = [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00')];
    const removed = structuredClone(rawTestJournal);
    removed.sections[0].pages.splice(1, 1); // page b is gone
    expect(nextPageOf(guidedJournal.parse(removed), entries)).toEqual(step('week', 'c'));

    const moved = structuredClone(rawTestJournal);
    const [b] = moved.sections[0].pages.splice(1, 1);
    moved.sections[0].pages.unshift(b); // b, a, c: the furthest done is now a
    expect(nextPageOf(guidedJournal.parse(moved), entries)).toEqual(step('week', 'c'));
  });

  it('finds a page moved to another section, and keeps going from there', () => {
    const entries = [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00')];
    const moved = structuredClone(rawTestJournal);
    const [b] = moved.sections[0].pages.splice(1, 1);
    moved.sections[1].pages.push(b); // b now ends the setup section
    const journal = guidedJournal.parse(moved);
    expect(pageAt(journal, { section: 'week', page: 'b' })?.section.id).toBe('setup');
    expect(nextPageOf(journal, entries)).toEqual(step('twice', 'r'));
  });

  it('keeps going forward when a whole section is removed', () => {
    const entries = ['a', 'b', 'c', 's1', 's2'].map((p, i) => wrote(p, `2026-11-${10 + i}T20:00`));
    const removed = structuredClone(rawTestJournal);
    removed.sections.splice(1, 1); // the setup section is gone
    // The furthest page that still exists is c: the next is the first page of "twice".
    expect(nextPageOf(guidedJournal.parse(removed), entries)).toEqual(step('twice', 'r'));
  });

  it('leaves out the pages of other journals and free pages', () => {
    const other = { ...wrote('a', '2026-11-17T20:00'), journal: 'other' };
    const free: JournalEntry = { id: 'f', kind: 'free', day: '2026-11-17', created: 'x', updated: 'x', text: 'Hello' };
    expect(nextPageOf(j, [other, free])).toEqual(step('week', 'a'));
  });

  it('gives nothing once a journal without a pool is finished', () => {
    const short = guidedJournal.parse({ ...rawTestJournal, sections: [rawTestJournal.sections[0]] });
    const entries = ['a', 'b', 'c'].map((p, i) => wrote(p, `2026-11-${10 + i}T20:00`));
    expect(nextPageOf(short, entries)).toBeUndefined();
  });

  it('moves on when a section now repeats fewer times than the person already did', () => {
    const fewer = structuredClone(rawTestJournal);
    (fewer.sections[2] as { repeat?: number }).repeat = 1;
    const entries = [wrote('r', '2026-11-20T20:00', { round: 2, time: 1 })];
    expect(nextPageOf(guidedJournal.parse(fewer), entries)).toEqual(step('pool', 'k1'));
  });
});

describe('isOpenToday: one new page a day', () => {
  const today = '2026-11-20';

  it('is open when nothing of the journal was written today', () => {
    expect(isOpenToday(j, [wrote('a', '2026-11-19T20:00')], today)).toBe(true);
  });

  it('waits for tomorrow once a page was written today', () => {
    expect(isOpenToday(j, [wrote('a', '2026-11-20T08:00')], today)).toBe(false);
  });

  it('does not count a skipped page: a skip does not use up the day', () => {
    expect(isOpenToday(j, [wrote('a', '2026-11-19T20:00'), wrote('b', '2026-11-20T08:00', { skipped: true, values: {} })], today)).toBe(true);
  });

  it('lets every page of a "together" section be written on one day, but not the page after it', () => {
    const done = ['a', 'b', 'c'].map((p, i) => wrote(p, `2026-11-${17 + i}T20:00`));
    expect(isOpenToday(j, [...done, wrote('s1', '2026-11-20T08:00')], today)).toBe(true);
    expect(isOpenToday(j, [...done, wrote('s1', '2026-11-20T08:00'), wrote('s2', '2026-11-20T08:10')], today)).toBe(false);
  });

  it('belongs to the day it was first written: begun at 23:55, finished at 00:10, the next page opens on the new day', () => {
    const begun = wrote('a', '2026-11-19T23:55', { updated: '2026-11-20T00:10:00.000Z' });
    expect(isOpenToday(j, [begun], '2026-11-20')).toBe(true);
    expect(nextPageOf(j, [begun])).toEqual(step('week', 'b'));
  });

  it('changes nothing after a missed week: the next page waits where it was', () => {
    const entries = [wrote('a', '2026-11-01T20:00')];
    expect(nextPageOf(j, entries)).toEqual(step('week', 'b'));
    expect(isOpenToday(j, entries, '2026-11-09')).toBe(true);
  });
});

describe('pageNumber', () => {
  it('counts every page before the pool: "Page 6 of 9"', () => {
    expect(pageNumberText(pageNumber(j, step('week', 'a'))!)).toBe('Page 1 of 9');
    expect(pageNumberText(pageNumber(j, step('setup', 's2'))!)).toBe('Page 5 of 9');
    expect(pageNumberText(pageNumber(j, step('twice', 'r', 2, 1))!)).toBe('Page 8 of 9');
  });

  it('counts inside the pool, round after round: "Keep going · 4"', () => {
    expect(pageNumberText(pageNumber(j, step('pool', 'k1'))!)).toBe('Keep going · 1');
    expect(pageNumberText(pageNumber(j, step('pool', 'k2', 2))!)).toBe('Keep going · 4');
  });

  it('knows nothing of a page that is not there', () => {
    expect(pageNumber(j, step('week', 'gone'))).toBeUndefined();
  });
});

describe('isVisible', () => {
  const [, felt, noteIfNo, , why, more] = pageAt(j, step('week', 'b'))!.page.prompts;
  const ans = (values: Record<string, string | string[] | boolean>) =>
    Object.fromEntries(Object.entries(values).map(([k, value]) => [k, { ask: k, value }]));

  it('shows a prompt without showIf', () => {
    expect(isVisible(pageAt(j, step('week', 'a'))!.page.prompts[1], {})).toBe(true);
  });

  it('shows a prompt when the earlier answer is the one named', () => {
    expect(isVisible(felt, {})).toBe(false);
    expect(isVisible(felt, ans({ sent: true }))).toBe(true);
    expect(isVisible(felt, ans({ sent: false }))).toBe(false);
    expect(isVisible(noteIfNo, ans({ sent: false }))).toBe(true);
  });

  it('reads a choice of several: the one named is among those chosen', () => {
    expect(isVisible(why, ans({ often: ['Rarely'] }))).toBe(false);
    expect(isVisible(why, ans({ often: ['Rarely', 'Often'] }))).toBe(true);
  });

  it('shows on any answer with answered: true, but not on empty words', () => {
    expect(isVisible(more, ans({ why: '  ' }))).toBe(false);
    expect(isVisible(more, ans({ why: 'Because.' }))).toBe(true);
  });
});

describe('recallOf', () => {
  const first = wrote('a', '2026-11-17T20:00', { values: { good: ['Tea', 'Sun', ''] } });
  const later = wrote('k1', '2026-12-01T20:00', { section: 'pool', values: { k1: 'Rain.' } });
  const latest = wrote('k1', '2026-12-03T20:00', { section: 'pool', round: 2, values: { k1: 'Snow.' } });

  it('gives the first or the latest answer, with its day', () => {
    const entries = [latest, first, later];
    expect(recallOf(j, entries, 'good', 'first')).toEqual({ ask: 'Words of good', value: ['Tea', 'Sun', ''], day: '2026-11-17' });
    expect(recallOf(j, entries, 'k1', 'latest')).toMatchObject({ value: 'Snow.', day: '2026-12-03' });
    expect(recallOf(j, entries, 'k1', 'first')).toMatchObject({ value: 'Rain.' });
  });

  it('never counts the page being written', () => {
    expect(recallOf(j, [later, latest], 'k1', 'latest', latest.id)).toMatchObject({ value: 'Rain.' });
  });

  it('gives nothing when nothing was answered', () => {
    expect(recallOf(j, [], 'good', 'first')).toBeUndefined();
    expect(recallOf(j, [wrote('a', '2026-11-17T20:00', { values: { good: ['', ''] } })], 'good', 'first')).toBeUndefined();
  });
});

describe('journalToday: what Today and the Journal tab suggest', () => {
  const second = guidedJournal.parse({ ...rawTestJournal, slug: 'second', title: 'Second', order: 2 });
  const journals = [second, j];
  const today = '2026-11-20';
  const inSecond = (page: string, at: string) => ({ ...wrote(page, at), journal: 'second' });

  it('offers to begin the first journal, by order, when nothing is started', () => {
    expect(journalToday(journals, [], today, [])).toMatchObject({ kind: 'begin', journal: { slug: 'small' } });
  });

  it('offers the next page of a journal begun but not yet written in', () => {
    expect(journalToday(journals, [], today, ['small'])).toMatchObject({ kind: 'write', journal: { slug: 'small' }, step: step('week', 'a') });
  });

  it('offers, among the journals started, the one written least recently', () => {
    const entries = [wrote('a', '2026-11-18T20:00'), inSecond('a', '2026-11-19T20:00')];
    expect(journalToday(journals, entries, today, [])).toMatchObject({ kind: 'write', journal: { slug: 'small' }, step: step('week', 'b') });
  });

  it('skips a journal whose page is written today', () => {
    const entries = [wrote('a', '2026-11-20T08:00'), inSecond('a', '2026-11-19T20:00')];
    expect(journalToday(journals, entries, today, [])).toMatchObject({ kind: 'write', journal: { slug: 'second' } });
  });

  it('says the page is written when every started journal is written today', () => {
    const page = wrote('a', '2026-11-20T08:00');
    expect(journalToday(journals, [page], today, [])).toEqual({ kind: 'written', journal: j, entry: page });
  });

  it('suggests nothing without journals', () => {
    expect(journalToday([], [], today, [])).toBeUndefined();
  });
});

describe('progressOf', () => {
  it('says not started, then where the person is', () => {
    expect(progressOf(j, [], [])).toMatchObject({ started: false, total: 9, done: 0 });
    const entries = [wrote('a', '2026-11-17T20:00'), wrote('b', '2026-11-18T20:00')];
    expect(progressOf(j, entries, [])).toMatchObject({ started: true, total: 9, done: 2, pool: 0, finished: false });
  });

  it('counts the pages written in the pool', () => {
    const entries = [wrote('k2', '2026-12-01T20:00', { section: 'pool', round: 2 })];
    expect(progressOf(j, entries, [])).toMatchObject({ done: 9, pool: 4 });
  });
});

describe('the Gratitude journal', () => {
  let gratitude: GuidedJournal;
  beforeAll(async () => {
    const { loaded } = await readContent(path.join(__dirname, '..', '..', 'content'));
    gratitude = guidedJournal.parse(loaded!.guidedJournals.find((g) => g.slug === 'gratitude')!.built);
  });

  it('has 28 numbered pages, then a pool that keeps going', () => {
    expect(pageNumberText(pageNumber(gratitude, { section: 'week-1', page: 'd06', round: 1, time: 1 })!)).toBe('Page 6 of 28');
    expect(pageNumberText(pageNumber(gratitude, { section: 'keep-going', page: 'k04', round: 1, time: 1 })!)).toBe('Keep going · 4');
    expect(pageNumberText(pageNumber(gratitude, { section: 'keep-going', page: 'k01', round: 2, time: 1 })!)).toBe('Keep going · 21');
  });

  it('starts the pool again from its first page after its last', () => {
    const e = { ...wrote('k20', '2026-12-30T20:00'), journal: 'gratitude', section: 'keep-going' };
    expect(nextPageOf(gratitude, [e])).toEqual({ section: 'keep-going', page: 'k01', round: 2, time: 1 });
  });
});
