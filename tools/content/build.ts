/**
 * The content build: turns the files in content/ into what the app downloads.
 *
 *   npm run content:build              → dist-site/content/v1/content.json   (published items)
 *                                        dist-site/content/v1/preview.json   (drafts included)
 *                                        dist-site/content/v1/media/*.webp   (the pictures)
 *   npm run content:build -- --release   also refuses to finish while a "sample: true" remains, or while
 *                                        site.yaml lacks contactEmail or publisher (the privacy page names them)
 *
 * It follows docs/CONTENT.md, "What the app receives", step by step (the numbers below).
 * The same input always gives byte-identical output, except the "generatedAt" time.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

import { contentFile, SCHEMA_VERSION, type Block, type Image } from '../../shared/content-schema';
import { auraForSlug } from '../../src/theme/auraForSlug';
import type { DraftBlock } from './markdown';
import { preparePicture } from './pictures';
import { formatProblem, type Problem } from './problems';
import { readContent, type Loaded } from './read';

/** What we write: the shape the app reads, before the app fills in the optional fields. */
type ContentJson = z.input<typeof contentFile>;

export const SIZE_WARNING_BYTES = 400 * 1024;

export type BuildOptions = {
  /** Where the content is. */
  contentDir: string;
  /** Where to write content.json, preview.json and media/. Emptied first. */
  outDir: string;
  /** How the content folder is written in messages. */
  shownRoot?: string;
  /** For a store release: fail while any sample remains. */
  release?: boolean;
  /** The time written in "generatedAt". Given by the tests so they can compare outputs. */
  now?: Date;
};

export type BuildResult =
  | { ok: false; problems: Problem[] }
  | {
      ok: true;
      content: ContentJson;
      preview: ContentJson;
      /** Lines for the summary printed at the end. */
      counts: { lessons: number; series: number; journal: number; pictures: number };
      drafts: string[];
      samples: string[];
      warnings: string[];
    };

