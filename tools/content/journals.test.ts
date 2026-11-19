/**
 * Tests of the guided journals in the content check and the content build (docs/phases/phase-5.md,
 * section 1). The valid tree in __fixtures__/valid/ holds one small journal, "small-steps"; each bad
 * example copies that tree and breaks ONE thing, then reads the one sentence the owner would see.
 */
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { contentFile, guidedJournal } from '../../shared/content-schema';
import { buildContent } from './build';
import { formatProblem } from './problems';
import { readContent } from './read';

const VALID = path.join(__dirname, '__fixtures__', 'valid');
const JOURNAL = 'guided-journals/small-steps/journal.yaml';
const SHOWN = 'content/guided-journals/small-steps/journal.yaml';
const NOW = new Date('2026-11-19T12:00:00Z');

let tmp: string;
beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'ywm-journals-'));
});
afterAll(async () => {
  await rm(tmp, { recursive: true, force: true });
});

let counter = 0;
const freshDir = () => path.join(tmp, `d${counter++}`);

async function copyOfValid(): Promise<string> {
  const dir = freshDir();
  await cp(VALID, dir, { recursive: true });
  return dir;
}

/** Replaces text in the journal of a copied tree (the text must be there). */
async function editJournal(dir: string, from: string | RegExp, to: string): Promise<void> {
  const file = path.join(dir, JOURNAL);
  const before = await readFile(file, 'utf8');
  const after = before.replace(from, to);
  if (after === before) throw new Error(`Nothing to replace: ${String(from)}`);
  await writeFile(file, after);
}

/** The problems of a tree with one change to its journal, as the owner reads them. */
async function problemsAfter(from: string | RegExp, to: string): Promise<string[]> {
  const dir = await copyOfValid();
  await editJournal(dir, from, to);
  const { problems } = await readContent(dir, 'content');
  return problems.map(formatProblem);
}

