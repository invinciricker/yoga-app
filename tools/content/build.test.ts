/**
 * Tests of the content build, on the small tree in __fixtures__/valid/.
 * Bad examples are made by copying that tree to a temporary folder and breaking ONE thing.
 */
import { randomBytes } from 'node:crypto';
import { cp, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

import { contentFile } from '../../shared/content-schema';
import { buildContent } from './build';
import { formatProblem } from './problems';
import { readContent } from './read';

const VALID = path.join(__dirname, '__fixtures__', 'valid');
const NOW = new Date('2026-11-16T12:00:00Z');

let tmp: string;
beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'ywm-content-'));
});
afterAll(async () => {
  await rm(tmp, { recursive: true, force: true });
});

let counter = 0;
const freshDir = () => path.join(tmp, `d${counter++}`);

/** A copy of the valid tree that a test may break. */
async function copyOfValid(): Promise<string> {
  const dir = freshDir();
  await cp(VALID, dir, { recursive: true });
  return dir;
}

/** Replaces text in one file of a copied tree. */
async function edit(dir: string, file: string, from: string | RegExp, to: string): Promise<void> {
  const full = path.join(dir, file);
  const before = await readFile(full, 'utf8');
  const after = before.replace(from, to);
  if (after === before) throw new Error(`Nothing to replace in ${file}`);
  await writeFile(full, after);
}

/** The problems of a tree, printed the way the owner reads them. */
async function problemsOf(dir: string): Promise<string[]> {
  const { problems } = await readContent(dir, 'content');
  return problems.map(formatProblem);
}

describe('a valid tree', () => {
  it('has no problem', async () => {
    expect(await problemsOf(VALID)).toEqual([]);
  });

  it('builds content.json, preview.json and the pictures', async () => {
    const out = freshDir();
    const result = await buildContent({ contentDir: VALID, outDir: out, now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));

    // Both files are what the app accepts.
    const content = contentFile.parse(JSON.parse(await readFile(path.join(out, 'content.json'), 'utf8')));
    const preview = contentFile.parse(JSON.parse(await readFile(path.join(out, 'preview.json'), 'utf8')));
    expect(content.generatedAt).toBe(NOW.toISOString());
    expect(content.site).toEqual({ appName: 'Yoga with Test', teacherFirstName: 'Tess', contactEmail: 'tess@example.com' });
    expect(content.studio.name).toBe('Tess Teacher');

    // A draft is in preview.json only, marked as such, and nothing in content.json points to it.
    expect(content.lessons.map((l) => l.slug)).toEqual(['first-rest']);
    expect(preview.lessons.map((l) => [l.slug, l.draft])).toEqual([['second-rest', true], ['first-rest', false]]);
    expect(content.series[0].lessons).toEqual(['first-rest']);
    expect(preview.series[0].lessons).toEqual(['first-rest', 'second-rest']);
    expect(content.journal.find((j) => j.slug === 'a-note')?.related).toEqual(['first-rest']);
    expect(preview.journal.find((j) => j.slug === 'a-note')?.related).toEqual(['first-rest', 'second-rest']);

    // Newest first, then by title.
    expect(content.journal.map((j) => j.slug)).toEqual(['a-note', 'a-tip']);

    // The aura: the one written, or a stable pick from the slug.
    expect(content.series[0].aura).toBe('forest');
    expect(['dusk', 'forest', 'candle', 'ember', 'moss']).toContain(content.lessons[0].aura);

    // A 1600-pixel photo gets the three sizes; a 300-pixel one is never made bigger.
    const cover = content.lessons[0].cover!;
    expect(cover).toMatchObject({ w: 1600, h: 900, alt: 'A soft evening sky' });
    expect(cover.variants.map((v) => v.w)).toEqual([480, 960, 1440]);
    expect(cover.variants[0].path).toMatch(/^media\/[0-9a-f]{12}-480\.webp$/);
    expect(cover.blurhash.length).toBeGreaterThanOrEqual(6);
    const note = content.journal.find((j) => j.slug === 'a-note')!;
    const picture = note.body.find((b) => b.type === 'image');
    expect(picture).toMatchObject({ type: 'image', image: { w: 300, h: 200, alt: 'Light through a window', variants: [{ w: 300 }] } });
    for (const variant of cover.variants) {
      const meta = await sharp(path.join(out, variant.path)).metadata();
      expect([meta.format, meta.width]).toEqual(['webp', variant.w]);
    }
  });

  it('removes the GPS position from the pictures it publishes', async () => {
    const original = await sharp(path.join(VALID, 'lessons', 'first-rest', 'cover.jpg')).metadata();
    expect(original.exif).toBeDefined(); // the fixture really carries a position

    const out = freshDir();
    await buildContent({ contentDir: VALID, outDir: out, now: NOW });
    const files = await readdir(path.join(out, 'media'));
    expect(files.length).toBe(4);
    for (const file of files) {
      const meta = await sharp(path.join(out, 'media', file)).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
    }
  });

  it('gives byte-identical output for the same input', async () => {
    const [a, b] = [freshDir(), freshDir()];
    await buildContent({ contentDir: VALID, outDir: a, now: NOW });
    await buildContent({ contentDir: await copyOfValid(), outDir: b, now: NOW });
    const names = ['content.json', 'preview.json', ...(await readdir(path.join(a, 'media'))).map((f) => `media/${f}`)];
    expect((await readdir(path.join(b, 'media'))).length).toBe(names.length - 2);
    for (const name of names) {
      expect((await readFile(path.join(a, name))).equals(await readFile(path.join(b, name)))).toBe(true);
    }
  });

  it('refuses a release while a sample remains', async () => {
    const result = await buildContent({ contentDir: VALID, outDir: freshDir(), now: NOW, release: true });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems.map(formatProblem)).toEqual([
      expect.stringMatching(/^content\/lessons\/second-rest\/lesson\.md: This is still sample text/),
    ]);
  });
});

