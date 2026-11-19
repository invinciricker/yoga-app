/**
 * Guided journals in the content check and the content build (docs/phases/phase-5.md, section 1, and
 * docs/phases/phase-6.md, section 1).
 *
 *   content/guided-journals/<slug>/journal.yaml
 *
 * Each file is read and checked (shared/content-schema.ts, guidedJournalSource), then checked again
 * for what one line cannot see alone: two sections or pages with the same id, a prompt id used for
 * two different questions, a recall that points to nothing, a showIf that names a prompt not earlier
 * on its page (or a round its section never has), "forever" before the last section, weeks that are
 * not seven pages, dots that read nothing they can draw, a prefill that picks no option. Once every
 * journal is read, the `carry` of each is checked against the others. Its Markdown (the intro and
 * the notes) becomes blocks. Every problem is one plain sentence that names the page and the prompt
 * by their ids, because those are what the owner sees in the file.
 */
import { load as loadYaml } from 'js-yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

import { guidedJournalSource, sentencePieces, slugPattern, type Block, type guidedJournal } from '../../shared/content-schema';
import { markdownToBlocks } from './markdown';
import { describeIssue, type Problem } from './problems';

type Source = z.infer<typeof guidedJournalSource>;
type SourcePrompt = Source['sections'][number]['pages'][number]['prompts'][number];
/** A journal as content.json holds it (before the app fills in its defaults). */
export type BuiltJournal = z.input<typeof guidedJournal>;

/** One guided journal, as written and as built. */
export type GuidedJournalItem = {
  slug: string;
  /** The file as printed in messages: content/guided-journals/<slug>/journal.yaml */
  shown: string;
  data: Source;
  built: BuiltJournal;
};

const FILE = 'journal.yaml';
const exists = (file: string) => stat(file).then(() => true, () => false);
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** "the page "d13"", or "page 3" when the page has no readable id. */
function named(kind: 'section' | 'page' | 'prompt', item: unknown, index: number): string {
  const id = isObject(item) && typeof item.id === 'string' ? item.id : undefined;
  if (id) return `the ${kind} "${id}"`;
  if (kind === 'prompt' && isObject(item) && item.kind === 'note') return 'a note';
  if (kind === 'prompt' && isObject(item) && item.kind === 'recall') return 'a recall';
  if (kind === 'prompt' && isObject(item) && item.kind === 'dots') return typeof item.ask === 'string' ? `the dots "${item.ask}"` : 'the dots';
  return `${kind} ${index + 1}`;
}

/**
 * Where an issue sits in a journal, said with ids ("On the page "p2", the prompt "s-sent""), and the
 * path that is left inside that place ("kind").
 */
function placeOf(data: unknown, issuePath: readonly PropertyKey[]): { where: string; rest: PropertyKey[] } {
  const path = [...issuePath];
  /** True when the path goes on into item `path[at + 1]` of the list `name`. */
  const into = (at: number, name: string) => path[at] === name && typeof path[at + 1] === 'number';
  if (!into(0, 'sections') || !isObject(data) || !Array.isArray(data.sections)) return { where: '', rest: path };
  const sectionIndex = path[1] as number;
  const section: unknown = data.sections[sectionIndex];
  if (!into(2, 'pages') || !isObject(section) || !Array.isArray(section.pages)) {
    return { where: `In ${named('section', section, sectionIndex)}`, rest: path.slice(2) };
  }
  const pageIndex = path[3] as number;
  const page: unknown = section.pages[pageIndex];
  const onPage = `On ${named('page', page, pageIndex)}`;
  if (!into(4, 'prompts') || !isObject(page) || !Array.isArray(page.prompts)) return { where: onPage, rest: path.slice(4) };
  const promptIndex = path[5] as number;
  return { where: `${onPage}, ${named('prompt', page.prompts[promptIndex], promptIndex)}`, rest: path.slice(6) };
}

/** The sentence for one zod issue in a journal. */
function journalSentence(issue: z.core.$ZodIssue, data: unknown): string {
  const { where, rest } = placeOf(data, issue.path);
  const prefix = where ? `${where}: ` : '';
  // A page with nothing under "prompts", or an empty list: one plain sentence for both.
  const last = rest[rest.length - 1];
  if (last === 'prompts' && rest.length === 1 && (issue.code === 'invalid_type' || issue.code === 'too_small')) {
    return `${prefix}a page needs at least one prompt.`;
  }
  const whereToAdd = where ? 'add it' : 'add it to the file';
  return `${prefix}${describeIssue(issue, data, rest, whereToAdd)}`;
}

/** The ids that a prompt answers under (notes, recalls and dots have none). */
const answerId = (prompt: SourcePrompt): string | undefined => ('id' in prompt ? prompt.id : undefined);

