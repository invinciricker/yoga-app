import type { Block } from '../../shared/content-schema';
import { fillPlaceholders, placeholderValues } from './fill';

const blocks: Block[] = [
  { type: 'heading', level: 2, text: 'About {appName}' },
  { type: 'paragraph', spans: [{ text: '{appName} by {teacher}. ' }, { text: 'Write to {contactEmail}.', bold: true }] },
  { type: 'list', ordered: false, items: [[{ text: 'Published by {publisher}' }]] },
  { type: 'quote', spans: [{ text: '{unknown} stays as it is' }] },
];

describe('placeholderValues', () => {
  it('takes the names from the content', () => {
    expect(
      placeholderValues({ appName: 'Yoga with Maria', teacherFirstName: 'Maria', contactEmail: 'm@example.com', publisher: 'Maria S' }),
    ).toEqual({ appName: 'Yoga with Maria', teacher: 'Maria', contactEmail: 'm@example.com', publisher: 'Maria S' });
  });

  it('says "(not set yet)" for what is missing', () => {
    const values = placeholderValues({ appName: 'Yoga with Maria', teacherFirstName: 'Maria' });
    expect(values.contactEmail).toBe('(not set yet)');
    expect(values.publisher).toBe('(not set yet)');
  });
});

describe('fillPlaceholders', () => {
  it('fills headings, paragraphs, lists and quotes, and leaves unknown names alone', () => {
    const filled = fillPlaceholders(blocks, placeholderValues({ appName: 'Quiet', teacherFirstName: 'Ana' }));
    expect(filled).toEqual([
      { type: 'heading', level: 2, text: 'About Quiet' },
      { type: 'paragraph', spans: [{ text: 'Quiet by Ana. ' }, { text: 'Write to (not set yet).', bold: true }] },
      { type: 'list', ordered: false, items: [[{ text: 'Published by (not set yet)' }]] },
      { type: 'quote', spans: [{ text: '{unknown} stays as it is' }] },
    ]);
  });
});
