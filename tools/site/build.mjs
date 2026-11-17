// Puts together everything that goes to GitHub Pages, in the folder dist-site/:
//   site/   → the root (the small public website)
//   dist/   → app/  (the web preview of the app; make it first with: npm run build:web)
//   an empty .nojekyll file, so GitHub serves folders whose name starts with "_"
// The folder dist-site/content/ (what the app downloads) is made BEFORE this, by
// "npm run content:build", and is left untouched here. Without it the app has nothing to show.
// Run: npm run build:site
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = root + 'dist-site/';

const exists = (path) => stat(path).then(() => true, () => false);

if (!(await exists(root + 'dist/index.html'))) {
  console.error('The web export is missing. Run "npm run build:web" first.');
  process.exit(1);
}

// Start clean, but keep the content that was built just before.
await mkdir(out, { recursive: true });
for (const name of await readdir(out)) {
  if (name !== 'content') await rm(out + name, { recursive: true, force: true });
}
if (!(await exists(out + 'content/v1/content.json'))) {
  console.error('The content is missing. Run "npm run content:build" first.');
  process.exit(1);
}
await cp(root + 'site/', out, { recursive: true });
await cp(root + 'dist/', out + 'app/', { recursive: true });
await writeFile(out + '.nojekyll', '');
console.log('dist-site/ is ready: the website at its root, the web preview under app/, the content under content/v1/.');