/** Newest first, then by title. Plain comparisons, so every machine sorts the same way. */
function byNewest(a: { published: unknown; title: string }, b: { published: unknown; title: string }): number {
  // "published" is always a day written as 2026-11-20 here, so comparing the text compares the dates.
  const [dayA, dayB] = [String(a.published), String(b.published)];
  if (dayA !== dayB) return dayA < dayB ? 1 : -1;
  return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

export async function buildContent(options: BuildOptions): Promise<BuildResult> {
  const { contentDir, outDir, shownRoot = 'content', release = false, now = new Date() } = options;

  // Steps 1 and 2: read, check, and turn the Markdown into blocks.
  const { loaded, problems } = await readContent(contentDir, shownRoot);
  if (!loaded) return { ok: false, problems };

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Step 3: the pictures. Each file is prepared once, even if it is used twice.
  const mediaDir = path.join(outDir, 'media');
  const prepared = new Map<string, Promise<Image>>();
  const picture = async (dir: string, name: string, alt: string): Promise<Image> => {
    const file = path.join(dir, name);
    if (!prepared.has(file)) prepared.set(file, preparePicture(file, '', mediaDir));
    return { ...(await prepared.get(file)!), alt };
  };
  const blocks = async (dir: string, body: DraftBlock[]): Promise<Block[]> => {
    const out: Block[] = [];
    for (const block of body) {
      out.push(block.type === 'picture' ? { type: 'image', image: await picture(dir, block.file, block.alt) } : block);
    }
    return out;
  };
  const cover = async (dir: string, data: { cover?: string; coverAlt?: string }) =>
    data.cover ? await picture(dir, data.cover, data.coverAlt ?? '') : undefined;

  // Steps 4 and 5: the aura when none was chosen, then the order.
  const lessons: ContentJson['lessons'] = [];
  for (const { slug, dir, data, body } of loaded.lessons) {
    lessons.push({
      slug,
      title: data.title,
      summary: data.summary,
      published: data.published,
      ...(data.draft ? { draft: true } : {}),
      level: data.level,
      minutes: data.minutes,
      focus: data.focus,
      series: data.series,
      order: data.order,
      cover: await cover(dir, data),
      aura: data.aura ?? auraForSlug(slug),
      video: data.video,
      props: data.props,
      flow: data.flow,
      note: data.note,
      featured: data.featured,
      body: await blocks(dir, body),
    });
  }
  lessons.sort(byNewest);

  const journal: ContentJson['journal'] = [];
  for (const { slug, dir, data, body } of loaded.journal) {
    journal.push({
      slug,
      kind: data.kind,
      title: data.title,
      summary: data.summary,
      published: data.published,
      ...(data.draft ? { draft: true } : {}),
      cover: await cover(dir, data),
      aura: data.aura ?? auraForSlug(slug),
      quote: data.quote,
      related: data.related,
      body: await blocks(dir, body),
    });
  }
  journal.sort(byNewest);

  const series: ContentJson['series'] = [];
  for (const { slug, dir, data, body } of loaded.series) {
    series.push({
      slug,
      title: data.title,
      summary: data.summary,
      published: data.published,
      ...(data.draft ? { draft: true } : {}),
      cover: await cover(dir, data),
      aura: data.aura ?? auraForSlug(slug),
      lessons: [], // filled in below, once for each of the two files
      body: await blocks(dir, body),
    });
  }
  series.sort(byNewest);

  const s = loaded.studio.data;
  const studio: ContentJson['studio'] = {
    name: s.name,
    tagline: s.tagline,
    portrait: s.portrait ? await picture(loaded.studio.dir, s.portrait, s.portraitAlt ?? '') : undefined,
    benefits: s.benefits,
    classes: s.classes,
    location: s.location,
    pricing: s.pricing,
    contact: s.contact,
    body: await blocks(loaded.studio.dir, loaded.studio.body),
  };

  /** Step 6: one file from the lists, with or without the drafts. */
  const assemble = (withDrafts: boolean): ContentJson => {
    const keep = <T extends { draft?: boolean }>(items: T[]) => items.filter((item) => withDrafts || !item.draft);
    const keptLessons = keep(lessons);
    const keptSlugs = new Set(keptLessons.map((l) => l.slug));
    const keptSeries = keep(series)
      .map((one) => ({
        ...one,
        // A series lists its lessons by "order".
        lessons: keptLessons
          .filter((l) => l.series === one.slug)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((l) => l.slug),
      }))
      // A series with no lesson to show is not shown.
      .filter((one) => one.lessons.length > 0);
    return {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: now.toISOString(),
      site: loaded.site,
      studio,
      series: keptSeries,
      lessons: keptLessons,
      // An entry never points to a lesson that is not in the same file.
      journal: keep(journal).map((entry) => ({ ...entry, related: (entry.related ?? []).filter((r) => keptSlugs.has(r)) })),
    };
  };

  const content = assemble(false);
  const preview = assemble(true);

  // A safety net: what we write must be what the app accepts.
  contentFile.parse(content);
  contentFile.parse(preview);

  const contentText = JSON.stringify(content) + '\n';
  await writeFile(path.join(outDir, 'content.json'), contentText);
  await writeFile(path.join(outDir, 'preview.json'), JSON.stringify(preview) + '\n');

  // Step 7: what the summary lists. A store release also needs what the privacy page names.
  const { drafts, samples } = listDraftsAndSamples(loaded);
  if (release) {
    const problems: Problem[] = samples.map((file) => ({
      file,
      message: 'This is still sample text ("sample: true"): replace it with the real words and remove that line, or delete it, before the store release.',
    }));
    const siteShown = `${shownRoot}/site.yaml`;
    if (!loaded.site.contactEmail) {
      problems.push({
        file: siteShown,
        message: '"contactEmail" is missing: the privacy page needs the address where people can write about their data. Add a line like "contactEmail: someone@example.com".',
      });
    }
    if (!loaded.site.publisher) {
      problems.push({
        file: siteShown,
        message: '"publisher" is missing: the privacy page needs the name Google Play shows as the developer. Add a line like "publisher: Maria Surname".',
      });
    }
    if (problems.length > 0) return { ok: false, problems };
  }

  // Step 8: time to ask the architect about splitting the file.
  const warnings: string[] = [];
  const bytes = Buffer.byteLength(contentText);
  if (bytes > SIZE_WARNING_BYTES) {
    warnings.push(
      `content.json is ${Math.round(bytes / 1024)} KB, over ${SIZE_WARNING_BYTES / 1024} KB: time to ask the architect about splitting it.`,
    );
  }

  return {
    ok: true,
    content,
    preview,
    counts: { lessons: content.lessons.length, series: content.series.length, journal: content.journal.length, pictures: prepared.size },
    drafts,
    samples,
    warnings,
  };
}

/** The files marked "draft: true" and those marked "sample: true". */
export function listDraftsAndSamples(loaded: Loaded): { drafts: string[]; samples: string[] } {
  const all = [...loaded.lessons, ...loaded.series, ...loaded.journal];
  return {
    drafts: all.filter((item) => item.data.draft).map((item) => item.shown),
    samples: [...all, loaded.studio].filter((item) => item.data.sample).map((item) => item.shown),
  };
}

/** Prints the problems the way GitHub shows them best: one per line, and how many. */
export function printProblems(problems: Problem[]): void {
  console.error(`\nThe content has ${problems.length} problem${problems.length === 1 ? '' : 's'} to fix:\n`);
  for (const problem of problems) console.error(`  ${formatProblem(problem)}`);
  console.error('');
}

export function printLists(drafts: string[], samples: string[]): void {
  console.log(drafts.length ? `Drafts (preview app only): ${drafts.length}` : 'Drafts: none');
  for (const file of drafts) console.log(`  ${file}`);
  console.log(samples.length ? `Samples (to replace before the store release): ${samples.length}` : 'Samples: none');
  for (const file of samples) console.log(`  ${file}`);
}

/** Reads "--name value" and "--flag" from the command line. */
export function readArgs(argv: string[]): { flags: Set<string>; values: Map<string, string>; rest: string[] } {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) rest.push(arg);
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') && (arg === '--out' || arg === '--content')) {
      values.set(arg, argv[++i]);
    } else flags.add(arg);
  }
  return { flags, values, rest };
}

/** The usual places, from the top of the repository. */
export const DEFAULT_CONTENT_DIR = 'content';
export const DEFAULT_OUT_DIR = path.join('dist-site', 'content', 'v1');

/** Runs the build from the command line and prints the summary. Returns false if it failed. */
export async function runBuild(argv: string[]): Promise<boolean> {
  const { flags, values } = readArgs(argv);
  const contentDir = values.get('--content') ?? DEFAULT_CONTENT_DIR;
  const outDir = values.get('--out') ?? DEFAULT_OUT_DIR;
  const result = await buildContent({
    contentDir,
    outDir,
    shownRoot: contentDir.replace(/\\/g, '/').replace(/\/+$/, ''),
    release: flags.has('--release'),
  });
  if (!result.ok) {
    printProblems(result.problems);
    return false;
  }
  const c = result.counts;
  console.log(`Content built into ${outDir}`);
  console.log(`  ${c.lessons} lessons, ${c.series} series, ${c.journal} journal entries, ${c.pictures} pictures (published)`);
  printLists(result.drafts, result.samples);
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  return true;
}

// Only when this file is the one being run (not when a test or another tool imports it).
if (require.main === module) {
  runBuild(process.argv.slice(2)).then(
    (ok) => process.exit(ok ? 0 : 1),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
