import { areas } from '@/config';

import {
  addDays,
  lessonEntry,
  longestStreak,
  nextStep,
  parseEntries,
  streak,
  totals,
  week,
  type DayEntry,
  type DayKind,
} from './record';

/** One entry on a day. Minutes 12 unless said. */
const did = (day: string, ref = 'wind-down', minutes = 12, kind: DayKind = 'move'): DayEntry => ({
  day,
  kind,
  ref,
  minutes,
  at: `${day}T19:00:00.000Z`,
});

describe('addDays', () => {
  it('moves across the end of a month and of a year', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is not moved by a change of summer time', () => {
    // Europe moves its clocks on the last Sundays of March and October; the US in March and November.
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-03-30', -1)).toBe('2026-03-29');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-10-26', -1)).toBe('2026-10-25');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });
});

describe('streak', () => {
  it('is 0 when nothing was ever done', () => {
    expect(streak([], '2026-11-17')).toBe(0);
  });

  it('counts the days in a row ending today', () => {
    const entries = [did('2026-11-14'), did('2026-11-15'), did('2026-11-16'), did('2026-11-17')];
    expect(streak(entries, '2026-11-17')).toBe(4);
  });

  it('still counts a streak ending yesterday: the candle burns until midnight', () => {
    const entries = [did('2026-11-15'), did('2026-11-16')];
    expect(streak(entries, '2026-11-17')).toBe(2);
  });

  it('is 0 once a whole day was missed', () => {
    const entries = [did('2026-11-14'), did('2026-11-15')];
    expect(streak(entries, '2026-11-17')).toBe(0);
  });

  it('stops at the first gap', () => {
    const entries = [did('2026-11-10'), did('2026-11-11'), did('2026-11-13'), did('2026-11-14')];
    expect(streak(entries, '2026-11-14')).toBe(2);
  });

  it('crosses the end of a month and of a year', () => {
    expect(streak([did('2026-10-30'), did('2026-10-31'), did('2026-11-01')], '2026-11-01')).toBe(3);
    expect(streak([did('2026-12-31'), did('2027-01-01')], '2027-01-01')).toBe(2);
  });

  it('crosses a change of summer time', () => {
    expect(streak([did('2026-03-28'), did('2026-03-29'), did('2026-03-30')], '2026-03-30')).toBe(3);
    expect(streak([did('2026-10-24'), did('2026-10-25'), did('2026-10-26')], '2026-10-26')).toBe(3);
  });

  it('lights one candle for the same lesson done twice in a day', () => {
    expect(streak([did('2026-11-17'), did('2026-11-17')], '2026-11-17')).toBe(1);
  });

  it('counts every kind of thing done, and lessons no longer in the content', () => {
    const entries = [did('2026-11-16', 'a-lesson-that-is-gone'), did('2026-11-17', 'box', 3, 'breathe')];
    expect(streak(entries, '2026-11-17')).toBe(2);
  });

  it('never counts days after today (a clock moved back)', () => {
    expect(streak([did('2026-11-18')], '2026-11-17')).toBe(0);
  });
});

describe('the day an entry belongs to', () => {
  it('is the day the closing screen opened: a lesson finished at 23:58 and closed at 00:01 counts for the new day', () => {
    // The closing screen writes dayOf(the moment it opens); the streak reads that day only.
    const late = did('2026-11-16');
    const afterMidnight = did('2026-11-17');
    expect(streak([late, afterMidnight], '2026-11-17')).toBe(2);
    expect(week([afterMidnight], '2026-11-17').find((d) => d.isToday)?.lit).toBe(true);
  });
});

