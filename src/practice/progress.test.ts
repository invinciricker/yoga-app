import type { DayEntry } from '@/day/record';
import { testContent as content } from '@/content/testContent';

import { doneLine, historyDays, isDone, lastDone, savedLessons, seriesProgress } from './progress';

const did = (day: string, ref: string, minutes = 12, at = `${day}T19:00:00.000Z`): DayEntry => ({
  day,
  kind: 'move',
  ref,
  minutes,
  at,
});

describe('isDone and lastDone', () => {
  const entries = [did('2026-11-10', 'wind-down'), did('2026-11-16', 'wind-down'), did('2026-11-12', 'breath')];

  it('knows whether a lesson was ever done', () => {
    expect(isDone(entries, 'wind-down')).toBe(true);
    expect(isDone(entries, 'morning')).toBe(false);
  });

  it('gives the latest day a lesson was done, in any order', () => {
    expect(lastDone(entries, 'wind-down')).toBe('2026-11-16');
    expect(lastDone(entries, 'morning')).toBeUndefined();
  });

  it('only counts lessons, not a breath with the same name', () => {
    const breath: DayEntry = { ...did('2026-11-17', 'morning'), kind: 'breathe' };
    expect(isDone([breath], 'morning')).toBe(false);
  });
});

describe('seriesProgress', () => {
  const series = ['one', 'two', 'three', 'four'];

  it('is nothing done, and the first lesson next, before the series is begun', () => {
    expect(seriesProgress([], series)).toEqual({ done: 0, total: 4, next: 'one' });
  });

  it('counts the lessons done, each once, and offers the first one not done, in order', () => {
    const entries = [did('2026-11-15', 'one'), did('2026-11-16', 'three'), did('2026-11-17', 'one')];
    expect(seriesProgress(entries, series)).toEqual({ done: 2, total: 4, next: 'two' });
  });

  it('offers nothing next once every lesson is done', () => {
    const entries = series.map((slug) => did('2026-11-17', slug));
    expect(seriesProgress(entries, series)).toEqual({ done: 4, total: 4, next: undefined });
  });

  it('ignores lessons done outside the series', () => {
    expect(seriesProgress([did('2026-11-17', 'elsewhere')], series).done).toBe(0);
  });
});

describe('doneLine', () => {
  const today = '2026-11-17';

  it('says today, yesterday, or the date', () => {
    expect(doneLine('2026-11-17', today)).toBe('Done today');
    expect(doneLine('2026-11-16', today)).toBe('Done yesterday');
    expect(doneLine('2026-11-02', today)).toBe('Done on 2 November');
  });

  it('says yesterday across the end of a month', () => {
    expect(doneLine('2026-10-31', '2026-11-01')).toBe('Done yesterday');
  });

  it('adds the year when it was another year', () => {
    expect(doneLine('2025-12-30', '2026-01-05')).toBe('Done on 30 December 2025');
  });
});

describe('savedLessons', () => {
  it('keeps the order of saving and skips lessons no longer in the content', () => {
    const lessons = savedLessons(content, ['legs', 'a-lesson-that-is-gone', 'morning']);
    expect(lessons.map((l) => l.slug)).toEqual(['legs', 'morning']);
  });
});

describe('historyDays', () => {
  const today = '2026-11-17';

  it('groups by day, newest day first, newest first within a day', () => {
    const entries = [
      did('2026-11-15', 'legs', 25),
      did('2026-11-17', 'wind-down', 12, '2026-11-17T08:00:00.000Z'),
      did('2026-11-17', 'breath', 6, '2026-11-17T20:00:00.000Z'),
      did('2026-11-16', 'morning', 18),
    ];
    const days = historyDays(entries, content, today);
    expect(days.map((d) => d.label)).toEqual(['Today', 'Yesterday', '15 November']);
    expect(days[0].items.map((i) => (i.kind === 'move' ? i.lesson.slug : ''))).toEqual(['breath', 'wind-down']);
    expect(days[2].items[0].minutes).toBe(25);
  });

  it('shows the same lesson done twice in a day twice', () => {
    const entries = [did(today, 'wind-down', 12, `${today}T08:00:00.000Z`), did(today, 'wind-down', 12, `${today}T20:00:00.000Z`)];
    expect(historyDays(entries, content, today)[0].items).toHaveLength(2);
  });

  it('skips lessons no longer in the content, and days left empty by them', () => {
    const entries = [did(today, 'a-lesson-that-is-gone'), did('2026-11-16', 'morning')];
    const days = historyDays(entries, content, today);
    expect(days.map((d) => d.label)).toEqual(['Yesterday']);
  });

  it('lists breathing sessions too, under their day, with their minutes (Phase 7)', () => {
    const entries: DayEntry[] = [
      did(today, 'wind-down', 12, `${today}T08:00:00.000Z`),
      { day: today, kind: 'breathe', ref: 'long-exhale', minutes: 3, at: `${today}T20:00:00.000Z` },
      { day: '2026-11-16', kind: 'breathe', ref: 'box', minutes: 5, at: '2026-11-16T07:00:00.000Z' },
    ];
    const days = historyDays(entries, content, today);
    expect(days.map((d) => d.items.map((i) => [i.kind, i.kind === 'breathe' ? i.exercise.title : i.lesson.title, i.minutes]))).toEqual([
      [
        ['breathe', 'Long exhale', 3],
        ['move', 'Evening wind-down', 12],
      ],
      [['breathe', 'Box', 5]],
    ]);
  });

  it('leaves out pages written, and exercises no longer in the content', () => {
    const write: DayEntry = { ...did(today, 'some-page'), kind: 'write' };
    const gone: DayEntry = { ...did(today, 'an-exercise-that-is-gone'), kind: 'breathe' };
    expect(historyDays([write, gone], content, today)).toEqual([]);
  });
});
