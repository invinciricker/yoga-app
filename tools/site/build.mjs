// Puts together everything that goes to GitHub Pages, in the folder dist-site/:
//   site/   → the root (the small public website)
//   dist/   → app/  (the web preview of the app; make it first with: npm run build:web)
//   an empty .nojekyll file, so GitHub serves folders whose name starts with "_"
// Phase 1 adds content/v1/.
// Run: npm run build:site
import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = root + 'dist-site/';

const exists = (path) => stat(path).then(() => true, () => false);

if (!(await exists(root + 'dist/index.html'))) {
  console.error('The web export is missing. Run "npm run build:web" first.');
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(root + 'site/', out, { recursive: true });
await cp(root + 'dist/', out + 'app/', { recursive: true });
await writeFile(out + '.nojekyll', '');
console.log('dist-site/ is ready: the website at its root, the web preview under app/.');
