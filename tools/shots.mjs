// Takes pictures of screens, so that they can be looked at without a phone.
//
//   npm run build:web
//   npm run shots -- <phase> [--both] <route> [<route>…]
//   example: npm run shots -- 2 --both / /:today /practice /gallery:full
//
// It serves the web export (dist/) on this machine, opens each route in Chrome at 390 × 844
// (a phone), waits for the fonts, and saves docs/screens/phase-<n>/<route>.jpg.
// The route "/" is saved as home.jpg. Each route opens in a fresh browser profile (nothing saved
// from the one before), so Home always opens on its billboard.
// Options after a route:
//   :full     the whole scrolling page (the window keeps its phone size inside the page)
//   :today    Home only: the whole of Today, under the billboard        → home-today.jpg
//   :light    the light theme (?scheme=light in the address)            → <name>-light.jpg
//   :dark     the dark theme (?scheme=dark)                             → <name>-dark.jpg
//   :next1, :next2   press the gold "Next" button once or twice first (the welcome's screens 2, 3)
//                                                                     → <name>-2.jpg, <name>-3.jpg
//   :first    a very first launch: the welcome is not marked as seen   → <name>-first.jpg
//   :big      a small phone (360 × 640) with the text at 1.3. The web cannot grow only the text, so
//             everything is drawn 1.3 times larger (a 277 × 492 layout): harder than the phone.
//                                                                     → <name>-big.jpg
//   :demo     sample progress (?demo=streak): four days of candles, a series begun, a lesson
//             saved, an answer, five pages of a journal, two free pages. In memory only.
//                                                                     → <name>-demo.jpg
//   :tap=<name>        press the button with that name first ("8 out of 10"), as a person would
//   :type=<n>=<words>  type the words into the n-th field of the page (0 is the first)
//   :as=<name>         the picture's name (an address with ?a=b makes a long one)
//   :at=<HH>h<MM>      the phone's clock shows that time of day, today (Phase 7: "For this morning")
//   :before=<route>    open that page first, in the same browser profile, so what it saves is there
//                      (Phase 7: a closing screen first, so the day shows a breath done)
//   :wrote             a page of the journal counts as written today in the record of the day (only
//                      the record: no words), so a closing screen offers no "Write a line about it?"
// An address may carry its own query: /write?journal=gratitude&page=d13.
// --both takes every route twice, dark and light.
// Every picture except ":first" starts with the welcome already seen (as on a phone after the
// first launch), so "/" shows Home.
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
const [phase, ...rest] = process.argv.slice(2);
const both = rest.includes('--both');
const routes = rest
  .filter((arg) => arg !== '--both')
  .flatMap((arg) => (both ? [`${arg}:dark`, `${arg}:light`] : [arg]));

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
  '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.wav': 'audio/wav',
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
// 360 × 640 with everything 1.3 times larger: a 277 × 492 layout, drawn at the phone's pixels.
const BIG_TEXT = 1.3;
const BIG = { width: Math.round(360 / BIG_TEXT), height: Math.round(640 / BIG_TEXT), deviceScaleFactor: 2 * BIG_TEXT };
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--headless=new'],
});

