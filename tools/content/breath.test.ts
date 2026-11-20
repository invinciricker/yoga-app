/**
 * Tests of the breathing exercises in the content check, the content build and the app's reader
 * (docs/phases/phase-7.md, section 1, and "Watch out for" 5). Each bad example copies the valid
 * tree, adds the five exercises of docs/phases/phase-7/breath/, breaks ONE thing, then reads the
 * sentence the owner would see.
 */
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { breathExercise, breathsInRound, contentFile, readableBreath } from '../../shared/content-schema';
import { buildContent } from './build';
import { formatProblem } from './problems';
import { readContent } from './read';

const VALID = path.join(__dirname, '__fixtures__', 'valid');
const ARCHITECT = path.join(__dirname, '..', '..', 'docs', 'phases', 'phase-7', 'breath');
const SLUGS = ['alternate-nostril', 'box', 'even-breath', 'long-exhale', 'the-sigh'];
const NOW = new Date('2026-11-20T12:00:00Z');

let tmp: string;
beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'ywm-breath-'));
});
afterAll(async () => {
  await rm(tmp, { recursive: true, force: true });
});

let counter = 0;
/** The valid tree with the five exercises, as content/breath/<slug>/breath.yaml. */
async function treeWithBreath(): Promise<string> {
  const dir = path.join(tmp, `d${counter++}`);
  await cp(VALID, dir, { recursive: true });
  for (const slug of SLUGS) {
    await mkdir(path.join(dir, 'breath', slug), { recursive: true });
    await cp(path.join(ARCHITECT, `${slug}.yaml`), path.join(dir, 'breath', slug, 'breath.yaml'));
  }
  return dir;
}

/** Replaces text in one exercise of a tree (the text must be there). */
async function edit(dir: string, slug: string, from: string | RegExp, to: string): Promise<void> {
  const file = path.join(dir, 'breath', slug, 'breath.yaml');
  const before = await readFile(file, 'utf8');
  const after = before.replace(from, to);
  if (after === before) throw new Error(`Nothing to replace: ${String(from)}`);
  await writeFile(file, after);
}

/** The problems after one change to one exercise, as the owner reads them. */
async function problemsAfter(slug: string, from: string | RegExp, to: string): Promise<string[]> {
  const dir = await treeWithBreath();
  await edit(dir, slug, from, to);
  const { problems } = await readContent(dir, 'content');
  return problems.map(formatProblem);
}

const LONG = 'content/breath/long-exhale/breath.yaml';
const BOX = 'content/breath/box/breath.yaml';
const SIGH = 'content/breath/the-sigh/breath.yaml';
const NOSTRIL = 'content/breath/alternate-nostril/breath.yaml';

