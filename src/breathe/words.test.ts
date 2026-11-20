import { testContent } from '@/content/testContent';
import { breatheEntry, type DayEntry } from '@/day/record';

import { breathedOn, breatheNow, byOrder, levelWords, roundInShort, stepLine, stepWay, stepWord } from './words';

const exercises = testContent.breath ?? [];
const find = (slug: string) => exercises.find((e) => e.slug === slug)!;

describe('the words of a step', () => {
  it('says the word, or the step’s own label', () => {
    expect(stepWord({ do: 'in', seconds: 4 })).toBe('In');
    expect(stepWord({ do: 'hold', seconds: 4 })).toBe('Hold');
    expect(stepWord({ do: 'in', seconds: 1, label: 'Top up' })).toBe('Top up');
  });

  it('says how: the side first, else the nose or the mouth, else nothing', () => {
    expect(stepWay({ do: 'in', seconds: 4, via: 'nose', side: 'left' })).toBe('left side');
    expect(stepWay({ do: 'out', seconds: 6, via: 'mouth' })).toBe('through the mouth');
    expect(stepWay({ do: 'out', seconds: 6 })).toBeUndefined();
  });

  it('gives the round in short', () => {
    expect(roundInShort(find('long-exhale').steps)).toBe('In 4 · Out 6');
    expect(roundInShort(find('the-sigh').steps)).toBe('In 2 · Top up 1 · Out 6');
    expect(roundInShort(find('box').steps)).toBe('In 4 · Hold 4 · Out 4 · Hold 4');
  });

  it('gives a step in words, one line each', () => {
    expect(stepLine({ do: 'in', seconds: 4, via: 'nose' })).toBe('In · 4 seconds · through the nose');
    expect(stepLine({ do: 'in', seconds: 1, via: 'nose', label: 'Top up' })).toBe('Top up · 1 second · through the nose');
    expect(stepLine({ do: 'out', seconds: 4, via: 'nose', side: 'right' })).toBe('Out · 4 seconds · through the nose · right side');
    expect(stepLine({ do: 'out', seconds: 6 })).toBe('Out · 6 seconds');
  });

  it('says the level of evidence in plain words, and nothing for a level it does not know', () => {
    expect(levelWords('early')).toEqual({ title: 'Early evidence', line: 'Only a little research so far.' });
    expect(levelWords(undefined)).toBeUndefined();
  });
});

describe('breatheNow', () => {
  const on = (hour: number) => new Date(2026, 10, 20, hour, 30);

  it('offers the exercise suggested for the part of the day', () => {
    expect(breatheNow(exercises, on(7))?.slug).toBe('even-breath');
    expect(breatheNow(exercises, on(14))?.slug).toBe('box');
    expect(breatheNow(exercises, on(21))?.slug).toBe('long-exhale');
  });

  it('follows the greeting’s hours: 11:59 is morning, 12:00 afternoon, 17:00 evening', () => {
    expect(breatheNow(exercises, new Date(2026, 10, 20, 11, 59))?.slug).toBe('even-breath');
    expect(breatheNow(exercises, new Date(2026, 10, 20, 12, 0))?.slug).toBe('box');
    expect(breatheNow(exercises, new Date(2026, 10, 20, 17, 0))?.slug).toBe('long-exhale');
  });

  it('without a suggestion for the part of the day, offers the first by order', () => {
    const noEvening = exercises.filter((e) => e.slug !== 'long-exhale');
    expect(breatheNow(noEvening, on(21))?.slug).toBe('even-breath');
  });

  it('takes the first by order when two are suggested for the same time', () => {
    const both = exercises.map((e) => (e.slug === 'the-sigh' ? { ...e, suggest: ['afternoon'] } : e));
    expect(breatheNow(both, on(14))?.slug).toBe('the-sigh');
  });

  it('offers nothing when there is nothing', () => {
    expect(breatheNow([], on(9))).toBeUndefined();
  });

  it('sorts by order, then by slug', () => {
    expect(byOrder(exercises).map((e) => e.slug)).toEqual(['long-exhale', 'even-breath', 'the-sigh', 'box']);
  });
});

describe('breathedOn and the entry of a session', () => {
  it('knows whether anything was breathed on a day', () => {
    const entries: DayEntry[] = [breatheEntry('box', 3, new Date(2026, 10, 19, 21, 0))];
    expect(breathedOn(entries, '2026-11-19')).toBe(true);
    expect(breathedOn(entries, '2026-11-20')).toBe(false);
    expect(breathedOn([{ ...entries[0], kind: 'move' }], '2026-11-19')).toBe(false);
  });

  it('a session that ends after midnight counts on the day it ended', () => {
    const entry = breatheEntry('long-exhale', 5, new Date(2026, 10, 21, 0, 2));
    expect(entry).toMatchObject({ day: '2026-11-21', kind: 'breathe', ref: 'long-exhale', minutes: 5 });
  });

  it('writes at least one minute, and keeps the name of the session it is given', () => {
    const entry = breatheEntry('box', 0, new Date(2026, 10, 20, 9, 0), 'session-1');
    expect(entry.minutes).toBe(1);
    expect(entry.at).toBe('session-1');
  });
});