try {
  for (const arg of routes) {
    const [route, ...options] = arg.split(':');
    const taps = options.filter((o) => o.startsWith('tap=')).map((o) => o.slice(4));
    const typing = options
      .filter((o) => o.startsWith('type='))
      .map((o) => {
        const [, n, ...words] = o.split('=');
        return { n: Number(n), words: words.join('=') };
      });
    const as = options.find((o) => o.startsWith('as='))?.slice(3);
    const today = options.includes('today');
    const full = options.includes('full') || today;
    const offline = options.includes('offline');
    const scheme = options.find((o) => o === 'light' || o === 'dark');
    const presses = Number(options.find((o) => /^next\d$/.test(o))?.slice(4) ?? 0);
    const first = options.includes('first');
    const big = options.includes('big');
    const demo = options.includes('demo');
    const clock = options.find((o) => /^at=\d\dh\d\d$/.test(o))?.slice(3);
    const before = options.find((o) => o.startsWith('before='))?.slice(7);
    const wrote = options.includes('wrote');
    const name =
      (as ?? (route.replace(/^\/+|\/+$/g, '').replace(/[/?&=]+/g, '-') || 'home')) +
      (today ? '-today' : '') +
      (presses ? `-${presses + 1}` : '') +
      (first ? '-first' : '') +
      (big ? '-big' : '') +
      (demo ? '-demo' : '') +
      (offline ? '-offline' : '') +
      (scheme ? `-${scheme}` : '');

    // A fresh profile for each picture: no saved theme, no "billboard already seen today".
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const viewport = big ? BIG : PHONE;
    await page.setViewport(viewport);
    if (clock) {
      // The time of day, today: every Date of the page is moved by the same amount.
      const [hours, minutes] = clock.split('h').map(Number);
      await page.evaluateOnNewDocument((h, m) => {
        const Real = Date;
        const wanted = new Real();
        wanted.setHours(h, m, 0, 0);
        const shift = wanted.getTime() - Real.now();
        class Shifted extends Real {
          constructor(...args) {
            if (args.length === 0) super(Real.now() + shift);
            else super(...args);
          }
          static now() {
            return Real.now() + shift;
          }
        }
        globalThis.Date = Shifted;
      }, hours, minutes);
    }
    if (wrote) {
      await page.evaluateOnNewDocument(() => {
        if (localStorage.getItem('ywm:days:v1') !== null) return;
        const now = new Date();
        const two = (n) => String(n).padStart(2, '0');
        const day = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
        localStorage.setItem('ywm:days:v1', JSON.stringify([{ day, kind: 'write', ref: 'shots-page', minutes: 2, at: now.toISOString() }]));
      });
    }
    if (!first) {
      // The welcome was seen (the app keeps this under the same key in the browser's storage).
      await page.evaluateOnNewDocument(() => localStorage.setItem('ywm:welcome:v1', 'true'));
    }
    if (full) {
      // The app reads the window's size once (react-native-web's Dimensions) and follows every
      // "resize". For a whole-page picture the window is made taller, but parts sized to the
      // window (the billboard) must keep their phone size: the app is not told about the resize.
      await page.evaluateOnNewDocument(() => {
        const add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, ...more) {
          if (type === 'resize' && (this === window || this === window.visualViewport)) return;
          return add.call(this, type, ...more);
        };
      });
    }
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
    const query = new URLSearchParams();
    if (scheme) query.set('scheme', scheme);
    if (demo) query.set('demo', 'streak');
    const joiner = route.includes('?') ? '&' : '?';
    if (before) {
      await page.goto(base + before, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1200)); // let it save what it saves
    }
    await page.goto(base + route + (query.size > 0 ? `${joiner}${query}` : ''), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1200)); // let the arriving animation finish
    for (let i = 0; i < presses; i++) {
      await page.click('[aria-label="Next"]');
      await new Promise((r) => setTimeout(r, 900)); // let the slide finish
    }
    for (const label of taps) {
      await page.click(`[aria-label="${label}"]`);
      await new Promise((r) => setTimeout(r, 400));
    }
    for (const { n, words } of typing) {
      const fields = await page.$$('textarea, input');
      await fields[n].type(words);
      await new Promise((r) => setTimeout(r, 400));
    }
    if (taps.length > 0 || typing.length > 0) {
      // Back to the top, as the page first looked, and no field left focused.
      await page.evaluate(() => {
        document.activeElement?.blur();
        for (const el of document.querySelectorAll('*')) if (el.scrollTop > 0) el.scrollTop = 0;
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    if (full) {
      // The app scrolls inside its own box, not the page. Make the window as tall as the
      // tallest scrolling box, so that everything is in the picture.
      const tallest = await page.evaluate(() =>
        Math.max(...[...document.querySelectorAll('*')].map((el) => el.scrollHeight)),
      );
      await page.setViewport({ ...viewport, height: Math.max(viewport.height, tallest) });
      await new Promise((r) => setTimeout(r, 600));
    }

    const file = join(outDir, `${name}.jpg`);
    // ":today": Today starts where the billboard (one phone window) ends.
    const clip = today ? await page.evaluate((top) => ({ x: 0, y: top, width: innerWidth, height: innerHeight - top }), viewport.height) : undefined;
    await page.screenshot({ path: file, type: 'jpeg', quality: 85, clip });
    await context.close();
    console.log(`saved docs/screens/phase-${phase}/${name}.jpg`);
  }
} finally {
  await browser.close();
  server.close();
}