describe('the content check of a guided journal', () => {
  it('accepts the valid journal', async () => {
    const { loaded, problems } = await readContent(VALID, 'content');
    expect(problems.map(formatProblem)).toEqual([]);
    expect(loaded?.guidedJournals.map((j) => j.slug)).toEqual(['small-steps']);
  });

  it('refuses a folder whose name is not a slug', async () => {
    const dir = await copyOfValid();
    await rename(path.join(dir, 'guided-journals', 'small-steps'), path.join(dir, 'guided-journals', 'Small_Steps'));
    const { problems } = await readContent(dir, 'content');
    expect(problems.map(formatProblem)).toEqual([
      expect.stringMatching(/^content\/guided-journals\/Small_Steps: The name of this folder may only have lowercase letters/),
    ]);
  });

  it('refuses a folder without its journal.yaml', async () => {
    const dir = await copyOfValid();
    await mkdir(path.join(dir, 'guided-journals', 'empty'));
    const { problems } = await readContent(dir, 'content');
    expect(problems.map(formatProblem)).toEqual([
      'content/guided-journals/empty: This folder has no journal.yaml: add it, or delete the folder.',
    ]);
  });

  it('refuses YAML that cannot be read, with its line', async () => {
    expect(await problemsAfter('summary: A test journal.', 'summary: "A test journal.')).toEqual([
      expect.stringMatching(/^content\/guided-journals\/small-steps\/journal\.yaml \(line \d+\): The lines cannot be read/),
    ]);
  });

  it.each([
    ['title', /^title: Small steps\n/m],
    ['summary', /^summary: A test journal\.\n/m],
    ['order', /^order: 2\n/m],
    ['intro', /^intro:\n(  .*\n|\s*\n)*?(?=sources)/m],
  ])('refuses a journal without its "%s"', async (field, line) => {
    expect(await problemsAfter(line, '')).toEqual([`${SHOWN}: "${field}" is missing: add it to the file.`]);
  });

  it('refuses two sections with the same id', async () => {
    expect(await problemsAfter('id: middle', 'id: start')).toEqual([
      `${SHOWN}: Two sections have the id "start": give each section its own id.`,
    ]);
  });

  it('refuses two pages with the same id, even in different sections', async () => {
    expect(await problemsAfter('id: k1', 'id: p1')).toEqual([
      `${SHOWN}: Two pages have the id "p1" (in the sections "start" and "pool"): give each page its own id.`,
    ]);
  });

  it('refuses two prompts with the same id, even on different pages', async () => {
    expect(await problemsAfter('id: k-now', 'id: s-good')).toEqual([
      `${SHOWN}: Two prompts have the id "s-good" (on the pages "p1" and "k1"): give each prompt its own id. People's answers are kept under it.`,
    ]);
  });

  it('refuses a recall that points to no prompt of the journal', async () => {
    expect(await problemsAfter('of: s-good', 'of: s-goods')).toEqual([
      `${SHOWN}: On the page "k1", the recall points to "s-goods", but no prompt of this journal has that id: check the spelling.`,
    ]);
  });

  it('refuses a showIf that names no prompt earlier on its page', async () => {
    // A prompt that exists, but later on the page.
    const later = await problemsAfter(
      /( {10}- id: s-sent\n {12}kind: yesno\n {12}ask: Did you send it\?\n)( {10}- id: s-felt\n(?: {12}.*\n)+)/,
      '$2$1',
    );
    expect(later).toEqual([
      `${SHOWN}: On the page "p2", the prompt "s-felt" shows only after "s-sent", which must come earlier on the same page.`,
    ]);
    // A prompt of another page.
    expect(await problemsAfter('{ prompt: s-sent, is: true }', '{ prompt: s-mood, is: true }')).toEqual([
      `${SHOWN}: On the page "p2", the prompt "s-felt" shows only after "s-mood", which must come earlier on the same page.`,
    ]);
  });

  it('refuses "forever" anywhere but the last section', async () => {
    expect(await problemsAfter('    repeat: 2\n', '    repeat: forever\n')).toEqual([
      `${SHOWN}: The section "middle" repeats forever, but only the last section may: give it a number, or move it to the end.`,
    ]);
  });

  it.each([
    ['a list count', 'count: 2', 'count: 11', 'On the page "p1", the prompt "s-good": "count" must be 10 at most (found "11").'],
    ['a text lines', 'lines: 6', 'lines: 13', 'On the page "p2", the prompt "s-letter": "lines" must be 12 at most (found "13").'],
    ['a page times', 'times: 2', 'times: 31', 'On the page "p3": "times" must be 30 at most (found "31").'],
    ['too few options', 'options: [Walking, Writing, Resting]', 'options: [Walking]', 'On the page "p3", the prompt "s-which": "options" needs at least 2 items.'],
    ['a scale end', 'to: 5', 'to: 7', 'On the page "p1", the prompt "s-mood": "to" must be 5 or 10 (found "7").'],
  ])('refuses %s outside its range', async (_what, from, to, message) => {
    expect(await problemsAfter(from, to)).toEqual([`${SHOWN}: ${message}`]);
  });

  it('refuses a fill without a blank', async () => {
    expect(await problemsAfter('Today I was glad of ___ because ___.', 'Today I was glad.')).toEqual([
      `${SHOWN}: On the page "p3", the prompt "s-fill": "sentence" must be a sentence with at least one blank, written ___ (two or more underscores) (found "Today I was glad.").`,
    ]);
  });

  it('refuses a page without prompts', async () => {
    // "prompts:" with nothing under it, and "prompts: []".
    expect(await problemsAfter(/( {6}- id: k1\n {8}title: Looking back\n {8}prompts:\n)(?: {10}.*\n| {12}.*\n)+/, '$1')).toEqual([
      `${SHOWN}: On the page "k1": a page needs at least one prompt.`,
    ]);
    expect(await problemsAfter(/( {6}- id: k1\n {8}title: Looking back\n {8}prompts:)\n(?: {10}.*\n| {12}.*\n)+/, '$1 []\n')).toEqual([
      `${SHOWN}: On the page "k1": a page needs at least one prompt.`,
    ]);
  });

  it('refuses a kind of prompt it does not know, naming the ones it does', async () => {
    expect(await problemsAfter('kind: yesno', 'kind: drawing')).toEqual([
      `${SHOWN}: On the page "p2", the prompt "s-sent": "kind" must be note, text, list, choice, scale, yesno, fill or recall (found "drawing").`,
    ]);
  });

  it('refuses a picture in the text of a note', async () => {
    expect(await problemsAfter('text: Read this *first*.', 'text: "![A sky](sky.jpg)"')).toEqual([
      `${SHOWN}: On the page "p1", a note: A picture cannot be used in a journal's text.`,
    ]);
  });

  it('refuses a picture or HTML in "About this journal"', async () => {
    expect(await problemsAfter('A **small** journal for the tests.', 'A <b>small</b> journal.')).toEqual([
      expect.stringMatching(/^content\/guided-journals\/small-steps\/journal\.yaml: In "intro" 1: HTML cannot be used in the text\./),
    ]);
  });
});

