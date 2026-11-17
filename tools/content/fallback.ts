/**
 * The bundled fallback: a copy of the content that travels INSIDE the app.
 *
 *   npm run content:fallback
 *
 * Why: the very first time the app is opened there is no saved copy yet. If the phone also has no
 * network at that moment, the app shows this copy instead of an empty screen.
 *
 * What it does: runs the content build, then copies content.json (no drafts) to
 * assets/content-fallback.json. That file is in .gitignore ON PURPOSE: it is made fresh each time
 * the app is bundled (the Pages workflow, the preview update, and on Expo's machine through the
 * "eas-build-post-install" script in package.json). The app survives the file being absent
 * (src/content/fallback.ts).
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_OUT_DIR, readArgs, runBuild } from './build';

const TARGET = path.join('assets', 'content-fallback.json');

async function main(): Promise<boolean> {
  const argv = process.argv.slice(2);
  if (!(await runBuild(argv))) return false;
  const outDir = readArgs(argv).values.get('--out') ?? DEFAULT_OUT_DIR;
  await mkdir(path.dirname(TARGET), { recursive: true });
  await copyFile(path.join(outDir, 'content.json'), TARGET);
  console.log(`Copied content.json to ${TARGET} (the copy bundled inside the app).`);
  return true;
}

main().then(
  (ok) => process.exit(ok ? 0 : 1),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