describe('the content check of a breathing exercise', () => {
  it('accepts the five exercises written by the architect', async () => {
    const { loaded, problems } = await readContent(await treeWithBreath(), 'content');
    expect(problems.map(formatProblem)).toEqual([]);
    expect(loaded?.breath.map((b) => b.slug)).toEqual(SLUGS);
  });

  it('refuses a folder whose name is not a slug', async () => {
    const dir = await treeWithBreath();
    await rename(path.join(dir, 'breath', 'box'), path.join(dir, 'breath', 'Box_Breath'));
    const { problems } = await readContent(dir, 'content');
    expect(problems.map(formatProblem)).toEqual([
      expect.stringMatching(/^content\/breath\/Box_Breath: The name of this folder may only have lowercase letters/),
    ]);
  });

  it('refuses a folder without its breath.yaml', async () => {
    const dir = await treeWithBreath();
    await mkdir(path.join(dir, 'breath', 'empty'));
    const { problems } = await readContent(dir, 'content');
    expect(problems.map(formatProblem)).toEqual(['content/breath/empty: This folder has no breath.yaml: add it, or delete the folder.']);
  });

  it('refuses YAML that cannot be read, with its line', async () => {
    expect(await problemsAfter('box', 'title: Box', 'title: "Box')).toEqual([
      expect.stringMatching(/^content\/breath\/box\/breath.yaml \(line \d+\): The lines cannot be read/),
    ]);
  });

  it('refuses a round shorter than six seconds: no fast breathing', async () => {
    expect(await problemsAfter('long-exhale', '{ do: out, seconds: 6 }', '{ do: out, seconds: 1 }')).toEqual([
      `${LONG}: One round is 5 seconds for one breath: that is 12 breaths a minute, and the app never asks for more than 10. No fast breathing: make the steps longer.`,
    ]);
  });

  it('counts every breath of a round: two breaths in 8 seconds are fast too', async () => {
    const problems = await problemsAfter('alternate-nostril', /seconds: 4/g, 'seconds: 2');
    expect(problems).toEqual([expect.stringContaining(`${NOSTRIL}: One round is 8 seconds for 2 breaths: that is 15 breaths a minute`)]);
  });

  it('accepts exactly ten breaths a minute', async () => {
    expect(await problemsAfter('long-exhale', '{ do: out, seconds: 6 }', '{ do: out, seconds: 2 }')).toEqual([]);
  });

  it('refuses a step that is not a whole number of seconds', async () => {
    expect(await problemsAfter('even-breath', '{ do: in, seconds: 5, via: nose }', '{ do: in, seconds: 4.5, via: nose }')).toEqual([
      'content/breath/even-breath/breath.yaml: Step 1 (in) lasts 4.5 seconds: a step is a whole number of seconds from 1 to 12.',
    ]);
  });

  it('refuses a step over 12 seconds, and one of 0', async () => {
    expect(await problemsAfter('long-exhale', '{ do: out, seconds: 6 }', '{ do: out, seconds: 13 }')).toEqual([
      `${LONG}: Step 2 (out) lasts 13 seconds: a step is a whole number of seconds from 1 to 12.`,
    ]);
    expect(await problemsAfter('box', '{ do: hold, seconds: 4 }\n  - { do: out', '{ do: hold, seconds: 0 }\n  - { do: out')).toEqual([
      `${BOX}: Step 2 (hold) lasts 0 seconds: a step is a whole number of seconds from 1 to 12.`,
    ]);
  });

  it('refuses a hold over eight seconds', async () => {
    expect(await problemsAfter('box', '{ do: hold, seconds: 4 }\n  - { do: out', '{ do: hold, seconds: 9 }\n  - { do: out')).toEqual([
      `${BOX}: Step 2 (hold) holds the breath for 9 seconds: a hold is 8 seconds at most.`,
    ]);
  });

  it('refuses fewer than two steps, and more than eight', async () => {
    // One step left, a breath in: both sentences are true, and each says what to do.
    expect(await problemsAfter('long-exhale', '  - { do: out, seconds: 6 }\n', '')).toEqual([
      `${LONG}: "steps" needs at least 2 items.`,
      `${LONG}: The round has no step "out": every round needs a breath out.`,
    ]);
    const nine = Array.from({ length: 9 }, (_, i) => `  - { do: ${i % 2 === 0 ? 'in' : 'out'}, seconds: 6 }`).join('\n');
    expect(await problemsAfter('long-exhale', /steps:\n(  - .*\n)+/, `steps:\n${nine}\n`)).toEqual([
      `${LONG}: "steps" has too many items: 8 at most (it has 9).`,
    ]);
  });

  it('refuses a round with no breath in, or no breath out', async () => {
    expect(await problemsAfter('box', '{ do: in, seconds: 4, via: nose }', '{ do: hold, seconds: 4 }')).toEqual([
      `${BOX}: The round has no step "in": every round needs a breath in.`,
    ]);
    expect(await problemsAfter('box', '{ do: out, seconds: 4, via: nose }', '{ do: in, seconds: 4, via: nose }')).toEqual([
      `${BOX}: The round has no step "out": every round needs a breath out.`,
    ]);
  });

  it('refuses a side through the mouth', async () => {
    expect(await problemsAfter('alternate-nostril', '{ do: out, seconds: 4, via: nose, side: right }', '{ do: out, seconds: 4, via: mouth, side: right }')).toEqual([
      `${NOSTRIL}: In step 2: A "side" is only for breathing through the nose: remove "side", or change "via" to nose.`,
    ]);
  });

  it('refuses a label over 16 characters', async () => {
    expect(await problemsAfter('the-sigh', 'label: Top up', 'label: Top up a little more now')).toEqual([
      `${SIGH}: In step 2: "label" is too long: 16 characters at most (it has 24).`,
    ]);
  });

  it('refuses an unknown level, time of day or step', async () => {
    expect(await problemsAfter('box', 'level: early', 'level: weak')).toEqual([
      `${BOX}: "level" in "why" must be strong, promising, early or traditional (found "weak").`,
    ]);
    expect(await problemsAfter('box', 'suggest: [afternoon]', 'suggest: [noon]')).toEqual([
      `${BOX}: item 1 of "suggest" must be morning, afternoon or evening (found "noon").`,
    ]);
    expect(await problemsAfter('box', '{ do: hold, seconds: 4 }\n  - { do: out', '{ do: sniff, seconds: 4 }\n  - { do: out')).toEqual([
      `${BOX}: In step 2: "do" must be in, hold or out (found "sniff").`,
    ]);
  });

  it('refuses a missing line, and a line it does not know', async () => {
    expect(await problemsAfter('box', 'goodFor: Steadiness and focus\n', '')).toEqual([`${BOX}: "goodFor" is missing: add it to the file.`]);
    expect(await problemsAfter('box', 'order: 4', 'order: 4\nminutes: 3')).toEqual([
      `${BOX}: "minutes" is not a line this kind of file understands: check the spelling, or remove it.`,
    ]);
  });

  it('refuses a picture in the Markdown', async () => {
    expect(await problemsAfter('box', 'Four sides of a box.', 'Four sides of a box.\n\n  ![A box](box.jpg)')).toEqual([
      `${BOX}: In "how": A picture cannot be used in a breathing exercise's text.`,
    ]);
  });

  it('refuses more than six published exercises, and does not count drafts', async () => {
    const dir = await treeWithBreath();
    // Seven published: the five, with the draft published, and two more.
    await edit(dir, 'alternate-nostril', 'draft: true\n', '');
    for (const slug of ['one-more', 'two-more']) {
      await mkdir(path.join(dir, 'breath', slug));
      await cp(path.join(ARCHITECT, 'box.yaml'), path.join(dir, 'breath', slug, 'breath.yaml'));
    }
    const { problems } = await readContent(dir, 'content');
    expect(problems.map(formatProblem)).toEqual([
      'content/breath: 7 breathing exercises are published: 6 at most, so that choosing stays easy. Add "draft: true" to one, or delete one.',
    ]);
    // One of them a draft again: six published, and the check is content.
    await edit(dir, 'two-more', 'order: 4', 'order: 4\ndraft: true');
    expect((await readContent(dir, 'content')).problems).toEqual([]);
  });
});

