/**
 * Reading and checking the files in content/.
 *
 * This is steps 1 and 2 of the specification at the end of docs/CONTENT.md:
 *   1. read every folder and refuse what is wrong, each time with the file, the field and a
 *      plain sentence;
 *   2. turn the Markdown text into blocks.
 * The guided journals (content/guided-journals/) are read by journals.ts, the breathing exercises
 * (content/breath/) by breath.ts.
 * It prepares no picture and writes nothing, so it is fast: `npm run content:check` uses it alone,
 * and the build (build.ts) starts from its result.
 */
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

import {
  journalSource,
  lessonSource,
  seriesSource,
  siteSource,
  slugPattern,
  studioSource,
} from '../../shared/content-schema';
import { readBreath, type BreathItem } from './breath';
import { readGuidedJournals, type GuidedJournalItem } from './journals';
import { markdownToBlocks, type DraftBlock } from './markdown';
import { checkPicture } from './pictures';
import { problemsFromZod, type Problem } from './problems';

/** One lesson, series or journal entry, as written. */
export type Item<T> = {
  slug: string;
  /** The folder on disk. */
  dir: string;
  /** The file as printed in messages: content/lessons/<slug>/lesson.md */
  shown: string;
  data: T;
  body: DraftBlock[];
};

export type LessonItem = Item<z.infer<typeof lessonSource>>;
export type SeriesItem = Item<z.infer<typeof seriesSource>>;
export type JournalItem = Item<z.infer<typeof journalSource>>;
export type StudioItem = Omit<Item<z.infer<typeof studioSource>>, 'slug'>;

export type Loaded = {
  site: z.infer<typeof siteSource>;
  studio: StudioItem;
  series: SeriesItem[];
  lessons: LessonItem[];
  journal: JournalItem[];
  /** The guided journals (Phase 5), by folder name. */
  guidedJournals: GuidedJournalItem[];
  /** The breathing exercises (Phase 7), by folder name. */
  breath: BreathItem[];
};

export type ReadResult = { loaded?: Loaded; problems: Problem[] };

const exists = (file: string) => stat(file).then(() => true, () => false);
const parseYaml = (text: string) => yaml.load(text) as object;

/** A YAML mistake, said plainly. `firstLine` is where the YAML starts in the file. */
function yamlProblem(shown: string, error: unknown, firstLine: number): Problem {
  const e = error as { reason?: string; mark?: { line?: number } };
  return {
    file: shown,
    line: e.mark?.line === undefined ? undefined : e.mark.line + firstLine,
    message: `The lines at the top cannot be read (${e.reason ?? 'a typing mistake'}): check the colons, the quotes and the spaces at the start of the lines.`,
  };
}

type Schema<T> = z.ZodType<T>;

/** Reads one Markdown file: checks its frontmatter and turns its text into blocks. */
async function readMarkdown<T>(
  dir: string,
  name: string,
  shownDir: string,
  schema: Schema<T>,
  problems: Problem[],
): Promise<Omit<Item<T>, 'slug'> | undefined> {
  const file = path.join(dir, name);
  const shown = `${shownDir}/${name}`;
  if (!(await exists(file))) {
    problems.push({ file: shownDir, message: `This folder has no ${name}: add it, or delete the folder.` });
    return undefined;
  }
  const raw = await readFile(file, 'utf8');
  if (!raw.trimStart().startsWith('---')) {
    problems.push({ file: shown, message: 'The file must start with a line of three dashes (---), then its settings, then another line of three dashes.' });
    return undefined;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw, { engines: { yaml: parseYaml } });
  } catch (error) {
    problems.push(yamlProblem(shown, error, 2)); // the YAML starts on line 2, after the first ---
    return undefined;
  }

  const checked = schema.safeParse(parsed.data);
  if (!checked.success) problems.push(...problemsFromZod(shown, checked.error, parsed.data));

  // Lines in the text are counted from the top of the file, not from the end of the frontmatter.
  const linesBefore = raw.slice(0, raw.length - parsed.content.length).split('\n').length - 1;
  const text = markdownToBlocks(parsed.content);
  for (const p of text.problems) {
    problems.push({ file: shown, line: p.line === undefined ? undefined : p.line + linesBefore, message: p.message });
  }
  const body = text.blocks.map((block) =>
    block.type === 'picture' && block.line !== undefined ? { ...block, line: block.line + linesBefore } : block,
  );

  if (!checked.success) return undefined;
  return { dir, shown, data: checked.data, body };
}

/** Checks every picture one file uses: its cover or portrait, and the pictures in its text. */
async function checkPictures(
  item: Omit<Item<unknown>, 'slug'>,
  shownDir: string,
  named: (string | undefined)[],
  problems: Problem[],
): Promise<void> {
  const files = new Set<string>();
  for (const name of named) if (name) files.add(name);
  for (const block of item.body) {
    if (block.type !== 'picture') continue;
    if (/^[a-z][a-z0-9+.-]*:|^\/|\.\.\//i.test(block.file) || block.file.includes('/')) {
      problems.push({
        file: item.shown,
        line: block.line,
        message: `The picture "${block.file}" must be a file in the same folder, written with its name only (photo.jpg).`,
      });
      continue;
    }
    files.add(block.file);
  }
  for (const name of files) {
    problems.push(...(await checkPicture(path.join(item.dir, name), `${shownDir}/${name}`)));
  }
}