describe('longestStreak', () => {
  it('is 0 with nothing done', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('finds the longest run, wherever it is, in any order', () => {
    const entries = [
      did('2026-11-17'),
      did('2026-11-01'),
      did('2026-11-02'),
      did('2026-11-03'),
      did('2026-11-03'),
      did('2026-11-10'),
      did('2026-11-11'),
    ];
    expect(longestStreak(entries)).toBe(3);
  });

  it('crosses the end of a month', () => {
    expect(longestStreak([did('2026-11-29'), did('2026-11-30'), did('2026-12-01'), did('2026-12-02')])).toBe(4);
  });
});

describe('week', () => {
  it('runs Monday to Sunday around today', () => {
    // 17 Nov 2026 is a Tuesday.
    const days = week([], '2026-11-17');
    expect(days.map((d) => d.day)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(days.map((d) => d.letter)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(days.map((d) => d.isToday)).toEqual([false, true, false, false, false, false, false]);
    expect(days.map((d) => d.isFuture)).toEqual([false, false, true, true, true, true, true]);
  });

  it('on a Sunday, still starts on the Monday before', () => {
    const days = week([], '2026-11-22');
    expect(days[0].day).toBe('2026-11-16');
    expect(days[6]).toMatchObject({ day: '2026-11-22', isToday: true, isFuture: false });
  });

  it('on a Monday, starts today', () => {
    expect(week([], '2026-11-16')[0]).toMatchObject({ day: '2026-11-16', isToday: true });
  });

  it('lights the days with something done', () => {
    const entries = [did('2026-11-15'), did('2026-11-16'), did('2026-11-16'), did('2026-11-18')];
    expect(week(entries, '2026-11-18').map((d) => d.lit)).toEqual([true, false, true, false, false, false, false]);
  });

  it('crosses the end of a month', () => {
    const days = week([did('2026-12-01')], '2026-12-02');
    expect(days[0].day).toBe('2026-11-30');
    expect(days[1]).toMatchObject({ day: '2026-12-01', lit: true });
  });
});

describe('totals', () => {
  it('adds up distinct days, every minute and every lesson', () => {
    const entries = [did('2026-11-16', 'a', 12), did('2026-11-17', 'a', 12), did('2026-11-17', 'b', 6)];
    expect(totals(entries)).toEqual({ days: 2, minutes: 30, lessons: 3 });
  });

  it('counts the same lesson twice in a day twice, in lessons and in minutes', () => {
    expect(totals([did('2026-11-17', 'a', 12), did('2026-11-17', 'a', 12)])).toEqual({ days: 1, minutes: 24, lessons: 2 });
  });

  it('keeps lessons no longer in the content, and counts only lessons as lessons', () => {
    const entries = [did('2026-11-17', 'gone', 10), did('2026-11-17', 'box', 3, 'breathe')];
    expect(totals(entries)).toEqual({ days: 1, minutes: 13, lessons: 1 });
  });

  it('is all zero with nothing done', () => {
    expect(totals([])).toEqual({ days: 0, minutes: 0, lessons: 0 });
  });
});

describe('nextStep', () => {
  const today = '2026-11-17';
  const all = { breathe: true, meditate: true, journal: true };

  it('in Phase 7 (Breathe and the Journal built): breath after a lesson, then a line in the journal', () => {
    expect(nextStep('move', [], today, areas)).toBe('breathe');
    expect(nextStep('move', [did(today, 'box', 3, 'breathe')], today, areas)).toBe('write');
    expect(nextStep('move', [did(today, 'box', 3, 'breathe'), did(today, 'page-1', 2, 'write')], today, areas)).toBeUndefined();
    // After breathing, Meditate is not built yet: "Write a line about it?", or nothing.
    expect(nextStep('breathe', [], today, areas)).toBe('write');
    expect(nextStep('breathe', [did(today, 'page-1', 2, 'write')], today, areas)).toBeUndefined();
  });

  it('skips Breathe when it has nothing to show (useAreas): a line in the journal after a lesson', () => {
    expect(nextStep('move', [], today, { ...areas, breathe: false })).toBe('write');
  });

  it('offers the next kind in the order move → breathe → sit → write', () => {
    expect(nextStep('move', [], today, all)).toBe('breathe');
    expect(nextStep('breathe', [], today, all)).toBe('sit');
    expect(nextStep('sit', [], today, all)).toBe('write');
  });

  it('offers nothing after writing', () => {
    expect(nextStep('write', [], today, all)).toBeUndefined();
  });

  it('skips what is not built', () => {
    expect(nextStep('move', [], today, { breathe: false, meditate: true, journal: true })).toBe('sit');
    expect(nextStep('move', [], today, { breathe: false, meditate: false, journal: true })).toBe('write');
  });

  it('skips what was already done today, not what was done before', () => {
    const breathedToday = [did(today, 'box', 3, 'breathe')];
    expect(nextStep('move', breathedToday, today, all)).toBe('sit');
    const breathedYesterday = [did('2026-11-16', 'box', 3, 'breathe')];
    expect(nextStep('move', breathedYesterday, today, all)).toBe('breathe');
  });

  it('offers nothing when everything after is done today', () => {
    const entries = [did(today, 'box', 3, 'breathe'), did(today, 'timer', 5, 'sit'), did(today, 'page', 2, 'write')];
    expect(nextStep('move', entries, today, all)).toBeUndefined();
  });
});

describe('parseEntries', () => {
  it('reads back what was saved', () => {
    const entries = [did('2026-11-16'), did('2026-11-17', 'box', 3, 'breathe')];
    expect(parseEntries(JSON.parse(JSON.stringify(entries)))).toEqual(entries);
  });

  it('survives a broken or empty file', () => {
    expect(parseEntries(undefined)).toEqual([]);
    expect(parseEntries('nonsense')).toEqual([]);
    expect(parseEntries({ day: '2026-11-17' })).toEqual([]);
  });

  it('leaves out what is not a whole entry, and keeps the rest', () => {
    const raw = [did('2026-11-17'), null, { ...did('2026-11-17'), kind: 'dance' }, { ...did('2026-11-17'), day: '17/11/2026' }, { day: '2026-11-17' }];
    expect(parseEntries(raw)).toEqual([did('2026-11-17')]);
  });

  it('ignores fields it does not know (a later version may add some)', () => {
    expect(parseEntries([{ ...did('2026-11-17'), mood: 'calm' }])).toEqual([did('2026-11-17')]);
  });
});

describe('lessonEntry', () => {
  it('is written on the day the closing screen opens, in whole minutes, at least 1', () => {
    const justAfterMidnight = new Date(2026, 10, 17, 0, 1);
    expect(lessonEntry({ slug: 'wind-down', minutes: 12 }, justAfterMidnight)).toMatchObject({
      day: '2026-11-17',
      kind: 'move',
      ref: 'wind-down',
      minutes: 12,
    });
    expect(lessonEntry({ slug: 'x', minutes: 0 }, justAfterMidnight).minutes).toBe(1);
  });

  it('a lesson finished at 23:58 whose closing screen opens at 00:01 counts for the new day', () => {
    const entry = lessonEntry({ slug: 'wind-down', minutes: 12 }, new Date(2026, 10, 30, 0, 1));
    expect(entry.day).toBe('2026-11-30');
    expect(streak([did('2026-11-29'), entry], '2026-11-30')).toBe(2);
  });
});
