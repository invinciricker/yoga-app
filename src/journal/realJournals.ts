/**
 * The guided journals of content/, as the app reads them: for tests only (never imported by the app).
 * Read with the content check, so a test sees exactly what the build publishes.
 */
import path from 'node:path';

import { guidedJournal, type GuidedJournal } from '../../shared/content-schema';
import { readContent } from '../../tools/content/read';

export async function realJournal(slug: string): Promise<GuidedJournal> {
  const { loaded, problems } = await readContent(path.join(__dirname, '..', '..', 'content'));
  if (problems.length > 0) throw new Error(problems.map((p) => p.message).join('\n'));
  const found = loaded!.guidedJournals.find((g) => g.slug === slug);
  if (!found) throw new Error(`No journal "${slug}" in content/`);
  return guidedJournal.parse(found.built);
}
