/**
 * Reading pages back from the phone, and the small helpers on answers.
 */
import { writingMinutes } from './dates';
import { cycleOf, hasWriting, isEmptyValue, parseEntry, withAnswer, type JournalEntry } from './types';

const guided = {
  id: 'abc',
  kind: 'guided',
  day: '2026-11-20',
  created: '2026-11-20T20:00:00.000Z',
  updated: '2026-11-20T20:05:00.000Z',
  journal: 'gratitude',
  section: 'week-1',
  page: 'd01',
  round: 1,
  time: 1,
  answers: { 'g-d01-good': { ask: 'Three good things.', value: ['Tea', 'Sun', ''] } },
  titles: { journal: 'Gratitude', section: 'Week 1 · Noticing', page: 'Three good things' },
};

describe('parseEntry', () => {
  it('reads a guided page back as it was saved', () => {
    expect(parseEntry(JSON.parse(JSON.stringify(guided)))).toEqual(guided);
  });

  it('reads a free page, its prompt line kept', () => {
    const free = { id: 'f', kind: 'free', day: '2026-11-20', created: 'a', updated: 'b', text: 'Hello.', prompt: 'tomorrow' };
    expect(parseEntry(free)).toEqual(free);
  });

  it('keeps one answer of 10,000 characters whole', () => {
    const long = 'x'.repeat(10_000);
    const entry = parseEntry({ ...guided, answers: { why: { ask: 'Why?', value: long } } });
    expect(entry?.answers?.why.value).toBe(long);
  });

  it('leaves out what is broken, and a field it does not know changes nothing', () => {
    expect(parseEntry(null)).toBeUndefined();
    expect(parseEntry({ ...guided, day: 'Friday' })).toBeUndefined();
    expect(parseEntry({ ...guided, kind: 'drawing' })).toBeUndefined();
    expect(parseEntry({ ...guided, page: undefined })).toBeUndefined();
    expect(parseEntry({ ...guided, mood: 'a field from a later version' })).toEqual(guided);
  });

  it('leaves out one answer it cannot read, and keeps the others', () => {
    const entry = parseEntry({ ...guided, answers: { ...guided.answers, bad: { ask: 'Q', value: { x: 1 } }, worse: 'text' } });
    expect(Object.keys(entry!.answers!)).toEqual(['g-d01-good']);
  });

  it('reads a missing round or time as 1', () => {
    expect(parseEntry({ ...guided, round: undefined, time: 0 })).toMatchObject({ round: 1, time: 1 });
  });
});

describe('answers', () => {
  const page = parseEntry(guided) as JournalEntry;

  it('says nothing with empty words, empty lines or no choice; a number or a yes/no always says something', () => {
    expect([isEmptyValue(''), isEmptyValue('  '), isEmptyValue(['', ' ']), isEmptyValue([])]).toEqual([true, true, true, true]);
    expect([isEmptyValue(0), isEmptyValue(false), isEmptyValue('a'), isEmptyValue(['', 'b'])]).toEqual([false, false, false, false]);
  });

  it('sets an answer, and removes it when it says nothing', () => {
    const set = withAnswer(page, 'why', { ask: 'Why?', value: 'Because.' });
    expect(set.answers?.why).toEqual({ ask: 'Why?', value: 'Because.' });
    expect(withAnswer(set, 'why', { ask: 'Why?', value: '' }).answers?.why).toBeUndefined();
  });

  it('knows whether a page holds any writing', () => {
    expect(hasWriting(page)).toBe(true);
    expect(hasWriting({ ...page, answers: {} })).toBe(false);
    expect(hasWriting({ ...page, kind: 'free', text: ' ' })).toBe(false);
    expect(hasWriting({ ...page, kind: 'free', text: 'A line.' })).toBe(true);
  });
});

describe('writingMinutes', () => {
  const at = (minutes: number, seconds = 0) => Date.UTC(2026, 10, 20, 20, minutes, seconds);

  it('counts from opening the page to its last change, rounded up, 1 to 30', () => {
    expect(writingMinutes(at(0), at(0, 5))).toBe(1);
    expect(writingMinutes(at(0), at(2, 1))).toBe(3);
    expect(writingMinutes(at(0), at(59))).toBe(30);
  });

  it('runs across midnight like any other minute', () => {
    expect(writingMinutes(Date.UTC(2026, 10, 19, 23, 55), Date.UTC(2026, 10, 20, 0, 10))).toBe(15);
  });
});

describe('parseEntry, Phase 6', () => {
  const page = { id: 'h1', kind: 'guided', day: '2026-11-20', created: 'x', updated: 'x', journal: 'habit', section: 'days', page: 'day', answers: {} };
  it('reads the start a page was written in, and the suggestions tapped away', () => {
    expect(parseEntry({ ...page, cycle: 2, declined: ['hl-moved', 3] })).toMatchObject({ cycle: 2, declined: ['hl-moved'] });
  });
  it('leaves both out when absent or unreadable (absent means the first start)', () => {
    const read = parseEntry({ ...page, declined: [] })!;
    expect('cycle' in read || 'declined' in read).toBe(false);
    expect(cycleOf(read)).toBe(1);
    expect(parseEntry({ ...page, cycle: 'two' })!.cycle).toBe(1);
  });
});
