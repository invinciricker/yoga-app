import { testContent as content } from '@/content/testContent';
import { streak } from '@/day/record';

import { isDone, seriesProgress } from './progress';
import { sampleProgress } from './sample';

const today = '2026-11-17';

describe('sampleProgress', () => {
  it('lights four days in a row ending today', () => {
    const { entries } = sampleProgress(content, today);
    expect(entries.map((e) => e.day)).toEqual(['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']);
    expect(streak(entries, today)).toBe(4);
  });

  it('does a lesson of 25 minutes today (Phase 6: the pre-filled answer shows)', () => {
    const { entries } = sampleProgress(content, today);
    expect(entries.filter((e) => e.day === today).map((e) => e.minutes)).toEqual([25]);
  });

  it('does two lessons of a series, saves one lesson and answers once', () => {
    const { entries, practice } = sampleProgress(content, today);
    // "evenings": wind-down, then breath (a third slug of it is gone from the content).
    expect(seriesProgress(entries, ['wind-down', 'breath']).done).toBe(2);
    expect(practice.saved).toHaveLength(1);
    expect(Object.values(practice.reactions)).toEqual([expect.objectContaining({ difficulty: 'right', feeling: 'calmer' })]);
  });

  it('saves a lesson that is not done, so its bookmark shows', () => {
    const { entries, practice } = sampleProgress(content, today);
    expect(isDone(entries, practice.saved[0])).toBe(false);
  });

  it('still works with no content at all', () => {
    const empty = { ...content, lessons: [], series: [] };
    const { entries, practice } = sampleProgress(empty, today);
    expect(streak(entries, today)).toBe(4);
    expect(practice.saved).toHaveLength(1);
  });
});