type SourceSection = Source['sections'][number];

/** How many times a section's pages come round (1 when it does not repeat; Infinity for "forever"). */
const repeatsOf = (section: SourceSection): number => (section.repeat === 'forever' ? Infinity : (section.repeat ?? 1));
/** How many steps one round of a section holds: every page, as many times as it says. */
const roundSteps = (section: SourceSection): number => section.pages.reduce((sum, page) => sum + (page.times ?? 1), 0);

/**
 * The kind of answer a prompt asks for, in words. Two prompts with the same id are the same question
 * asked again (Phase 6), so they must ask for the same kind of answer; the words of the question may differ.
 */
function answerShape(prompt: SourcePrompt): string | undefined {
  switch (prompt.kind) {
    case 'text':
      return 'a text';
    case 'list':
      return `a list of ${prompt.count}`;
    case 'choice':
      return `a choice of ${prompt.many ? 'several' : 'one'} between ${prompt.options.map((o) => `"${o}"`).join(', ')}`;
    case 'scale':
      return `a scale from ${prompt.from} to ${prompt.to}`;
    case 'yesno':
      return 'a yes or no';
    case 'fill': {
      const blanks = sentencePieces(prompt.sentence).length - 1;
      return `a sentence with ${blanks} blank${blanks === 1 ? '' : 's'}`;
    }
    default:
      return undefined;
  }
}

/** "round 3", "rounds 1 and 10". */
function roundsText(round: number | number[]): string {
  const all = Array.isArray(round) ? round : [round];
  return all.length === 1 ? `round ${all[0]}` : `rounds ${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
}

/** "the prompt "h-did"", or "prompt 3" for a note, a recall or dots. */
const promptName = (prompt: SourcePrompt, index: number): string =>
  answerId(prompt) ? `the prompt "${answerId(prompt)}"` : prompt.kind === 'dots' ? `the dots "${prompt.ask}"` : `prompt ${index + 1}`;

/** The rules between lines of one journal. One sentence per problem. */
export function crossProblems(data: Source): string[] {
  const out: string[] = [];

  const sectionIds = new Set<string>();
  for (const section of data.sections) {
    if (sectionIds.has(section.id)) out.push(`Two sections have the id "${section.id}": give each section its own id.`);
    sectionIds.add(section.id);
  }

  data.sections.forEach((section, i) => {
    if (section.repeat === 'forever' && i < data.sections.length - 1) {
      out.push(`The section "${section.id}" repeats forever, but only the last section may: give it a number, or move it to the end.`);
    }
    if (section.numbering === 'weeks' && roundSteps(section) !== 7) {
      out.push(
        `The section "${section.id}" is numbered in weeks, but one round of it is ${roundSteps(section)} pages: a week needs exactly 7 (count each page as many times as its "times").`,
      );
    }
  });

  const pageOwner = new Map<string, string>(); // page id → its section
  // prompt id → where it is first asked, and the kind of answer it asks for
  const promptOwner = new Map<string, { page: string; shape: string | undefined }>();
  for (const section of data.sections) {
    for (const page of section.pages) {
      const other = pageOwner.get(page.id);
      if (other !== undefined) {
        out.push(`Two pages have the id "${page.id}" (in the sections "${other}" and "${section.id}"): give each page its own id.`);
      } else {
        pageOwner.set(page.id, section.id);
      }
      const onThisPage = new Set<string>();
      for (const prompt of page.prompts) {
        const id = answerId(prompt);
        if (id === undefined) continue;
        if (onThisPage.has(id)) {
          out.push(`On the page "${page.id}", two prompts have the id "${id}": give each prompt its own id. People's answers are kept under it.`);
          continue;
        }
        onThisPage.add(id);
        const shape = answerShape(prompt);
        const first = promptOwner.get(id);
        if (first === undefined) {
          promptOwner.set(id, { page: page.id, shape });
        } else if (first.shape !== shape) {
          out.push(
            `The prompt "${id}" is asked on the pages "${first.page}" and "${page.id}" with different kinds of answer (${first.shape} and ${shape}): the same id means the same question asked again, so keep its kind, options and range the same, or give it its own id.`,
          );
        }
      }
    }
  }

  for (const section of data.sections) {
    const repeats = repeatsOf(section);
    // The prompts of this section by id (the first of each), for the rows of the dots.
    const inSection = new Map<string, SourcePrompt>();
    for (const page of section.pages) {
      for (const prompt of page.prompts) {
        const id = answerId(prompt);
        if (id !== undefined && !inSection.has(id)) inSection.set(id, prompt);
      }
    }
    /** The problem with a round named in this section, or undefined. */
    const roundProblem = (round: number | number[], what: string): string | undefined => {
      if (repeats === 1) return `${what} only in ${roundsText(round)}, but the section "${section.id}" does not repeat: remove the round, or give the section a "repeat".`;
      const beyond = (Array.isArray(round) ? round : [round]).filter((r) => r > repeats);
      if (beyond.length > 0) return `${what} in ${roundsText(beyond)}, but the section "${section.id}" has ${repeats} round${repeats === 1 ? '' : 's'}: it would never show.`;
      return undefined;
    };

    for (const page of section.pages) {
      const earlier = new Set<string>();
      page.prompts.forEach((prompt, i) => {
        const which = promptName(prompt, i);
        if (prompt.kind === 'recall' && !promptOwner.has(prompt.of)) {
          out.push(`On the page "${page.id}", the recall points to "${prompt.of}", but no prompt of this journal has that id: check the spelling.`);
        }
        const showIf = prompt.showIf;
        if (showIf?.prompt !== undefined && !earlier.has(showIf.prompt)) {
          out.push(`On the page "${page.id}", ${which} shows only after "${showIf.prompt}", which must come earlier on the same page.`);
        }
        if (showIf?.round !== undefined) {
          const problem = roundProblem(showIf.round, `On the page "${page.id}", ${which} shows`);
          if (problem) out.push(problem);
        }

        if (prompt.kind === 'dots') {
          if (roundSteps(section) > 7) {
            out.push(
              `On the page "${page.id}", ${which} show one round of the section "${section.id}", which has ${roundSteps(section)} pages: a row holds 7 dots at most.`,
            );
          }
          for (const row of prompt.rows) {
            const read = inSection.get(row.of);
            if (!read) {
              out.push(`On the page "${page.id}", the row "${row.label}" of ${which} reads "${row.of}", which is not a prompt of the section "${section.id}": check the spelling.`);
            } else if (!(read.kind === 'yesno' || read.kind === 'scale' || (read.kind === 'choice' && !read.many))) {
              out.push(
                `On the page "${page.id}", the row "${row.label}" of ${which} reads "${row.of}", which is ${answerShape(read)}: dots can show a yes or no, a scale or a choice of one.`,
              );
            }
            if (row.round !== undefined) {
              const problem = roundProblem(row.round, `On the page "${page.id}", the row "${row.label}" of ${which} reads`);
              if (problem) out.push(problem);
            }
          }
        }

        if (prompt.kind === 'choice' && prompt.prefill) {
          if (prompt.many) {
            out.push(`On the page "${page.id}", ${which} lets people choose several options, so it cannot be filled in for them: remove "prefill", or "many".`);
          }
          for (const rule of prompt.prefill.pick) {
            if (!prompt.options.includes(rule.option)) {
              out.push(`On the page "${page.id}", ${which} would fill in "${rule.option}", which is not one of its options: check the spelling.`);
            }
          }
        }

        const id = answerId(prompt);
        if (id !== undefined) earlier.add(id);
      });
    }
  }
  return out;
}

