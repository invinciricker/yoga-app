// Remakes the two small pictures used by the tests of the content build.
//   node tools/content/__fixtures__/make-pictures.mjs
// cover.jpg is 1600 × 900 and carries a GPS position on purpose (like a phone photo):
// a test proves that the build removes it. window.png is small (300 × 200), to prove that a
// picture is never made bigger than it is.
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = fileURLToPath(new URL('./valid/', import.meta.url));

/** A soft two-colour picture, so the files stay tiny. */
function gradient(w, h, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg));
}

await gradient(1600, 900, '#171C33', '#DE8A63')
  .withExif({
    IFD0: { Make: 'Test phone' },
    IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '48/1 51/1 24/1', GPSLongitudeRef: 'E', GPSLongitude: '2/1 21/1 3/1' },
  })
  .jpeg({ quality: 80 })
  .toFile(here + 'lessons/first-rest/cover.jpg');

await gradient(300, 200, '#0F1E18', '#E3B45E').png().toFile(here + 'journal/a-note/window.png');
console.log('Pictures remade.');
