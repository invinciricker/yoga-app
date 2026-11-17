import { markdownToBlocks } from './markdown';

describe('markdownToBlocks', () => {
  it('turns the Markdown that works into blocks', () => {
    const { blocks, problems } = markdownToBlocks(
      [
        'A first paragraph with **bold**, *italic* and a [link](https://example.com/page).',
        'It goes on, on a second line.',
        '',
        '## A heading',
        '',
        '### A smaller *heading*',
        '',
        '- One point',
        '- Another **point**',
        '',
        '1. First step',
        '2. Second step',
        '',
        '> A line set apart.',
        '',
        '![Light through a window](window.png)',
      ].join('\n'),
    );
    expect(problems).toEqual([]);
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        spans: [
          { text: 'A first paragraph with ' },
          { text: 'bold', bold: true },
          { text: ', ' },
          { text: 'italic', italic: true },
          { text: ' and a ' },
          { text: 'link', href: 'https://example.com/page' },
          { text: '. It goes on, on a second line.' },
        ],
      },
      { type: 'heading', level: 2, text: 'A heading' },
      { type: 'heading', level: 3, text: 'A smaller heading' },
      { type: 'list', ordered: false, items: [[{ text: 'One point' }], [{ text: 'Another ' }, { text: 'point', bold: true }]] },
      { type: 'list', ordered: true, items: [[{ text: 'First step' }], [{ text: 'Second step' }]] },
      { type: 'quote', spans: [{ text: 'A line set apart.' }] },
      { type: 'picture', file: 'window.png', alt: 'Light through a window', line: 16 },
    ]);
  });

  it('keeps bold inside italic, and an empty text gives nothing', () => {
    expect(markdownToBlocks('*soft and **strong***').blocks).toEqual([
      { type: 'paragraph', spans: [{ text: 'soft and ', italic: true }, { text: 'strong', italic: true, bold: true }] },
    ]);
    expect(markdownToBlocks('\n\n')).toEqual({ blocks: [], problems: [] });
  });

  it('refuses what the app cannot draw, with the line', () => {
    const { problems } = markdownToBlocks(
      ['Fine.', '', '---', '', 'A picture ![in](a.jpg) a sentence.', '', '[Away](page.html)', '', '![](photo.jpg)'].join('\n'),
    );
    expect(problems.map((p) => [p.line, p.message.split(/[.:]/)[0]])).toEqual([
      [3, 'A dividing line (---) cannot be used in the text'],
      [5, 'A picture must stand alone on its own line, with an empty line before and after it'],
      [7, 'The link "page'],
      [9, 'The picture "photo'],
    ]);
  });
});
