/**
 * The two legal pages of the app, made from files in the repository (You → Privacy, About → Open-source
 * licences):
 *
 *   npm run legal   → src/legal/privacy.json    docs/legal/privacy-policy.md turned into blocks, with
 *                                               the same Markdown code as the content build. {updated}
 *                                               is written out ("17 November 2026"); {appName},
 *                                               {teacher}, {contactEmail} and {publisher} stay, and are
 *                                               filled from the content when the page is drawn
 *                                               (src/legal/fill.ts), so a change to site.yaml needs no
 *                                               new app.
 *                   → src/legal/licences.json   every library in "dependencies" of package.json, with
 *                                               the name of its licence, and the two typefaces.
 *
 * Both files are kept in git (the app bundles them). tools/legal/build.test.ts fails when either is
 * out of date, for example when a library was added without running this again.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

import type { Block, Span } from '../../shared/content-schema';
import { strings } from '../../src/strings';
import { markdownToBlocks } from '../content/markdown';

const ROOT = path.join(__dirname, '..', '..');
export const POLICY_FILE = path.join(ROOT, 'docs', 'legal', 'privacy-policy.md');
export const PRIVACY_JSON = path.join(ROOT, 'src', 'legal', 'privacy.json');
export const LICENCES_JSON = path.join(ROOT, 'src', 'legal', 'licences.json');

export type Privacy = { title: string; updated: string; blocks: Block[] };
export type Licence = { name: string; licence: string };
export type Licences = { libraries: Licence[]; fonts: Licence[] };

/** "2026-11-17" (or the Date that YAML makes of it) → "17 November 2026". */
export function writtenDate(value: unknown): string {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) throw new Error(`docs/legal/privacy-policy.md: "updated" must be a date like 2026-11-17 (found "${text}").`);
  return `${Number(m[3])} ${strings.common.months[Number(m[2]) - 1]} ${m[1]}`;
}

const fillSpan = (span: Span, from: string, to: string): Span => ({ ...span, text: span.text.split(from).join(to) });

/** The policy as blocks. Its first line, "# Privacy", becomes the page's title. */
export async function makePrivacy(file = POLICY_FILE): Promise<Privacy> {
  const { data, content } = matter(await readFile(file, 'utf8'));
  const updated = writtenDate(data.updated);
  const heading = /^\s*#\s+(.+)\n/.exec(content);
  if (!heading) throw new Error('docs/legal/privacy-policy.md must start with a title line: "# Privacy".');
  const { blocks, problems } = markdownToBlocks(content.slice(heading.index + heading[0].length));
  if (problems.length > 0) {
    throw new Error(problems.map((p) => `docs/legal/privacy-policy.md, line ${p.line ?? '?'}: ${p.message}`).join('\n'));
  }
  const filled: Block[] = blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
      case 'quote':
        return { ...block, spans: block.spans.map((s) => fillSpan(s, '{updated}', updated)) };
      case 'list':
        return { ...block, items: block.items.map((item) => item.map((s) => fillSpan(s, '{updated}', updated))) };
      case 'heading':
        return block;
      default:
        throw new Error('docs/legal/privacy-policy.md: pictures cannot be used in the privacy policy.');
    }
  });
  return { title: heading[1].trim(), updated, blocks: filled };
}

/** The usual names of the licences found in package.json files (SPDX identifiers). */
const licenceNames: Record<string, string> = {
  MIT: 'MIT License',
  ISC: 'ISC License',
  'Apache-2.0': 'Apache License 2.0',
  'BSD-2-Clause': 'BSD 2-Clause License',
  'BSD-3-Clause': 'BSD 3-Clause License',
  'OFL-1.1': 'SIL Open Font License 1.1',
  '0BSD': 'BSD Zero Clause License',
};

/** "MIT AND OFL-1.1" → "MIT License and SIL Open Font License 1.1". An unknown name is kept as it is. */
export function licenceName(spdx: string): string {
  return spdx
    .replace(/[()]/g, '')
    .split(/\s+(AND|OR)\s+/)
    .map((part) => (part === 'AND' ? 'and' : part === 'OR' ? 'or' : (licenceNames[part] ?? part)))
    .join(' ');
}

/** The typefaces bundled in the app (src/theme/fonts.ts). */
const FONTS: Licence[] = [
  { name: 'Cormorant Garamond', licence: licenceNames['OFL-1.1'] },
  { name: 'Figtree', licence: licenceNames['OFL-1.1'] },
];

/** Every library the app ships with ("dependencies"), in alphabetical order, with its licence. */
export async function makeLicences(root = ROOT): Promise<Licences> {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
  const libraries: Licence[] = [];
  for (const name of Object.keys(pkg.dependencies).sort()) {
    const own = JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8')) as {
      license?: string | { type?: string };
    };
    const spdx = typeof own.license === 'string' ? own.license : (own.license?.type ?? 'See the library');
    libraries.push({ name, licence: licenceName(spdx) });
  }
  return { libraries, fonts: FONTS };
}

/** How the files are written: indented JSON, one line at the end. */
export const asText = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

/** Writes both files. */
export async function writeLegal(): Promise<void> {
  await writeFile(PRIVACY_JSON, asText(await makePrivacy()));
  await writeFile(LICENCES_JSON, asText(await makeLicences()));
}

// Only when this file is the one being run (not when a test imports it).
if (require.main === module) {
  writeLegal().then(
    () => console.log('Wrote src/legal/privacy.json and src/legal/licences.json.'),
    (error: Error) => {
      console.error(error.message);
      process.exit(1);
    },
  );
}