describe('the content build of a guided journal', () => {
  it('writes the journal with its defaults filled in and its Markdown turned into blocks', async () => {
    const out = freshDir();
    const result = await buildContent({ contentDir: VALID, outDir: out, now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
    const raw = JSON.parse(await readFile(path.join(out, 'content.json'), 'utf8'));
    // Exactly what the app reads, and nothing it would have to leave out.
    const journals = raw.guidedJournals.map((j: unknown) => guidedJournal.parse(j));
    expect(contentFile.parse(raw).guidedJournals).toEqual(journals);

    const [journal] = journals;
    expect(journal).toMatchObject({ slug: 'small-steps', title: 'Small steps', aura: 'rose', order: 2, minutes: 2, draft: false });
    expect(journal.intro[0]).toEqual({
      title: 'What it is',
      text: [
        { type: 'paragraph', spans: [{ text: 'A ' }, { text: 'small', bold: true }, { text: ' journal for the tests.' }] },
        { type: 'list', ordered: false, items: [[{ text: 'One line' }], [{ text: 'Another line' }]] },
      ],
    });
    expect(journal.sources).toEqual(['Someone (2020). A study. A journal, 1, 1–2.']);
    const [start, middle, pool] = journal.sections;
    expect([start.repeat, start.together, middle.repeat, middle.together, pool.repeat]).toEqual([1, true, 2, false, 'forever']);
    expect(start.pages[0].prompts[0]).toEqual({ kind: 'note', text: [{ type: 'paragraph', spans: [{ text: 'Read this ' }, { text: 'first', italic: true }, { text: '.' }] }] });
    expect(start.pages[1]).toMatchObject({ times: 1, skip: 'Not today' });
    expect(start.pages[1].prompts[0]).toMatchObject({ kind: 'text', lines: 6, share: 'Send it' });
    expect(start.pages[1].prompts[2]).toMatchObject({ kind: 'text', lines: 3, showIf: { prompt: 's-sent', is: true } });
    expect(middle.pages[0]).toMatchObject({ times: 2 });
    expect(middle.pages[0].prompts[0]).toMatchObject({ kind: 'choice', many: true });
    expect(pool.pages[0].prompts[0]).toEqual({ kind: 'recall', of: 's-good', which: 'first', label: 'On your first page you wrote' });
  });

  it('keeps a draft journal out of content.json and in preview.json, marked as such', async () => {
    const dir = await copyOfValid();
    await editJournal(dir, 'minutes: 2\n', 'minutes: 2\ndraft: true\n');
    const result = await buildContent({ contentDir: dir, outDir: freshDir(), now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
    expect(result.content.guidedJournals).toEqual([]);
    expect(result.preview.guidedJournals).toEqual([expect.objectContaining({ slug: 'small-steps', draft: true })]);
    expect(result.drafts).toContain(SHOWN);
  });

  it('sorts the journals by "order", then by slug', async () => {
    const dir = await copyOfValid();
    await cp(path.join(dir, 'guided-journals', 'small-steps'), path.join(dir, 'guided-journals', 'first-one'), { recursive: true });
    const first = path.join(dir, 'guided-journals', 'first-one', 'journal.yaml');
    await writeFile(first, (await readFile(first, 'utf8')).replace('order: 2', 'order: 1'));
    await cp(path.join(dir, 'guided-journals', 'small-steps'), path.join(dir, 'guided-journals', 'also-two'), { recursive: true });
    const result = await buildContent({ contentDir: dir, outDir: freshDir(), now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
    expect(result.content.guidedJournals?.map((j) => j.slug)).toEqual(['first-one', 'also-two', 'small-steps']);
  });
});

describe('the Gratitude journal written by the architect', () => {
  it('is copied unchanged into content/', async () => {
    const root = path.join(__dirname, '..', '..');
    const brief = await readFile(path.join(root, 'docs', 'phases', 'phase-5', 'gratitude-journal.yaml'), 'utf8');
    const content = await readFile(path.join(root, 'content', 'guided-journals', 'gratitude', 'journal.yaml'), 'utf8');
    expect(content).toBe(brief);
  });
});
