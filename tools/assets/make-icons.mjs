// Makes the temporary icon and the splash image: a small gold disc with a soft halo.
// Run once (the pictures are committed):  node tools/assets/make-icons.mjs
// The real icon comes in Phase 6.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const BG = '#0C1311'; // color.bg.base
const GOLD = '#F3D592'; // color.accent.goldBright
const OUT = new URL('../../assets/images/', import.meta.url);
const SIZE = 1024;

/** One square SVG: the disc in the centre, a halo around it, an optional background. */
function disc({ radius, background }) {
  const c = SIZE / 2;
  const halo = radius * 3.2;
  const edge = (radius / halo).toFixed(3); // where the disc ends inside the halo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="halo">
      <stop offset="${edge}" stop-color="${GOLD}" stop-opacity="0.38"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${background ? `<rect width="100%" height="100%" fill="${BG}"/>` : ''}
  <circle cx="${c}" cy="${c}" r="${halo}" fill="url(#halo)"/>
  <circle cx="${c}" cy="${c}" r="${radius}" fill="${GOLD}"/>
</svg>`;
}

const files = [
  // The app icon (also used by iPhone later): disc on the dark ground.
  { name: 'icon.png', svg: disc({ radius: 120, background: true }), size: SIZE },
  // Android adaptive icon: transparent, kept inside the middle two thirds (Android crops the rest).
  { name: 'adaptive-icon-foreground.png', svg: disc({ radius: 90, background: false }), size: SIZE },
  // Splash: transparent, the background colour comes from app.config.ts.
  { name: 'splash-icon.png', svg: disc({ radius: 70, background: false }), size: SIZE },
  // Browser tab icon for the web preview.
  { name: 'favicon.png', svg: disc({ radius: 150, background: true }), size: 96 },
];

await mkdir(OUT, { recursive: true });
for (const f of files) {
  await sharp(Buffer.from(f.svg)).resize(f.size, f.size).png().toFile(new URL(f.name, OUT).pathname);
  console.log('made assets/images/' + f.name);
}
