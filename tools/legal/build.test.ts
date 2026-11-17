/**
 * The legal pages of the app are made from the repository (tools/legal/build.ts) and kept in git.
 * These tests fail when they are out of date: run "npm run legal" and commit the two files.
 */
import { readFile } from 'node:fs/promises';

import { asText, LICENCES_JSON, licenceName, makeLicences, makePrivacy, PRIVACY_JSON, writtenDate } from './build';

const RUN = 'Out of date: run "npm run legal" and commit src/legal/.';

describe('src/legal/privacy.json', () => {
  it('is the privacy policy of docs/legal/ as it is now', async () => {
    const committed = await readFile(PRIVACY_JSON, 'utf8');
    if (committed !== asText(await makePrivacy())) throw new Error(RUN);
  });

  it('keeps the placeholders that the app fills from the content', async () => {
    const text = JSON.stringify(await makePrivacy());
    for (const name of ['{appName}', '{teacher}', '{contactEmail}', '{publisher}']) expect(text).toContain(name);
    expect(text).not.toContain('{updated}');
  });

  it('takes its title from the first line', async () => {
    expect((await makePrivacy()).title).toBe('Privacy');
  });
});

describe('src/legal/licences.json', () => {
  it('lists every library the app ships with, and is up to date', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as { dependencies: Record<string, string> };
    const committed = JSON.parse(await readFile(LICENCES_JSON, 'utf8')) as { libraries: { name: string }[] };
    const listed = new Set(committed.libraries.map((l) => l.name));
    const missing = Object.keys(pkg.dependencies).filter((name) => !listed.has(name));
    if (missing.length > 0) throw new Error(`Missing from the licences: ${missing.join(', ')}. ${RUN}`);
    if (asText(committed) !== asText(await makeLicences())) throw new Error(RUN);
  });

  it('names the two typefaces with their licence', async () => {
    const { fonts } = await makeLicences();
    expect(fonts).toEqual([
      { name: 'Cormorant Garamond', licence: 'SIL Open Font License 1.1' },
      { name: 'Figtree', licence: 'SIL Open Font License 1.1' },
    ]);
  });
});

describe('small helpers', () => {
  it('writes a date out', () => {
    expect(writtenDate('2026-11-17')).toBe('17 November 2026');
    expect(writtenDate(new Date('2027-01-02T00:00:00Z'))).toBe('2 January 2027');
    expect(() => writtenDate('soon')).toThrow(/a date like/);
  });

  it('names a licence', () => {
    expect(licenceName('MIT')).toBe('MIT License');
    expect(licenceName('MIT AND OFL-1.1')).toBe('MIT License and SIL Open Font License 1.1');
    expect(licenceName('(MIT OR Apache-2.0)')).toBe('MIT License or Apache License 2.0');
    expect(licenceName('Unlicense')).toBe('Unlicense');
  });
});
