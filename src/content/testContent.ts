/**
 * A small content file for the tests of this folder. Not used by the app.
 */
import { contentFile, type ContentFile } from '../../shared/content-schema';

const lesson = (slug: string, title: string, published: string, more: Record<string, unknown> = {}) => ({
  slug,
  title,
  summary: `About ${title.toLowerCase()}.`,
  published,
  level: 'gentle',
  minutes: 12,
  focus: ['hips'],
  aura: 'dusk',
  ...more,
});

/** As it would arrive from the server, before the app checks it. */
export const rawTestContent = {
  schemaVersion: 1,
  generatedAt: '2026-11-16T12:00:00.000Z',
  site: { appName: 'Yoga with Maria', teacherFirstName: 'Maria' },
  studio: { name: 'Maria' },
  series: [
    { slug: 'evenings', title: 'Evenings', summary: 'A week.', published: '2026-11-16', aura: 'forest', lessons: ['wind-down', 'gone', 'breath'] },
  ],
  lessons: [
    lesson('wind-down', 'Evening wind-down', '2026-11-16', { featured: true, series: 'evenings', order: 1, focus: ['hips', 'back', 'sleep'] }),
    lesson('morning', 'Slow morning flow', '2026-11-14', { level: 'steady', minutes: 18, focus: ['whole-body', 'energy'] }),
    lesson('breath', 'Breath before sleep', '2026-11-12', { minutes: 6, series: 'evenings', order: 2, focus: ['breath', 'sleep'] }),
    lesson('legs', 'Strong legs', '2026-11-12', { level: 'strong', minutes: 25, focus: ['legs'] }),
  ],
  journal: [
    { slug: 'jaw', kind: 'tip', title: 'Soften the jaw', summary: 'Check your jaw.', published: '2026-11-13', aura: 'moss' },
    { slug: 'slow', kind: 'note', title: 'Why we slow down', summary: 'Nothing to prove.', published: '2026-11-15', aura: 'candle', quote: 'Slow is a speed too.', related: ['wind-down'] },
    { slug: 'old', kind: 'note', title: 'An older note', summary: 'From before.', published: '2026-11-01', aura: 'dusk', quote: 'An older saying.' },
  ],
};

export const testContent: ContentFile = contentFile.parse(rawTestContent);