/**
 * The `carry` of every text prompt, checked against the other journals: it must hand its text to a
 * text prompt on the first page of another journal's first section. `journals` holds every journal
 * whose file could be read, by slug; `present`, every folder that has a journal.yaml.
 */
export function carryProblems(slug: string, data: Source, journals: ReadonlyMap<string, Source>, present: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const section of data.sections) {
    for (const page of section.pages) {
      for (const prompt of page.prompts) {
        if (prompt.kind !== 'text' || !prompt.carry) continue;
        const { to, prompt: target } = prompt.carry;
        const where = `On the page "${page.id}", the prompt "${prompt.id}"`;
        const other = to === slug ? undefined : journals.get(to);
        if (to === slug) {
          out.push(`${where} hands its text to its own journal: "carry" is for another journal.`);
        } else if (!other) {
          // A journal that is there but has a problem of its own: that problem is said already.
          if (present.has(to)) continue;
          out.push(`${where} hands its text to the journal "${to}", which is not in content/guided-journals/: check the spelling.`);
        } else if (!other.sections[0].pages[0].prompts.some((p) => p.kind === 'text' && p.id === target)) {
          out.push(`${where} hands its text to "${target}", which is not a text prompt on the first page of the journal "${to}": check the spelling.`);
        }
      }
    }
  }
  return out;
}

/** Markdown → blocks, for a journal (no pictures: a journal has no folder of photos). */
function textBlocks(markdown: string, where: string, problems: string[]): Block[] {
  const { blocks, problems: found } = markdownToBlocks(markdown);
  for (const p of found) problems.push(`${where}: ${p.message}`);
  const out: Block[] = [];
  for (const block of blocks) {
    if (block.type === 'picture') {
      problems.push(`${where}: A picture cannot be used in a journal's text.`);
    } else {
      out.push(block);
    }
  }
  return out;
}

