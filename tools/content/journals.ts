/**
 * Guided journals in the content check and the content build (docs/phases/phase-5.md, section 1).
 *
 *   content/guided-journals/<slug>/journal.yaml
 *
 * Each file is read and checked (shared/content-schema.ts, guidedJournalSource), then checked again
 * for what one line cannot see alone: two ids the same, a recall that points to nothing, a showIf
 * that names a prompt not earlier on its page, "forever" before the last section. Its Markdown
 * (the intro and the notes) becomes blocks. Every problem is one plain sentence that names the page
 * and the prompt by their ids, because those are what the owner sees in the file.
 */
import { load as loadYaml } from 'js-yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { z } from 'zod';

import { guidedJournalSource, slugPattern, type Block, type guidedJournal } from '../../shared/content-schema';
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

/** The ids that a prompt answers under (notes and recalls have none). */
const answerId = (prompt: SourcePrompt): string | undefined => ('id' in prompt ? prompt.id : undefined);

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
  });

  const pageOwner = new Map<string, string>(); // page id → its section
  const promptOwner = new Map<string, string>(); // prompt id → its page
  for (const section of data.sections) {
    for (const page of section.pages) {
      const other = pageOwner.get(page.id);
      if (other !== undefined) {
        out.push(`Two pages have the id "${page.id}" (in the sections "${other}" and "${section.id}"): give each page its own id.`);
      } else {
        pageOwner.set(page.id, section.id);
      }
      for (const prompt of page.prompts) {
        const id = answerId(prompt);
        if (id === undefined) continue;
        const owner = promptOwner.get(id);
        if (owner !== undefined) {
          out.push(`Two prompts have the id "${id}" (on the pages "${owner}" and "${page.id}"): give each prompt its own id. People's answers are kept under it.`);
        } else {
          promptOwner.set(id, page.id);
        }
      }
    }
  }

  for (const section of data.sections) {
    for (const page of section.pages) {
      const earlier = new Set<string>();
      page.prompts.forEach((prompt, i) => {
        if (prompt.kind === 'recall' && !promptOwner.has(prompt.of)) {
          out.push(`On the page "${page.id}", the recall points to "${prompt.of}", but no prompt of this journal has that id: check the spelling.`);
        }
        if (prompt.showIf && !earlier.has(prompt.showIf.prompt)) {
          const which = answerId(prompt) ? `the prompt "${answerId(prompt)}"` : `prompt ${i + 1}`;
          out.push(`On the page "${page.id}", ${which} shows only after "${prompt.showIf.prompt}", which must come earlier on the same page.`);
        }
        const id = answerId(prompt);
        if (id !== undefined) earlier.add(id);
      });
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
    sections: data.sections.map((section) => ({
      id: section.id,
      title: section.title,
      repeat: section.repeat ?? 1,
      together: section.together ?? false,
      pages: section.pages.map((page, pi) => ({
        id: page.id,
        title: page.title,
        times: page.times ?? 1,
        ...(page.skip ? { skip: page.skip } : {}),
        prompts: page.prompts.map((prompt, i) => {
          switch (prompt.kind) {
            case 'note': {
              const where = `On ${named('page', page, pi)}, ${named('prompt', prompt, i)}`;
              return { kind: 'note' as const, text: textBlocks(prompt.text, where, problems), ...(prompt.showIf ? { showIf: prompt.showIf } : {}) };
            }
            case 'text':
              return { ...prompt, lines: prompt.lines ?? 3 };
            case 'choice':
              return { ...prompt, many: prompt.many ?? false };
            case 'recall':
              return { ...prompt, which: prompt.which ?? 'latest' };
            default:
              return prompt;
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
    const found = crossProblems(checked.data);
    const built = build(folder.name, checked.data, found);
    if (found.length > 0) {
      for (const message of found) problems.push({ file: shown, message });
      continue;
    }
    items.push({ slug: folder.name, shown, data: checked.data, built });
  }
  return items;
}
