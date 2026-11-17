import { dayLabel, focusLabel, focusLine, lessonMeta, lessonMetaLong, levelLabel, secondsOf } from './labels';
import { pickVariant, pictureUrl } from './pictures';

describe('labels', () => {
  it('shows levels and known focus words as written in docs/CONTENT.md', () => {
    expect(levelLabel('steady')).toBe('Steady');
    expect(focusLabel('whole-body')).toBe('Whole body');
  });

  it('shows a focus word it does not know as it is, with a capital', () => {
    expect(focusLabel('wrists')).toBe('Wrists');
    expect(focusLabel('lower-back')).toBe('Lower-back');
  });

  it('builds the small lines under titles', () => {
    const lesson = { minutes: 12, level: 'gentle' as const, focus: ['hips', 'back', 'sleep'] };
    expect(lessonMeta(lesson)).toBe('12 min · Gentle');
    expect(lessonMetaLong(lesson)).toBe('12 min · Gentle · Hips');
    expect(focusLine(lesson.focus)).toBe('Hips, back, sleep');
  });

  it('writes a day as "16 November"', () => {
    expect(dayLabel('2026-11-16')).toBe('16 November');
    expect(dayLabel('2026-01-05')).toBe('5 January');
    expect(dayLabel('soon')).toBe('soon');
  });

  it('reads a time of the flow as seconds', () => {
    expect(secondsOf('0:00')).toBe(0);
    expect(secondsOf('3:45')).toBe(225);
    expect(secondsOf('1:02:03')).toBe(3723);
    expect(secondsOf(undefined)).toBeUndefined();
    expect(secondsOf('later')).toBeUndefined();
  });
});

describe('pictures', () => {
  const image = {
    variants: [
      { w: 1440, path: 'media/abc-1440.webp' },
      { w: 480, path: 'media/abc-480.webp' },
      { w: 960, path: 'media/abc-960.webp' },
    ],
    w: 1600,
    h: 900,
    blurhash: 'LEHV6nWB2yk8',
    alt: '',
  };

  it('picks the smallest size that is wide enough', () => {
    expect(pickVariant(image, 76 * 3).w).toBe(480);
    expect(pickVariant(image, 480).w).toBe(480);
    expect(pickVariant(image, 350 * 2).w).toBe(960);
    expect(pickVariant(image, 390 * 3).w).toBe(1440);
  });

  it('falls back to the widest when none is wide enough', () => {
    expect(pickVariant(image, 3000).w).toBe(1440);
  });

  it('builds the address from the permanent base', () => {
    expect(pictureUrl('media/abc-480.webp')).toBe('https://invinciricker.github.io/yoga-app/content/v1/media/abc-480.webp');
  });
});
