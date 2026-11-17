/**
 * Puts together everything that goes to GitHub Pages, in the folder dist-site/:
 *   site/          → the root (the small public website)
 *   privacy.html   → made here from src/legal/privacy.json (the same text as You → Privacy in the
 *                    app), with the names filled from the content just built. Google Play asks for
 *                    this address: https://invinciricker.github.io/yoga-app/privacy.html
 *   fonts/         → the font files the app bundles, so the website asks no other site for fonts
 *   dist/          → app/  (the web preview of the app; make it first with: npm run build:web)
 *   an empty .nojekyll file, so GitHub serves folders whose name starts with "_"
 * The folder dist-site/content/ (what the app downloads) is made BEFORE this, by
 * "npm run content:build", and is left untouched here. Without it the app has nothing to show.
 * Run: npm run build:site
 */
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Block, ContentFile, Span } from '../../shared/content-schema';
import { fillPlaceholders, placeholderValues } from '../../src/legal/fill';
import { privacyPolicy } from '../../src/legal';

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'dist-site');

/** The font files the website uses (the same files as the app: src/theme/fonts.ts). */
export const FONT_FILES = [
  '@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf',
  '@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf',
  '@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf',
  '@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf',
];

const exists = (file: string) => stat(file).then(() => true, () => false);

/** Text made safe to put inside HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function spansToHtml(spans: Span[]): string {
  return spans
    .map((span) => {
      let html = escapeHtml(span.text).replace(/\n/g, '<br>');
      if (span.italic) html = `<em>${html}</em>`;
      if (span.bold) html = `<strong>${html}</strong>`;
      if (span.href) html = `<a href="${escapeHtml(span.href)}">${html}</a>`;
      return html;
    })
    .join('');
}

/** The blocks of the content format as HTML. Pictures are left out (the policy has none). */
export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
        case 'paragraph':
          return `<p>${spansToHtml(block.spans)}</p>`;
        case 'quote':
          return `<blockquote>${spansToHtml(block.spans)}</blockquote>`;
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul';
          return `<${tag}>${block.items.map((item) => `<li>${spansToHtml(item)}</li>`).join('')}</${tag}>`;
        }
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n    ');
}

/** privacy.html, in the look of site/index.html. The colours are the app's tokens (dark palette). */
export function privacyPage(site: ContentFile['site']): string {
  const blocks = fillPlaceholders(privacyPolicy.blocks, placeholderValues(site));
  const appName = escapeHtml(site.appName);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(privacyPolicy.title)} · ${appName}</title>
  <meta name="description" content="What the ${appName} app knows about you, in plain words.">
  <meta name="theme-color" content="#0C1311">
  <link rel="stylesheet" href="fonts.css">
  <!-- Made by npm run build:site from docs/legal/privacy-policy.md. The colours are the app's tokens. -->
  <style>
    html { background: #0C1311; }
    body {
      margin: 0; background: #0C1311; color: #C3BDAE;
      font-family: 'Figtree', system-ui, sans-serif; font-size: 17px; line-height: 27px;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 560px; margin: 0 auto; padding: 40px 20px 72px; }
    a { color: #E3B45E; }
    a.home {
      display: inline-flex; align-items: center; min-height: 48px; font-size: 15px; font-weight: 600;
      text-decoration: none;
    }
    h1, h2, h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; color: #F3ECDD; }
    h1 { margin: 24px 0 16px; font-size: 44px; line-height: 46px; letter-spacing: -0.4px; }
    h2 { margin: 40px 0 12px; font-size: 30px; line-height: 34px; letter-spacing: -0.2px; }
    h3 { margin: 32px 0 8px; font-size: 24px; line-height: 28px; }
    p, ul, ol, blockquote { margin: 0 0 20px; }
    strong { color: #F3ECDD; font-weight: 600; }
    blockquote {
      padding: 24px; border-radius: 20px; background: #131D19; border: 1px solid #22302A;
      font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 23px; line-height: 31px;
      color: #F3ECDD;
    }
  </style>
</head>
<body>
  <main>
    <a class="home" href="./">← ${appName}</a>
    <h1>${escapeHtml(privacyPolicy.title)}</h1>
    ${blocksToHtml(blocks)}
  </main>
</body>
</html>
`;
}

export async function buildSite(): Promise<void> {
  if (!(await exists(path.join(ROOT, 'dist', 'index.html')))) {
    throw new Error('The web export is missing. Run "npm run build:web" first.');
  }
  // Start clean, but keep the content that was built just before.
  await mkdir(OUT, { recursive: true });
  for (const name of await readdir(OUT)) {
    if (name !== 'content') await rm(path.join(OUT, name), { recursive: true, force: true });
  }
  const contentFile = path.join(OUT, 'content', 'v1', 'content.json');
  if (!(await exists(contentFile))) throw new Error('The content is missing. Run "npm run content:build" first.');
  const content = JSON.parse(await readFile(contentFile, 'utf8')) as ContentFile;

  await cp(path.join(ROOT, 'site'), OUT, { recursive: true });
  await mkdir(path.join(OUT, 'fonts'), { recursive: true });
  for (const font of FONT_FILES) {
    await cp(path.join(ROOT, 'node_modules', font), path.join(OUT, 'fonts', path.basename(font)));
  }
  await writeFile(path.join(OUT, 'privacy.html'), privacyPage(content.site));
  await cp(path.join(ROOT, 'dist'), path.join(OUT, 'app'), { recursive: true });
  await writeFile(path.join(OUT, '.nojekyll'), '');
}

// Only when this file is the one being run (not when a test imports it).
if (require.main === module) {
  buildSite().then(
    () =>
      console.log(
        'dist-site/ is ready: the website at its root (with privacy.html and its fonts), the web preview under app/, the content under content/v1/.',
      ),
    (error: Error) => {
      console.error(error.message);
      process.exit(1);
    },
  );
}
