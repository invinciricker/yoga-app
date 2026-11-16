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
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
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
  const candidates = [join(dist, path), join(dist, path + '.html'), join(dist, path, 'index.html')];
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
    const full = arg.endsWith(':full');
    const route = full ? arg.slice(0, -':full'.length) : arg;
    const name = route.replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'today';

    const page = await browser.newPage();
    await page.setViewport(PHONE);
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