/** Reads the folders of one kind (lessons, series, journal). */
async function readFolders<T extends { cover?: string }>(
  contentDir: string,
  shownRoot: string,
  kind: string,
  fileName: string,
  schema: Schema<T>,
  problems: Problem[],
  /** Every folder found, even one whose file has a mistake: so one mistake is reported once. */
  found: Set<string>,
): Promise<Item<T>[]> {
  const base = path.join(contentDir, kind);
  if (!(await exists(base))) return [];
  const entries = await readdir(base, { withFileTypes: true });
  const items: Item<T>[] = [];
  // Sorted, so the same input always gives the same output.
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!entry.isDirectory()) continue;
    const shownDir = `${shownRoot}/${kind}/${entry.name}`;
    if (!slugPattern.test(entry.name)) {
      problems.push({
        file: shownDir,
        message: 'The name of this folder may only have lowercase letters, digits and single dashes, like evening-wind-down: rename it.',
      });
      continue;
    }
    found.add(entry.name);
    const dir = path.join(base, entry.name);
    const read = await readMarkdown(dir, fileName, shownDir, schema, problems);
    if (!read) continue;
    await checkPictures(read, shownDir, [read.data.cover], problems);
    items.push({ slug: entry.name, ...read });
  }
  return items;
}

/**
 * Reads and checks everything.
 * @param contentDir where the content is on disk
 * @param shownRoot  how that folder is written in messages (normally "content")
 */
export async function readContent(contentDir: string, shownRoot = 'content'): Promise<ReadResult> {
  const problems: Problem[] = [];

  // --- site.yaml
  let site: Loaded['site'] | undefined;
  const siteFile = path.join(contentDir, 'site.yaml');
  const siteShown = `${shownRoot}/site.yaml`;
  if (!(await exists(siteFile))) {
    problems.push({ file: siteShown, message: 'This file is missing: it holds the name of the app and the first name of the teacher.' });
  } else {
    try {
      const data = parseYaml(await readFile(siteFile, 'utf8')) ?? {};
      const checked = siteSource.safeParse(data);
      if (checked.success) site = checked.data;
      else problems.push(...problemsFromZod(siteShown, checked.error, data));
    } catch (error) {
      problems.push(yamlProblem(siteShown, error, 1));
    }
  }

  // --- studio/studio.md
  const studioDir = path.join(contentDir, 'studio');
  const studioShownDir = `${shownRoot}/studio`;
  const studio = await readMarkdown(studioDir, 'studio.md', studioShownDir, studioSource, problems);
  if (studio) await checkPictures(studio, studioShownDir, [studio.data.portrait], problems);

  // --- the three kinds of folders
  const seriesSlugs = new Set<string>();
  const lessonSlugs = new Set<string>();
  const series = await readFolders(contentDir, shownRoot, 'series', 'series.md', seriesSource, problems, seriesSlugs);
  const lessons = await readFolders(contentDir, shownRoot, 'lessons', 'lesson.md', lessonSource, problems, lessonSlugs);
  const journal = await readFolders(contentDir, shownRoot, 'journal', 'entry.md', journalSource, problems, new Set());
  const guidedJournals = await readGuidedJournals(contentDir, shownRoot, problems);
  const breath = await readBreath(contentDir, shownRoot, problems);

  // --- things that point to each other
  const placeTaken = new Map<string, LessonItem>(); // "series#order" → the lesson already there

  for (const lesson of lessons) {
    const { series: inSeries, order } = lesson.data;
    if (inSeries === undefined) continue;
    if (!seriesSlugs.has(inSeries)) {
      problems.push({
        file: lesson.shown,
        message: `"series" names "${inSeries}", but there is no folder ${shownRoot}/series/${inSeries}: check the spelling, or create the series.`,
      });
      continue;
    }
    const place = `${inSeries}#${order}`;
    const other = placeTaken.get(place);
    if (other) {
      problems.push({
        file: lesson.shown,
        message: `"order" is ${order}, the same as ${other.shown} in the series "${inSeries}": give each lesson of a series its own number.`,
      });
    } else {
      placeTaken.set(place, lesson);
    }
  }

  for (const entry of journal) {
    for (const related of entry.data.related) {
      if (!lessonSlugs.has(related)) {
        problems.push({
          file: entry.shown,
          message: `"related" names "${related}", but there is no folder ${shownRoot}/lessons/${related}: check the spelling, or remove it from the list.`,
        });
      }
    }
  }

  if (problems.length > 0 || !site || !studio) return { problems };
  return { loaded: { site, studio, series, lessons, journal, guidedJournals, breath }, problems };
}
