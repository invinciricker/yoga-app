/**
 * Breathing exercises in the content check and the content build (docs/phases/phase-7.md, section 1).
 *
 *   content/breath/<slug>/breath.yaml
 *
 * Each file is read and checked (shared/content-schema.ts, breathSource, whose rules of the breath
 * are breathRoundProblems: the same rules the app checks again). Its Markdown (`how`, `why.text`)
 * becomes blocks. Once every file is read, one more rule that no single file can see: at most six
 * exercises published at once (docs/V2.md, "Limits that keep it calm", 2). Every problem is one
 * plain sentence that names the step by its number, because that is what the owner counts in the file.
 */
import { load as loadYaml } from 'js-yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

import { breathSource, MAX_PUBLISHED_BREATH, slugPattern, type breathExercise } from '../../shared/content-schema';
import { textBlocks } from './journals';
import { describeIssue, type Problem } from './problems';

type Source = z.infer<typeof breathSource>;
/** An exercise as content.json holds it (before the app fills in its defaults). */
export type BuiltBreath = z.input<typeof breathExercise>;

/** One breathing exercise, as written and as built. */
export type BreathItem = {
  slug: string;
  /** The file as printed in messages: content/breath/<slug>/breath.yaml */
  shown: string;
  data: Source;
  built: BuiltBreath;
};

const FILE = 'breath.yaml';
const exists = (file: string) => stat(file).then(() => true, () => false);

/** The sentence for one zod issue in an exercise: "In step 2: …" for a step, the plain sentence otherwise. */
function breathSentence(issue: z.core.$ZodIssue, data: unknown): string {
  const [first, index, ...rest] = issue.path;
  if (first === 'steps' && typeof index === 'number') {
    return `In step ${index + 1}: ${describeIssue(issue, data, rest, 'add it')}`;
  }
  return describeIssue(issue, data, issue.path, 'add it to the file');
}

/** The exercise as content.json holds it: its slug, its defaults filled in, its Markdown as blocks. */
function build(slug: string, data: Source, problems: string[]): BuiltBreath {
  const what = "a breathing exercise's text";
  return {
    slug,
    title: data.title,
    summary: data.summary,
    goodFor: data.goodFor,
    order: data.order,
    ...(data.suggest ? { suggest: data.suggest } : {}),
    ...(data.draft ? { draft: true } : {}),
    steps: data.steps.map((step) => ({
      do: step.do,
      seconds: step.seconds,
      ...(step.via ? { via: step.via } : {}),
      ...(step.side ? { side: step.side } : {}),
      ...(step.label ? { label: step.label } : {}),
    })),
    how: textBlocks(data.how, 'In "how"', problems, what),
    why: { level: data.why.level, text: textBlocks(data.why.text, 'In "text" in "why"', problems, what), sources: data.why.sources },
  };
}

/**
 * Reads every folder of content/breath/. Problems are added to `problems`; an exercise with a
 * problem is left out of the result.
 */
export async function readBreath(contentDir: string, shownRoot: string, problems: Problem[]): Promise<BreathItem[]> {
  const base = path.join(contentDir, 'breath');
  if (!(await exists(base))) return [];
  const items: BreathItem[] = [];
  // Every exercise whose lines could be read, published or not: the limit of six counts them all,
  // even one with a problem of its own, so that fixing that problem never brings a second surprise.
  let published = 0;
  const folders = (await readdir(base, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const shownDir = `${shownRoot}/breath/${folder.name}`;
    if (!slugPattern.test(folder.name)) {
      problems.push({
        file: shownDir,
        message: 'The name of this folder may only have lowercase letters, digits and single dashes, like long-exhale: rename it.',
      });
      continue;
    }
    const file = path.join(base, folder.name, FILE);
    const shown = `${shownDir}/${FILE}`;
    if (!(await exists(file))) {
      problems.push({ file: shownDir, message: `This folder has no ${FILE}: add it, or delete the folder.` });
      continue;
    }

    let raw: unknown;
    try {
      raw = loadYaml(await readFile(file, 'utf8')) ?? {};
    } catch (error) {
      const e = error as { reason?: string; mark?: { line?: number } };
      problems.push({
        file: shown,
        line: e.mark?.line === undefined ? undefined : e.mark.line + 1,
        message: `The lines cannot be read (${e.reason ?? 'a typing mistake'}): check the colons, the quotes and the spaces at the start of the lines.`,
      });
      continue;
    }
    const isDraft = typeof raw === 'object' && raw !== null && (raw as Record<string, unknown>).draft === true;
    if (!isDraft) published += 1;

    const checked = breathSource.safeParse(raw);
    if (!checked.success) {
      for (const issue of checked.error.issues) problems.push({ file: shown, message: breathSentence(issue, raw) });
      continue;
    }
    const found: string[] = [];
    const built = build(folder.name, checked.data, found);
    if (found.length > 0) {
      for (const message of found) problems.push({ file: shown, message });
      continue;
    }
    items.push({ slug: folder.name, shown, data: checked.data, built });
  }

  if (published > MAX_PUBLISHED_BREATH) {
    problems.push({
      file: `${shownRoot}/breath`,
      message: `${published} breathing exercises are published: ${MAX_PUBLISHED_BREATH} at most, so that choosing stays easy. Add "draft: true" to one, or delete one.`,
    });
  }
  return items;
}
