// Takes pictures of screens, so that they can be looked at without a phone.
//
//   npm run build:web
//   npm run shots -- <phase> <route> [<route>…]
//   example: npm run shots -- 0 / /practice /journal /studio /gallery:full
//
// It serves the web export (dist/) on this machine, opens each route in Chrome at 390 × 844
// (a phone), waits for the fonts, and saves docs/screens/phase-<n>/<route>.jpg.
// The route "/" is saved as today.jpg. Add ":full" to a route to capture the whole scrolling page.
// Chrome is found through the environment variable CHROME_PATH.
//
// The content: the app downloads it from GitHub Pages. Here that address is answered from this
// machine instead (dist-site/content/v1/, made by "npm run content:build"), so the pictures show
// the content of this branch, not what is online. Add ":offline" to a route to cut that download
// and see what the app shows without the network (its saved or bundled copy):
//   npm run shots -- 1 /practice:offline      → practice-offline.jpg
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
// The same address as CONTENT_BASE in src/config.ts.
const CONTENT_BASE = 'https://invinciricker.github.io/yoga-app/content/v1/';
const contentDir = join(root, 'dist-site', 'content', 'v1');
const [phase, ...routes] = process.argv.slice(2);

if (!phase || routes.length === 0) {
  console.error('Usage: npm run shots -- <phase> <route> [<route>…]');
  process.exit(1);
}
if (!process.env.CHROME_PATH) {
  console.error('Set CHROME_PATH to the Chrome program (for example /usr/bin/google-chrome).');
  process.exit(1);
}

const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};
const isFile = (path) => stat(path).then((s) => s.isFile(), () => false);

// A very small web server for the exported files: /practice → dist/practice.html, and so on.
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  // An address with a slug the export does not know (/lesson/gone) is answered by the general
  // page of its kind (lesson/[slug].html), which then shows "This lesson is no longer here".
  const general = join(dist, path, '..', '[slug].html');
  const candidates = [join(dist, path), join(dist, path + '.html'), join(dist, path, 'index.html'), general];
  for (const file of candidates) {
    if (file.startsWith(dist) && (await isFile(file))) {
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
      return;
    }
  }
  res.writeHead(404).end('Not found');
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const base = `http://127.0.0.1:${server.address().port}`;

const outDir = join(root, 'docs', 'screens', `phase-${phase}`);
await mkdir(outDir, { recursive: true });

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2 };
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--headless=new'],
});

try {
  for (const arg of routes) {
    const [route, ...options] = arg.split(':');
    const full = options.includes('full');
    const offline = options.includes('offline');
    const name = (route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'today') + (offline ? '-offline' : '');

    const page = await browser.newPage();
    await page.setViewport(PHONE);
    // Answer the content address from this machine (or not at all, for ":offline").
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      const url = request.url();
      if (!url.startsWith(CONTENT_BASE)) return request.continue();
      const file = normalize(join(contentDir, decodeURIComponent(new URL(url).pathname.split('/content/v1/')[1] ?? '')));
      if (offline || !file.startsWith(contentDir) || !(await isFile(file))) return request.abort();
      request.respond({
        status: 200,
        contentType: types[extname(file)] ?? 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
        body: await readFile(file),
      });
    });
    await page.goto(base + route, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1200)); // let the arriving animation finish

    if (full) {
      // The app scrolls inside its own box, not the page. Make the window as tall as the
      // tallest scrolling box, so that everything is in the picture.
      const tallest = await page.evaluate(() =>
        Math.max(...[...document.querySelectorAll('*')].map((el) => el.scrollHeight)),
      );
      await page.setViewport({ ...PHONE, height: Math.max(PHONE.height, tallest) });
      await new Promise((r) => setTimeout(r, 600));
    }

    const file = join(outDir, `${name}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 85 });
    await page.close();
    console.log(`saved docs/screens/phase-${phase}/${name}.jpg`);
  }
} finally {
  await browser.close();
  server.close();
}