describe('the content build of the breathing exercises', () => {
  it('writes them by order, their Markdown as blocks, the draft in preview.json only', async () => {
    const result = await buildContent({ contentDir: await treeWithBreath(), outDir: path.join(tmp, `out${counter++}`), now: NOW });
    if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
    expect(result.content.breath?.map((b) => b.slug)).toEqual(['long-exhale', 'even-breath', 'the-sigh', 'box']);
    expect(result.preview.breath?.map((b) => b.slug)).toEqual(['long-exhale', 'even-breath', 'the-sigh', 'box', 'alternate-nostril']);
    expect(result.preview.breath?.[4].draft).toBe(true);
    expect(result.counts.breath).toBe(4);
    expect(result.drafts).toContain(NOSTRIL);

    const sigh = result.content.breath![2];
    expect(sigh.steps).toEqual([
      { do: 'in', seconds: 2, via: 'nose' },
      { do: 'in', seconds: 1, via: 'nose', label: 'Top up' },
      { do: 'out', seconds: 6, via: 'mouth' },
    ]);
    expect(sigh.how[0]).toEqual({ type: 'paragraph', spans: [expect.objectContaining({ text: expect.stringContaining('Breathe in through your nose.') })] });
    expect(sigh.why.level).toBe('promising');
    expect(sigh.why.sources).toHaveLength(2);
    // Long exhale says nothing of the nose on its way out: nothing is invented.
    expect(result.content.breath![0].steps[1]).toEqual({ do: 'out', seconds: 6 });

    // The app reads every one of them, unchanged in number.
    const read = contentFile.parse(JSON.parse(JSON.stringify(result.preview)));
    expect(read.breath?.map((b) => b.slug)).toEqual(['long-exhale', 'even-breath', 'the-sigh', 'box', 'alternate-nostril']);
  });
});