describe('what the check refuses, each with the file and a plain sentence', () => {
  it('a field that fails its schema', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'lessons/first-rest/lesson.md', 'level: gentle', 'level: easy');
    expect(await problemsOf(dir)).toEqual([
      'content/lessons/first-rest/lesson.md: "level" must be gentle, steady or strong (found "easy").',
    ]);
  });

  it('a missing field, a misspelt one, a text that is too long', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'journal/a-tip/entry.md', 'summary: One small thing to try.\n', 'sumary: Oops\n');
    await edit(dir, 'series/quiet-week/series.md', 'title: A quiet week', `title: ${'A very long title '.repeat(5)}`);
    await edit(dir, 'lessons/first-rest/lesson.md', 'at: "1:30"', 'at: "soon"');
    const problems = await problemsOf(dir);
    expect(problems).toContain('content/journal/a-tip/entry.md: "summary" is missing: add it to the lines at the top of the file.');
    expect(problems).toContain(
      'content/journal/a-tip/entry.md: "sumary" is not a line this kind of file understands: check the spelling, or remove it.',
    );
    expect(problems).toContain('content/series/quiet-week/series.md: "title" is too long: 60 characters at most (it has 89).');
    expect(problems).toContain(
      'content/lessons/first-rest/lesson.md: "at" in item 2 of "flow" must be a time like 3:45 (found "soon").',
    );
    expect(problems.length).toBe(4);
  });

  it('a cover without its description, a series without its order', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'lessons/first-rest/lesson.md', 'coverAlt: A soft evening sky\n', '');
    await edit(dir, 'lessons/second-rest/lesson.md', 'order: 2\n', '');
    expect(await problemsOf(dir)).toEqual([
      'content/lessons/first-rest/lesson.md: CoverAlt is required when there is a cover (one line describing the photo).',
      'content/lessons/second-rest/lesson.md: Series and order go together.',
    ]);
  });

  it('frontmatter that cannot be read', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'lessons/first-rest/lesson.md', 'focus: [hips, sleep]', 'focus: [hips, sleep');
    const problems = await problemsOf(dir);
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(/^content\/lessons\/first-rest\/lesson\.md \(line \d+\): The lines at the top cannot be read/);
  });

  it('a folder whose name is not a slug', async () => {
    const dir = await copyOfValid();
    await rename(path.join(dir, 'journal', 'a-tip'), path.join(dir, 'journal', 'A Tip'));
    expect(await problemsOf(dir)).toEqual([
      'content/journal/A Tip: The name of this folder may only have lowercase letters, digits and single dashes, like evening-wind-down: rename it.',
    ]);
  });

  it('a series that points to nothing', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'lessons/second-rest/lesson.md', 'series: quiet-week', 'series: quiet-weak');
    expect(await problemsOf(dir)).toEqual([
      'content/lessons/second-rest/lesson.md: "series" names "quiet-weak", but there is no folder content/series/quiet-weak: check the spelling, or create the series.',
    ]);
  });

  it('a related lesson that points to nothing', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'journal/a-note/entry.md', 'related: [first-rest, second-rest]', 'related: [first-rest, third-rest]');
    expect(await problemsOf(dir)).toEqual([
      'content/journal/a-note/entry.md: "related" names "third-rest", but there is no folder content/lessons/third-rest: check the spelling, or remove it from the list.',
    ]);
  });

  it('two lessons with the same order in a series', async () => {
    const dir = await copyOfValid();
    await edit(dir, 'lessons/second-rest/lesson.md', 'order: 2', 'order: 1');
    expect(await problemsOf(dir)).toEqual([
      'content/lessons/second-rest/lesson.md: "order" is 1, the same as content/lessons/first-rest/lesson.md in the series "quiet-week": give each lesson of a series its own number.',
    ]);
  });

  it('a picture that is missing', async () => {
    const dir = await copyOfValid();
    await rm(path.join(dir, 'lessons', 'first-rest', 'cover.jpg'));
    await rm(path.join(dir, 'journal', 'a-note', 'window.png'));
    expect(await problemsOf(dir)).toEqual([
      expect.stringMatching(/^content\/lessons\/first-rest\/cover\.jpg: This picture is named in the text but the file is not in the folder/),
      expect.stringMatching(/^content\/journal\/a-note\/window\.png: This picture is named/),
    ]);
  });

  it('a picture over 1 MB', async () => {
    const dir = await copyOfValid();
    // Random dots do not compress: 700 × 700 of them weigh about 1.4 MB as a PNG.
    const noise = { raw: { width: 700, height: 700, channels: 3 as const } };
    await sharp(randomBytes(700 * 700 * 3), noise).png().toFile(path.join(dir, 'journal', 'a-note', 'window.png'));
    const problems = await problemsOf(dir);
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(
      /^content\/journal\/a-note\/window\.png: This picture weighs 1\.\d MB and the limit is 1 MB: ask Claude Code to shrink it \(npm run content:image -- content\/journal\/a-note\/window\.png\)\.$/,
    );
  });

  it('a picture larger than 2400 pixels', async () => {
    const dir = await copyOfValid();
    const flat = { create: { width: 2500, height: 40, channels: 3 as const, background: '#131D19' } };
    await sharp(flat).jpeg().toFile(path.join(dir, 'lessons', 'first-rest', 'cover.jpg'));
    expect(await problemsOf(dir)).toEqual([
      'content/lessons/first-rest/cover.jpg: This picture is 2500 × 40 pixels and the limit is 2400 on the long side: ask Claude Code to shrink it (npm run content:image -- content/lessons/first-rest/cover.jpg).',
    ]);
  });

  it('Markdown outside the list, with the line', async () => {
    const dir = await copyOfValid();
    // The text of a-tip starts on line 8 of its file.
    await edit(
      dir,
      'journal/a-tip/entry.md',
      'Try it once.',
      ['| Pose | Time |', '| --- | --- |', '| Cat | 1 min |', '', '<b>Loud</b>', '', '```', 'code', '```', '', 'Some `code` here.', '', '# Too big'].join('\n'),
    );
    expect(await problemsOf(dir)).toEqual([
      expect.stringMatching(/^content\/journal\/a-tip\/entry\.md \(line 8\): A table cannot be used in the text\./),
      expect.stringMatching(/^content\/journal\/a-tip\/entry\.md \(line 12\): HTML cannot be used in the text\./),
      expect.stringMatching(/^content\/journal\/a-tip\/entry\.md \(line 14\): A block of code cannot be used in the text\./),
      expect.stringMatching(/^content\/journal\/a-tip\/entry\.md \(line 18\): Code \(text between backticks\) cannot be used/),
      'content/journal/a-tip/entry.md (line 20): A heading must start with ## or ### (found #).',
    ]);
  });
});