type SourceShowIf = NonNullable<SourcePrompt['showIf']>;

/** A showIf as content.json holds it: `{ prompt, is?, answered? }` or `{ round }`. */
function builtShowIf(showIf: SourceShowIf): { prompt: string; is?: string | number | boolean; answered?: true } | { round: number | number[] } {
  if (showIf.round !== undefined) return { round: showIf.round };
  return {
    prompt: showIf.prompt ?? '',
    ...(showIf.is !== undefined ? { is: showIf.is } : {}),
    ...(showIf.answered ? { answered: showIf.answered } : {}),
  };
}

/** The journal as content.json holds it: its slug, its defaults filled in, its Markdown as blocks. */
function build(slug: string, data: Source, problems: string[]): BuiltJournal {
  return {
    slug,
    title: data.title,
    summary: data.summary,
    aura: data.aura,
    order: data.order,
    minutes: data.minutes,
    ...(data.draft ? { draft: true } : {}),
    intro: data.intro.map((card, i) => ({ title: card.title, text: textBlocks(card.text, `In "intro" ${i + 1}`, problems) })),
    sources: data.sources ?? [],
    ...(data.again ? { again: data.again } : {}),
    sections: data.sections.map((section) => ({
      id: section.id,
      title: section.title,
      repeat: section.repeat ?? 1,
      together: section.together ?? false,
      ...(section.numbering ? { numbering: section.numbering } : {}),
      pages: section.pages.map((page, pi) => ({
        id: page.id,
        title: page.title,
        times: page.times ?? 1,
        ...(page.skip ? { skip: page.skip } : {}),
        prompts: page.prompts.map((source, i) => {
          // The showIf as the app reads it: a prompt's answer, or rounds (never both: the check refused that).
          const { showIf, ...prompt } = source;
          const shown = showIf ? { showIf: builtShowIf(showIf) } : {};
          switch (prompt.kind) {
            case 'note': {
              const where = `On ${named('page', page, pi)}, ${named('prompt', prompt, i)}`;
              return { kind: 'note' as const, text: textBlocks(prompt.text, where, problems), ...shown };
            }
            case 'text':
              return { ...prompt, lines: prompt.lines ?? 3, ...shown };
            case 'choice':
              return { ...prompt, many: prompt.many ?? false, ...shown };
            case 'recall':
              return { ...prompt, which: prompt.which ?? 'latest', ...shown };
            default:
              return { ...prompt, ...shown };
          }
        }),
      })),
    })),
  };
}

/**
 * Reads every folder of content/guided-journals/. Problems are added to `problems`; a journal with
 * a problem is left out of the result.
 */
export async function readGuidedJournals(contentDir: string, shownRoot: string, problems: Problem[]): Promise<GuidedJournalItem[]> {
  const base = path.join(contentDir, 'guided-journals');
  if (!(await exists(base))) return [];
  const items: GuidedJournalItem[] = [];
  // Every journal whose lines could be read, for the check of `carry` once all are read; and every
  // folder with a journal, readable or not (a carry to a journal with its own problem is not one more).
  const readable = new Map<string, Source>();
  const present = new Set<string>();
  const folders = (await readdir(base, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const shownDir = `${shownRoot}/guided-journals/${folder.name}`;
    if (!slugPattern.test(folder.name)) {
      problems.push({
        file: shownDir,
        message: 'The name of this folder may only have lowercase letters, digits and single dashes, like gratitude: rename it.',
      });
      continue;
    }
    const file = path.join(base, folder.name, FILE);
    const shown = `${shownDir}/${FILE}`;
    if (!(await exists(file))) {
      problems.push({ file: shownDir, message: `This folder has no ${FILE}: add it, or delete the folder.` });
      continue;
    }

    present.add(folder.name);
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

    const checked = guidedJournalSource.safeParse(raw);
    if (!checked.success) {
      for (const issue of checked.error.issues) problems.push({ file: shown, message: journalSentence(issue, raw) });
      continue;
    }
    readable.set(folder.name, checked.data);
    const found = crossProblems(checked.data);
    const built = build(folder.name, checked.data, found);
    if (found.length > 0) {
      for (const message of found) problems.push({ file: shown, message });
      continue;
    }
    items.push({ slug: folder.name, shown, data: checked.data, built });
  }

  // A carry needs the other journals: checked once all are read.
  return items.filter((item) => {
    const found = carryProblems(item.slug, item.data, readable, present);
    for (const message of found) problems.push({ file: item.shown, message });
    return found.length === 0;
  });
}
