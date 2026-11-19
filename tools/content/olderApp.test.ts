/**
 * An older app meeting the new content (docs/phases/phase-6.md, "Watch out for" 5).
 *
 * For a while after Phase 6 is merged, the Phase 5 app on people's phones downloads a content.json
 * that holds the Habit and Health journals before its own update arrives. This reads that file with
 * the Phase 5 schema, copied unchanged from git into __fixtures__/phase-5/, and proves that:
 *   - both journals stay readable, and the rest of the content still loads;
 *   - every `dots` prompt and every prompt shown only in some rounds (`showIf: { round }`) is left out;
 *   - everything else is kept, page by page.
 */
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildContent } from './build';
import { formatProblem } from './problems';
import * as phase5 from './__fixtures__/phase-5/content-schema';

const VALID = path.join(__dirname, '__fixtures__', 'valid');
const PHASE6 = path.join(__dirname, '..', '..', 'docs', 'phases', 'phase-6');

type RawPrompt = { kind: string; id?: string; showIf?: Record<string, unknown> };
type RawJournal = { slug: string; sections: { id: string; pages: { id: string; prompts: RawPrompt[] }[] }[] };

let tmp: string;
let built: { guidedJournals: RawJournal[] } & Record<string, unknown>;

beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), 'ywm-older-app-'));
  const dir = path.join(tmp, 'content');
  await cp(VALID, dir, { recursive: true });
  for (const slug of ['habit', 'health']) {
    await mkdir(path.join(dir, 'guided-journals', slug));
    await cp(path.join(PHASE6, `${slug}-journal.yaml`), path.join(dir, 'guided-journals', slug, 'journal.yaml'));
  }
  const result = await buildContent({ contentDir: dir, outDir: path.join(tmp, 'out'), now: new Date('2026-11-19T12:00:00Z') });
  if (!result.ok) throw new Error(result.problems.map(formatProblem).join('\n'));
  // What the phone downloads: the file as JSON text, read back.
  built = JSON.parse(JSON.stringify(result.content));
});
afterAll(async () => {
  await rm(tmp, { recursive: true, force: true });
});

/** A prompt the Phase 5 app cannot draw: a kind it does not know, or a showIf without a prompt. */
const newOnly = (p: RawPrompt) => p.kind === 'dots' || (p.showIf !== undefined && !('prompt' in p.showIf));

describe('the Phase 5 app reading the Phase 6 journals', () => {
  it('reads the whole file, with both journals', () => {
    const read = phase5.contentFile.safeParse(built);
    expect(read.success).toBe(true);
    expect(read.data?.guidedJournals?.map((j) => j.slug)).toEqual(['habit', 'small-steps', 'health']);
    expect(read.data?.lessons.length).toBe((built.lessons as unknown[]).length);
  });

  it.each(['habit', 'health'])('keeps every page of %s, leaves out its dots and its prompts by round, and keeps the rest', (slug) => {
    const written = built.guidedJournals.find((j) => j.slug === slug)!;
    const read = phase5.contentFile.parse(built).guidedJournals!.find((j) => j.slug === slug)!;

    // The same sections and pages, in the same order.
    expect(read.sections.map((s) => [s.id, s.pages.map((p) => p.id)])).toEqual(written.sections.map((s) => [s.id, s.pages.map((p) => p.id)]));

    for (const [si, section] of written.sections.entries()) {
      for (const [pi, page] of section.pages.entries()) {
        const kept = read.sections[si].pages[pi].prompts;
        // Nothing a Phase 5 app cannot draw is left on the page…
        expect(kept.filter((p) => newOnly(p as RawPrompt))).toEqual([]);
        // …and every other prompt is there, in order (a note by its kind, the rest by their ids).
        const expected = page.prompts.filter((p) => !newOnly(p)).map((p) => p.id ?? p.kind);
        expect(kept.map((p) => ('id' in p ? p.id : p.kind))).toEqual(expected);
        // No page is left with nothing to show.
        expect(kept.length).toBeGreaterThan(0);
      }
    }
  });

  it('leaves out exactly the dots and the prompts by round of the Habit week page', () => {
    const week = built.guidedJournals.find((j) => j.slug === 'habit')!.sections[1].pages[1];
    const dropped = week.prompts.filter(newOnly).map((p) => (p.kind === 'dots' ? 'dots' : `${p.kind} ${JSON.stringify(p.showIf)}`));
    expect(dropped).toEqual([
      'dots',
      'note {"round":1}',
      'note {"round":3}',
      'note {"round":6}',
      'note {"round":10}',
      'dots',
      'choice {"round":10}',
    ]);
  });
});
