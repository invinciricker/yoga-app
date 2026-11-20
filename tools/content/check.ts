/**
 * The content check: is everything in content/ written correctly?
 *
 *   npm run content:check
 *
 * It reads and checks every file (steps 1 and 2 of docs/CONTENT.md, "What the app receives")
 * but prepares no picture and writes nothing, so it takes a second. It is part of `npm run check`,
 * which GitHub runs on every pull request: a mistake in a lesson shows there as a red cross,
 * with one sentence per problem saying which file, which line and what to do.
 */
import { DEFAULT_CONTENT_DIR, listDraftsAndSamples, printLists, printProblems, readArgs } from './build';
import { readContent } from './read';

async function main(): Promise<boolean> {
  const { values } = readArgs(process.argv.slice(2));
  const contentDir = values.get('--content') ?? DEFAULT_CONTENT_DIR;
  const { loaded, problems } = await readContent(contentDir, contentDir.replace(/\\/g, '/').replace(/\/+$/, ''));
  if (!loaded) {
    printProblems(problems);
    return false;
  }
  console.log(
    `Content is fine: ${loaded.lessons.length} lessons, ${loaded.series.length} series, ${loaded.journal.length} journal entries, ${loaded.guidedJournals.length} guided journal${loaded.guidedJournals.length === 1 ? "" : "s"}, ${loaded.breath.length} breathing exercise${loaded.breath.length === 1 ? "" : "s"}.`,
  );
  const { drafts, samples } = listDraftsAndSamples(loaded);
  printLists(drafts, samples);
  return true;
}

main().then(
  (ok) => process.exit(ok ? 0 : 1),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