describe('the app reading breathing exercises', () => {
  const exercise = (steps: unknown[], extra: Record<string, unknown> = {}) => ({
    slug: 'test',
    title: 'Test',
    summary: 'A test.',
    goodFor: 'Tests',
    order: 1,
    steps,
    how: [],
    why: { level: 'early', text: [], sources: ['A source.'] },
    ...extra,
  });
  const good = [{ do: 'in', seconds: 4 }, { do: 'out', seconds: 6 }];

  it('leaves out WHOLE an exercise with a step it does not know, and keeps the others', () => {
    const read = readableBreath([
      exercise([{ do: 'in', seconds: 4 }, { do: 'hum', seconds: 2 }, { do: 'out', seconds: 6 }], { slug: 'new' }),
      exercise(good, { slug: 'old' }),
    ]) as { slug: string }[];
    expect(read.map((e) => e.slug)).toEqual(['old']);
  });

  it('never lets fast breathing or a long hold reach the pacer', () => {
    expect(breathExercise.safeParse(exercise([{ do: 'in', seconds: 2 }, { do: 'out', seconds: 2 }])).success).toBe(false);
    expect(breathExercise.safeParse(exercise([{ do: 'in', seconds: 4 }, { do: 'hold', seconds: 10 }, { do: 'out', seconds: 4 }])).success).toBe(false);
    expect(breathExercise.safeParse(exercise([{ do: 'hold', seconds: 4 }, { do: 'out', seconds: 4 }])).success).toBe(false);
  });

  it('drops a label it does not know (via, side, level), never the exercise; ignores unknown lines', () => {
    const read = breathExercise.parse(
      exercise([{ do: 'in', seconds: 4, via: 'either', side: 'both' }, { do: 'out', seconds: 6 }], {
        why: { level: 'mixed', text: [], sources: [] },
        colour: 'blue',
        suggest: ['night', 'evening'],
      }),
    );
    expect(read.steps[0]).toEqual({ do: 'in', seconds: 4 });
    expect(read.why.level).toBeUndefined();
    expect(read.suggest).toEqual(['night', 'evening']);
    expect('colour' in read).toBe(false);
  });

  it('counts the breaths of a round: the sigh is one, alternate nostril two, box one', () => {
    const steps = (...acts: string[]) => acts.map((a) => ({ do: a, seconds: 4 }));
    expect(breathsInRound(steps('in', 'in', 'out'))).toBe(1);
    expect(breathsInRound(steps('in', 'out', 'in', 'out'))).toBe(2);
    expect(breathsInRound(steps('in', 'hold', 'out', 'hold'))).toBe(1);
    // A round that ends on "in" and starts on "in" is one breath across the join.
    expect(breathsInRound(steps('in', 'out', 'in'))).toBe(1);
  });

  it('reads a file without breath (built before Phase 7) as before', () => {
    const read = contentFile.safeParse({
      schemaVersion: 1,
      generatedAt: NOW.toISOString(),
      site: { appName: 'A', teacherFirstName: 'M' },
      studio: { name: 'M' },
      series: [],
      lessons: [],
      journal: [],
    });
    expect(read.success).toBe(true);
    expect(read.data?.breath).toBeUndefined();
  });
});
