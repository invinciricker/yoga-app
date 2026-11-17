/**
 * Shrinks a photo so the content check accepts it.
 *
 *   npm run content:image -- content/lessons/evening-wind-down/cover.jpg
 *
 * The photo is changed IN PLACE: 2400 pixels at most on the long side, JPEG quality 85, and its
 * metadata removed (phone photos carry the GPS position). Several files can be given at once.
 * A PNG or WebP keeps its name but becomes a JPEG inside, which every tool here reads fine.
 */
import { shrinkPicture } from './pictures';

async function main(): Promise<boolean> {
  const files = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  if (files.length === 0) {
    console.error('Give the photo to shrink: npm run content:image -- content/lessons/<slug>/cover.jpg');
    return false;
  }
  let ok = true;
  for (const file of files) {
    try {
      const { before, after, w, h } = await shrinkPicture(file);
      const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
      console.log(`${file}: ${kb(before)} → ${kb(after)}, now ${w} × ${h} pixels, metadata removed.`);
    } catch {
      console.error(`${file}: this file cannot be read as a picture. Check the path, or export it again as JPEG.`);
      ok = false;
    }
  }
  return ok;
}

main().then((ok) => process.exit(ok ? 0 : 1));
