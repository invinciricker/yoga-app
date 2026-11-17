import { contentFile } from '../../shared/content-schema';
import { rawTestContent, testContent as content } from '@/content/testContent';

import type { DayEntry } from './record';
import { todayMove } from './todayMove';

const did = (day: string, ref: string): DayEntry => ({ day, kind: 'move', ref, minutes: 12, at: `${day}T19:00:00.000Z` });
/** Seven in the evening, on a day of November 2026. */
const on = (day: number) => new Date(2026, 10, day, 19, 0);

// A series of three lessons that all exist: "first" → "second" → "third".
const withSeries = contentFile.parse({
  ...rawTestContent,
  series: [
    ...rawTestContent.series,
    { slug: 'three', title: 'Three steps', summary: 'Three.', published: '2026-11-10', aura: 'moss', lessons: ['first', 'second', 'third'] },
  ],
  lessons: [
    ...rawTestContent.lessons,
    ...['first', 'second', 'third'].map((slug, i) => ({
      slug,
      title: `Step ${i + 1}`,
      summary: 'A step.',
      published: '2026-11-10',
      level: 'gentle',
      minutes: 10,
      focus: [],
      aura: 'moss',
      series: 'three',
      order: i + 1,
    })),
  ],
});

describe('todayMove', () => {
  it('is the featured lesson when no series is under way', () => {
    const move = todayMove(content, [], on(17));
    expect(move?.lesson.slug).toBe('wind-down');
    expect(move?.series).toBeUndefined();
    expect(move?.doneToday).toBe(false);
  });

  it('is the newest lesson when none is featured', () => {
    const plain = { ...content, lessons: content.lessons.map((l) => ({ ...l, featured: false })) };
    expect(todayMove(plain, [], on(17))?.lesson.slug).toBe('wind-down');
  });

  it('is nothing when there are no lessons', () => {
    expect(todayMove({ ...content, lessons: [], series: [] }, [], on(17))).toBeUndefined();
  });

  it('continues a series begun, not finished, and practised in the last 7 days', () => {
    const move = todayMove(withSeries, [did('2026-11-15', 'first')], on(17));
    expect(move?.lesson.slug).toBe('second');
    expect(move?.series).toMatchObject({ position: 2, count: 3 });
    expect(move?.series?.series.slug).toBe('three');
  });

  it('counts a series practised exactly 6 days ago, not 7', () => {
    expect(todayMove(withSeries, [did('2026-11-11', 'first')], on(17))?.lesson.slug).toBe('second');
    expect(todayMove(withSeries, [did('2026-11-10', 'first')], on(17))?.lesson.slug).toBe('wind-down');
  });

  it('does not continue a finished series', () => {
    const entries = ['first', 'second', 'third'].map((slug) => did('2026-11-16', slug));
    expect(todayMove(withSeries, entries, on(17))?.lesson.slug).toBe('wind-down');
  });

  it('continues the series practised most recently', () => {
    // "evenings" holds wind-down and breath (and a slug that is gone): breath is next there.
    const entries = [did('2026-11-14', 'first'), did('2026-11-16', 'wind-down')];
    expect(todayMove(withSeries, entries, on(17))?.lesson.slug).toBe('breath');
  });

  it('stays where it is once done today, with a tick', () => {
    // Yesterday: step 1. Today the card offered step 2; once done, it stays on step 2.
    const entries = [did('2026-11-16', 'first'), did('2026-11-17', 'second')];
    const move = todayMove(withSeries, entries, on(17));
    expect(move?.lesson.slug).toBe('second');
    expect(move?.doneToday).toBe(true);
  });

  it('stays on the featured lesson when it was the one done today, even if it begins a series', () => {
    const move = todayMove(content, [did('2026-11-17', 'wind-down')], on(17));
    expect(move?.lesson.slug).toBe('wind-down');
    expect(move?.doneToday).toBe(true);
  });

  it('ignores lessons no longer in the content', () => {
    expect(todayMove(withSeries, [did('2026-11-16', 'a-lesson-that-is-gone')], on(17))?.lesson.slug).toBe('wind-down');
  });
});
