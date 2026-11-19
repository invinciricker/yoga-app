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

  it('refuses one id on two pages for two different questions (Phase 6: the same id is the same question)', async () => {
    expect(await problemsAfter('id: k-now', 'id: s-good')).toEqual([
      `${SHOWN}: The prompt "s-good" is asked on the pages "p1" and "k1" with different kinds of answer (a list of 2 and a text): the same id means the same question asked again, so keep its kind, options and range the same, or give it its own id.`,
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
      `${SHOWN}: On the page "p2", the prompt "s-sent": "kind" must be note, text, list, choice, scale, yesno, fill, recall or dots (found "drawing").`,
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

// ------------------------------------------------------------------ Phase 6: what the format learns
const PHASE6 = path.join(__dirname, '..', '..', 'docs', 'phases', 'phase-6');
const HABIT = 'content/guided-journals/habit/journal.yaml';
const HEALTH = 'content/guided-journals/health/journal.yaml';

/** A copy of the valid tree with the Habit and Health journals of the brief beside small-steps. */
async function withPhase6Journals(): Promise<string> {
  const dir = await copyOfValid();
  for (const slug of ['habit', 'health']) {
    await mkdir(path.join(dir, 'guided-journals', slug));
    await cp(path.join(PHASE6, `${slug}-journal.yaml`), path.join(dir, 'guided-journals', slug, 'journal.yaml'));
  }
  return dir;
}

/** The problems after one change to the Habit or the Health journal of such a tree. */
async function phase6ProblemsAfter(slug: 'habit' | 'health', from: string | RegExp, to: string, all = false): Promise<string[]> {
  const dir = await withPhase6Journals();
  const file = path.join(dir, 'guided-journals', slug, 'journal.yaml');
  const before = await readFile(file, 'utf8');
  const after = all && typeof from === 'string' ? before.split(from).join(to) : before.replace(from, to);
  if (after === before) throw new Error(`Nothing to replace: ${String(from)}`);
  await writeFile(file, after);
  const { problems } = await readContent(dir, 'content');
  return problems.map(formatProblem);
}

describe('the content check of the Phase 6 format', () => {
  it('accepts the Habit and Health journals as the architect wrote them', async () => {
    const { loaded, problems } = await readContent(await withPhase6Journals(), 'content');
    expect(problems.map(formatProblem)).toEqual([]);
    expect(loaded?.guidedJournals.map((j) => j.slug)).toEqual(['habit', 'health', 'small-steps']);
  });

  describe('the same question asked again', () => {
    it('accepts the same id on two pages, even with other words', async () => {
      expect(await phase6ProblemsAfter('habit', /(- id: week\n(?:.*\n)*? {12}ask:) Did it happen today\?/, '$1 And today, did it happen?')).toEqual([]);
    });

    it('refuses the same id twice on one page', async () => {
      expect(await phase6ProblemsAfter('habit', '          - id: h-helped\n', '          - id: h-did\n')).toEqual([
        `${HABIT}: On the page "week", two prompts have the id "h-did": give each prompt its own id. People's answers are kept under it.`,
      ]);
    });

    it.each([
      ['another kind', /(- id: week\n(?:.*\n)*?)( {10}- id: h-did\n {12}kind:) yesno/, '$1$2 text', 'a yes or no and a text'],
      [
        'other options',
        /(- id: week\n(?:.*\n)*? {12}options:) \[I forgot, /,
        '$1 [I forgot it, ',
        'a choice of several between "I forgot", "Too tired", "No time", "My day changed", "Did not feel like it", "Something else" and a choice of several between "I forgot it", "Too tired", "No time", "My day changed", "Did not feel like it", "Something else"',
      ],
      ['another range', /(- id: week\n(?:.*\n)*? {12}from: 1\n {12}to:) 5/, '$1 10', 'a scale from 1 to 5 and a scale from 1 to 10'],
      ['another number of blanks', /(- id: week\n(?:.*\n)*? {12}sentence:) After I ___, I will ___\./, '$1 After I ___, I will ___ at ___.', 'a sentence with 2 blanks and a sentence with 3 blanks'],
    ])('refuses the same id on two pages with %s', async (_what, from, to, shapes) => {
      const id = ({ 'another kind': 'h-did', 'other options': 'h-blocker', 'another range': 'h-auto', 'another number of blanks': 'h-plan' } as const)[_what];
      const pages = id === 'h-plan' ? '"s02" and "week"' : '"day" and "week"';
      expect(await phase6ProblemsAfter('habit', from, to)).toEqual([
        `${HABIT}: The prompt "${id}" is asked on the pages ${pages} with different kinds of answer (${shapes}): the same id means the same question asked again, so keep its kind, options and range the same, or give it its own id.`,
      ]);
    });

    it('refuses a choice of one and a choice of several under one id', async () => {
      expect(await phase6ProblemsAfter('habit', /(- id: week\n(?:.*\n)*? {12})many: true\n/, '$1many: false\n')).toEqual([
        expect.stringContaining('The prompt "h-blocker" is asked on the pages "day" and "week" with different kinds of answer (a choice of several'),
      ]);
    });

    it('refuses a list of another length under one id', async () => {
      expect(await problemsAfter('          - id: k-now\n            kind: text\n            ask: And now?', '          - id: s-good\n            kind: list\n            ask: Again?\n            count: 3')).toEqual([
        `${SHOWN}: The prompt "s-good" is asked on the pages "p1" and "k1" with different kinds of answer (a list of 2 and a list of 3): the same id means the same question asked again, so keep its kind, options and range the same, or give it its own id.`,
      ]);
    });
  });

  describe('hints', () => {
    it('refuses a hint over 200 characters on a yes or no', async () => {
      expect(await phase6ProblemsAfter('health', 'hint: In person or by phone, more than small talk.', `hint: ${'a'.repeat(201)}`, true)).toEqual([
        `${HEALTH}: On the page "day", the prompt "hl-talked": "hint" is too long: 200 characters at most (it has 201).`,
        `${HEALTH}: On the page "week", the prompt "hl-talked": "hint" is too long: 200 characters at most (it has 201).`,
      ]);
    });
  });

  describe('showIf by round', () => {
    it('refuses a showIf with both a round and a prompt', async () => {
      expect(await phase6ProblemsAfter('habit', 'showIf: { round: 3 }', 'showIf: { round: 3, prompt: h-did }')).toEqual([
        `${HABIT}: On the page "week", a note: "showIf" names a prompt or a round, never both: an older app would show this prompt in every round.`,
      ]);
    });

    it('refuses a round in a section that does not repeat', async () => {
      expect(await phase6ProblemsAfter('habit', '            lines: 1\n          - kind: note', '            lines: 1\n          - kind: note\n            showIf: { round: 2 }')).toEqual([
        `${HABIT}: On the page "s03", prompt 2 shows only in round 2, but the section "getting-ready" does not repeat: remove the round, or give the section a "repeat".`,
      ]);
    });

    it('refuses a round beyond the repeats of its section', async () => {
      expect(await problemsAfter('          - id: s-fill\n', '          - kind: note\n            text: Late.\n            showIf: { round: [2, 3] }\n          - id: s-fill\n')).toEqual([
        `${SHOWN}: On the page "p3", prompt 2 shows in round 3, but the section "middle" has 2 rounds: it would never show.`,
      ]);
    });

    it('refuses a round below 1', async () => {
      expect(await phase6ProblemsAfter('habit', 'showIf: { round: 3 }', 'showIf: { round: 0 }')).toEqual([
        `${HABIT}: On the page "week", a note: "round" in "showIf" must be 1 at least (found "0").`,
      ]);
    });
  });

  describe('weeks', () => {
    it('refuses numbering in weeks where a round is not seven pages', async () => {
      expect(await phase6ProblemsAfter('health', 'times: 6', 'times: 5')).toEqual([
        `${HEALTH}: The section "days" is numbered in weeks, but one round of it is 6 pages: a week needs exactly 7 (count each page as many times as its "times").`,
      ]);
    });

    it('refuses a kind of numbering it does not know', async () => {
      expect(await phase6ProblemsAfter('health', 'numbering: weeks', 'numbering: months')).toEqual([
        `${HEALTH}: In the section "days": "numbering" must be weeks (found "months").`,
      ]);
    });
  });

  describe('dots', () => {
    it('refuses dots in a section whose round has more than seven pages', async () => {
      // Without its weeks, a round of eight pages: too many dots for a row.
      expect(await phase6ProblemsAfter('health', /    numbering: weeks\n((?:.*\n)*? {8})times: 6/, '$1times: 7')).toEqual([
        `${HEALTH}: On the page "week", the dots "This week" show one round of the section "days", which has 8 pages: a row holds 7 dots at most.`,
      ]);
    });

    it('refuses a row that reads a prompt of another section, or one it cannot draw', async () => {
      expect(await phase6ProblemsAfter('habit', '{ of: h-auto, label: Automatic }', '{ of: h-want, label: Automatic }')).toEqual([
        `${HABIT}: On the page "week", the row "Automatic" of the dots "This week" reads "h-want", which is not a prompt of the section "days": check the spelling.`,
      ]);
      expect(await phase6ProblemsAfter('habit', '{ of: h-auto, label: Automatic }', '{ of: h-blocker, label: Automatic }')).toEqual([
        expect.stringMatching(/On the page "week", the row "Automatic" of the dots "This week" reads "h-blocker", which is a choice of several between .*: dots can show a yes or no, a scale or a choice of one\.$/),
      ]);
      expect(await phase6ProblemsAfter('health', '{ of: hl-talked, label: Talked }', '{ of: hl-mood, label: Talked }')).toEqual([
        `${HEALTH}: On the page "week", the row "Talked" of the dots "This week" reads "hl-mood", which is a text: dots can show a yes or no, a scale or a choice of one.`,
      ]);
    });

    it('refuses a label over 16 characters', async () => {
      expect(await phase6ProblemsAfter('health', 'label: Outside }', 'label: Outside in daylight }')).toEqual([
        `${HEALTH}: On the page "week", the dots "This week": "label" in item 5 of "rows" is too long: 16 characters at most (it has 19).`,
      ]);
    });

    it('refuses a row round in a section that does not repeat, or beyond its repeats', async () => {
      expect(
        await problemsAfter(
          '          - id: s-fill\n',
          '          - kind: dots\n            ask: The days\n            rows:\n              - { of: s-which, label: Before, round: 1 }\n          - id: s-fill\n',
        ),
      ).toEqual([
        `${SHOWN}: On the page "p3", the row "Before" of the dots "The days" reads "s-which", which is a choice of several between "Walking", "Writing", "Resting": dots can show a yes or no, a scale or a choice of one.`,
      ]);
      expect(
        await problemsAfter(
          '          - id: s-mood\n',
          '          - kind: dots\n            ask: The days\n            rows:\n              - { of: s-mood, label: Mood, round: 2 }\n          - id: s-mood\n',
        ),
      ).toEqual([
        `${SHOWN}: On the page "p1", the row "Mood" of the dots "The days" reads only in round 2, but the section "start" does not repeat: remove the round, or give the section a "repeat".`,
      ]);
    });
  });

  describe('prefill', () => {
    it.each([
      ['a "from" it does not know', 'from: lessons-today', 'from: steps-today', `"from" in "prefill" must be lessons-today (found "steps-today").`],
      ['an "atLeast" of 0', 'atLeast: 1,', 'atLeast: 0,', `"atLeast" in item 1 of "pick" in "prefill" must be 1 at least (found "0").`],
      ['an "atLeast" over 600', 'atLeast: 20,', 'atLeast: 601,', `"atLeast" in item 2 of "pick" in "prefill" must be 600 at most (found "601").`],
      ['an "atLeast" that is not whole', 'atLeast: 20,', 'atLeast: 2.5,', `"atLeast" in item 2 of "pick" in "prefill" must be a whole number (found "2.5").`],
    ])('refuses %s', async (_what, from, to, message) => {
      const found = await phase6ProblemsAfter('health', from, to, true);
      expect(found).toEqual([
        `${HEALTH}: On the page "day", the prompt "hl-moved": ${message}`,
        `${HEALTH}: On the page "week", the prompt "hl-moved": ${message}`,
      ]);
    });

    it('refuses an option that is not one of the choice', async () => {
      expect(await phase6ProblemsAfter('health', 'option: A little }', 'option: A bit }', true)).toEqual([
        `${HEALTH}: On the page "day", the prompt "hl-moved" would fill in "A bit", which is not one of its options: check the spelling.`,
        `${HEALTH}: On the page "week", the prompt "hl-moved" would fill in "A bit", which is not one of its options: check the spelling.`,
      ]);
    });

    it('refuses a prefill on a choice of several', async () => {
      expect(await phase6ProblemsAfter('health', 'options: [Hardly at all, A little, 20 minutes or more]\n', 'options: [Hardly at all, A little, 20 minutes or more]\n            many: true\n', true)).toEqual([
        `${HEALTH}: On the page "day", the prompt "hl-moved" lets people choose several options, so it cannot be filled in for them: remove "prefill", or "many".`,
        `${HEALTH}: On the page "week", the prompt "hl-moved" lets people choose several options, so it cannot be filled in for them: remove "prefill", or "many".`,
        `${HEALTH}: On the page "week", the row "Moved" of the dots "This week" reads "hl-moved", which is a choice of several between "Hardly at all", "A little", "20 minutes or more": dots can show a yes or no, a scale or a choice of one.`,
      ]);
    });
  });

  describe('carry', () => {
    it('refuses a journal that is not in the content, or its own journal', async () => {
      expect(await phase6ProblemsAfter('health', 'to: habit,', 'to: habits,')).toEqual([
        `${HEALTH}: On the page "week", the prompt "hl-change" hands its text to the journal "habits", which is not in content/guided-journals/: check the spelling.`,
      ]);
      expect(await phase6ProblemsAfter('health', 'to: habit,', 'to: health,')).toEqual([
        `${HEALTH}: On the page "week", the prompt "hl-change" hands its text to its own journal: "carry" is for another journal.`,
      ]);
    });

    it('refuses a prompt that is not a text on the first page of that journal', async () => {
      expect(await phase6ProblemsAfter('health', 'prompt: h-want,', 'prompt: h-obstacle,')).toEqual([
        `${HEALTH}: On the page "week", the prompt "hl-change" hands its text to "h-obstacle", which is not a text prompt on the first page of the journal "habit": check the spelling.`,
      ]);
    });

    it('refuses a label over 30 characters', async () => {
      expect(await phase6ProblemsAfter('health', 'label: Make it a habit }', 'label: Make it a habit today and every day }')).toEqual([
        `${HEALTH}: On the page "week", the prompt "hl-change": "label" in "carry" is too long: 30 characters at most (it has 35).`,
      ]);
    });
  });

  describe('again', () => {
    it('refuses words over 30 characters', async () => {
      expect(await phase6ProblemsAfter('habit', 'again: Start a new habit', 'again: Start a new habit, from the very beginning')).toEqual([
        `${HABIT}: "again" is too long: 30 characters at most (it has 42).`,
      ]);
    });
  });
});

describe('the content build of the Phase 6 format', () => {
  it('writes what the format learned, as the app reads it', async () => {
    const result = await buildContent({ contentDir: await withPhase6Journals(), outDir: freshDir(), now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
    const raw = JSON.parse(JSON.stringify(result.content));
    const journals = raw.guidedJournals.map((j: unknown) => guidedJournal.parse(j));
    expect(contentFile.parse(raw).guidedJournals).toEqual(journals);

    const bySlug = (slug: string) => journals.find((j: { slug: string }) => j.slug === slug);
    const [habit, health] = [bySlug('habit'), bySlug('health')];
    expect(habit.again).toBe('Start a new habit');
    expect(habit.sections.map((s: { numbering?: string }) => s.numbering)).toEqual([undefined, 'weeks']);
    const week = habit.sections[1].pages[1];
    expect(week.prompts.find((p: { kind: string }) => p.kind === 'yesno')).toMatchObject({ id: 'h-did', hint: 'Still early? Come back tonight and answer then.' });
    expect(week.prompts.filter((p: { showIf?: object }) => p.showIf && 'round' in p.showIf).map((p: { showIf: object }) => p.showIf)).toEqual([
      { round: 1 },
      { round: 3 },
      { round: 6 },
      { round: 10 },
      { round: 10 },
      { round: 10 },
    ]);
    expect(week.prompts.find((p: { kind: string }) => p.kind === 'dots')).toEqual({
      kind: 'dots',
      ask: 'This week',
      hint: expect.stringContaining('A full dot'),
      rows: [
        { of: 'h-did', label: 'Did it' },
        { of: 'h-auto', label: 'Automatic' },
      ],
    });
    const moved = health.sections[0].pages[0].prompts.find((p: { id?: string }) => p.id === 'hl-moved');
    expect(moved.prefill).toEqual({
      from: 'lessons-today',
      pick: [
        { atLeast: 1, option: 'A little' },
        { atLeast: 20, option: '20 minutes or more' },
      ],
    });
    const change = health.sections[0].pages[1].prompts.find((p: { id?: string }) => p.id === 'hl-change');
    expect(change.carry).toEqual({ to: 'habit', prompt: 'h-want', label: 'Make it a habit' });
  });
});

describe('the Habit and Health journals written by the architect', () => {
  it.each(['habit', 'health'])('%s is copied unchanged into content/', async (slug) => {
    const root = path.join(__dirname, '..', '..');
    const brief = await readFile(path.join(root, 'docs', 'phases', 'phase-6', `${slug}-journal.yaml`), 'utf8');
    const content = await readFile(path.join(root, 'content', 'guided-journals', slug, 'journal.yaml'), 'utf8');
    expect(content).toBe(brief);
  });
});
