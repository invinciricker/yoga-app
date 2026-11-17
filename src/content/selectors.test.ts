import {
  dayOf,
  featuredLesson,
  notesOfKind,
  latestQuote,
  lessonsOfSeries,
  newestLessons,
  placeInSeries,
  searchLessons,
  seriesMinutes,
  seriesProgress,
} from './selectors';
import { testContent as content } from './testContent';

const slugs = (items: { slug: string }[]) => items.map((i) => i.slug);
/** A local time on a day of November 2026. */
const on = (day: number) => new Date(2026, 10, day, 19, 0);

describe('dayOf', () => {
  it('gives the local calendar day, also just before midnight', () => {
    expect(dayOf(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16');
    expect(dayOf(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

describe('featuredLesson', () => {
  it('is the newest lesson marked featured', () => {
    expect(featuredLesson(content, on(16))?.slug).toBe('wind-down');
  });

  it('is the newest lesson when none is featured', () => {
    const plain = { ...content, lessons: content.lessons.map((l) => ({ ...l, featured: false })) };
    expect(featuredLesson(plain, on(16))?.slug).toBe('wind-down');
    const older = { ...plain, lessons: plain.lessons.filter((l) => l.slug !== 'wind-down') };
    expect(featuredLesson(older, on(16))?.slug).toBe('morning');
  });

  it('keeps a lesson dated in the future for its day', () => {
    expect(featuredLesson(content, on(15))?.slug).toBe('morning');
    // …unless nothing else exists yet.
    expect(featuredLesson(content, on(1))?.slug).toBe('wind-down');
  });

  it('is nothing when there is no lesson', () => {
    expect(featuredLesson({ ...content, lessons: [] }, on(16))).toBeUndefined();
  });
});

describe('newestLessons', () => {
  it('lists the newest first, then by title, without the one on the big card', () => {
    expect(slugs(newestLessons(content, 5, 'wind-down'))).toEqual(['morning', 'breath', 'legs']);
    expect(slugs(newestLessons(content, 2))).toEqual(['wind-down', 'morning']);
  });
});

describe('series', () => {
  it('lists its lessons in order and skips one that is gone', () => {
    expect(slugs(lessonsOfSeries(content, 'evenings'))).toEqual(['wind-down', 'breath']);
    expect(lessonsOfSeries(content, 'nowhere')).toEqual([]);
    expect(seriesMinutes(content, 'evenings')).toBe(18);
  });

  it('knows the place of a lesson', () => {
    const breath = content.lessons.find((l) => l.slug === 'breath')!;
    expect(placeInSeries(content, breath)).toMatchObject({ position: 3, count: 3, series: { slug: 'evenings' } });
    const morning = content.lessons.find((l) => l.slug === 'morning')!;
    expect(placeInSeries(content, morning)).toBeUndefined();
  });

  it('has no progress until Phase 4', () => {
    expect(seriesProgress(content, 'evenings')).toBe(0);
  });
});

describe('searchLessons', () => {
  it('gives everything, newest first, for an empty search', () => {
    expect(slugs(searchLessons(content, '  '))).toEqual(['wind-down', 'morning', 'breath', 'legs']);
  });

  it('matches the title, the summary and the focus, whatever the capitals', () => {
    expect(slugs(searchLessons(content, 'BREATH'))).toEqual(['breath']);
    expect(slugs(searchLessons(content, 'sleep'))).toEqual(['wind-down', 'breath']);
    expect(slugs(searchLessons(content, 'whole body'))).toEqual(['morning']);
    expect(slugs(searchLessons(content, 'about strong'))).toEqual(['legs']);
    expect(searchLessons(content, 'zzz')).toEqual([]);
  });

  it('filters by level or by length, alone or with a search', () => {
    expect(slugs(searchLessons(content, '', 'gentle'))).toEqual(['wind-down', 'breath']);
    expect(slugs(searchLessons(content, '', 'strong'))).toEqual(['legs']);
    expect(slugs(searchLessons(content, '', 'short'))).toEqual(['wind-down', 'breath']);
    expect(slugs(searchLessons(content, 'breath', 'short'))).toEqual(['breath']);
    expect(searchLessons(content, 'breath', 'strong')).toEqual([]);
  });
});

describe('notes (the data key is still "journal")', () => {
  it('finds the newest entry with a saying', () => {
    expect(latestQuote(content)?.slug).toBe('slow');
    expect(latestQuote({ ...content, journal: content.journal.filter((j) => !j.quote) })).toBeUndefined();
  });

  it('lists entries newest first, all or one kind', () => {
    expect(slugs(notesOfKind(content))).toEqual(['slow', 'jaw', 'old']);
    expect(slugs(notesOfKind(content, 'tip'))).toEqual(['jaw']);
    expect(slugs(notesOfKind(content, 'note'))).toEqual(['slow', 'old']);
  });
});
