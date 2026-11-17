/**
 * The small website: privacy.html is made from the same text as the app's privacy page, and no
 * page of the site loads anything from another site (fonts included).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { blocksToHtml, escapeHtml, privacyPage } from './build';

/** Everything a page LOADS (stylesheets, scripts, pictures, fonts), not the links a reader may follow. */
function loadedAddresses(html: string): string[] {
  const tags = html.match(/<(link|script|img|iframe|source)\b[^>]*>/gi) ?? [];
  const css = html.match(/url\(([^)]+)\)/gi) ?? [];
  return [...tags, ...css].filter((tag) => /(https?:)?\/\//i.test(tag));
}

describe('privacy.html', () => {
  const site = { appName: 'Yoga with Maria', teacherFirstName: 'Maria' };

  it('fills the names, and says "(not set yet)" for what is missing', () => {
    const html = privacyPage(site);
    expect(html).toContain('<h1>Privacy</h1>');
    expect(html).toContain('Yoga with Maria is a free app');
    expect(html).toContain('published by (not set yet)');
    expect(html).not.toMatch(/\{(appName|teacher|contactEmail|publisher|updated)\}/);
  });

  it('uses the publisher and the address once they are in site.yaml', () => {
    const html = privacyPage({ ...site, publisher: 'Maria Example', contactEmail: 'hello@example.com' });
    expect(html).toContain('published by Maria Example');
    expect(html).toContain('Questions: hello@example.com');
  });

  it('loads nothing from another site', () => {
    expect(loadedAddresses(privacyPage(site))).toEqual([]);
  });
});

describe('the pages in site/', () => {
  it.each(['index.html', 'fonts.css'])('%s loads nothing from another site', async (file) => {
    const text = await readFile(path.join(__dirname, '..', '..', 'site', file), 'utf8');
    expect(loadedAddresses(text)).toEqual([]);
  });

  it('the home page links to the privacy page', async () => {
    const text = await readFile(path.join(__dirname, '..', '..', 'site', 'index.html'), 'utf8');
    expect(text).toContain('href="privacy.html"');
  });
});

describe('blocksToHtml', () => {
  it('writes headings, styled words, links and lists, safely', () => {
    expect(
      blocksToHtml([
        { type: 'heading', level: 2, text: 'A & B' },
        { type: 'paragraph', spans: [{ text: 'Plain <b> ' }, { text: 'bold', bold: true }, { text: ' and ' }, { text: 'a link', href: 'https://example.com/?a=1&b="2"' }] },
        { type: 'list', ordered: true, items: [[{ text: 'one', italic: true }]] },
      ]),
    ).toBe(
      [
        '<h2>A &amp; B</h2>',
        '<p>Plain &lt;b&gt; <strong>bold</strong> and <a href="https://example.com/?a=1&amp;b=&quot;2&quot;">a link</a></p>',
        '<ol><li><em>one</em></li></ol>',
      ].join('\n    '),
    );
  });

  it('escapes what could break the page', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
