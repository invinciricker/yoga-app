/**
 * Pictures: checking the photos people add, and preparing them for the app.
 *
 *   checkPicture    is the photo there, under 1 MB, and no larger than 2400 pixels?
 *   preparePicture  writes the WebP sizes the app downloads, WITHOUT the photo's metadata
 *                   (phone photos carry the GPS position: it must never be published),
 *                   and computes the tiny blurred preview (blurhash).
 *   shrinkPicture   makes a photo that is too big acceptable (npm run content:image -- <file>).
 */
import { encode } from 'blurhash';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import type { Image } from '../../shared/content-schema';
import type { Problem } from './problems';

export const MAX_BYTES = 1024 * 1024; // 1 MB
export const MAX_SIDE = 2400; // pixels, on the long side
export const WIDTHS = [480, 960, 1440]; // the sizes the app can choose from
const WEBP_QUALITY = 78;
const SHRINK_QUALITY = 85;
const BLURHASH = { x: 4, y: 3, sample: 32 }; // 4 × 3 components, computed on a 32-pixel copy

/** The size of a picture as it is seen: a phone photo may be stored on its side. */
async function seenSize(input: Buffer | string): Promise<{ w: number; h: number }> {
  const meta = await sharp(input).metadata();
  const sideways = (meta.orientation ?? 1) >= 5;
  return sideways ? { w: meta.height, h: meta.width } : { w: meta.width, h: meta.height };
}

/** Step 1 of the specification, for one picture. `shown` is the path printed in messages. */
export async function checkPicture(file: string, shown: string): Promise<Problem[]> {
  const fix = `ask Claude Code to shrink it (npm run content:image -- ${shown})`;
  let bytes: number;
  try {
    bytes = (await stat(file)).size;
  } catch {
    return [{ file: shown, message: 'This picture is named in the text but the file is not in the folder: add it, or remove its line.' }];
  }
  const problems: Problem[] = [];
  if (bytes > MAX_BYTES) {
    problems.push({
      file: shown,
      message: `This picture weighs ${(bytes / MAX_BYTES).toFixed(1)} MB and the limit is 1 MB: ${fix}.`,
    });
  }
  try {
    const { w, h } = await seenSize(file);
    if (Math.max(w, h) > MAX_SIDE) {
      problems.push({
        file: shown,
        message: `This picture is ${w} × ${h} pixels and the limit is ${MAX_SIDE} on the long side: ${fix}.`,
      });
    }
  } catch {
    problems.push({ file: shown, message: 'This file cannot be read as a picture: export it again as JPEG, PNG or WebP.' });
  }
  return problems;
}

/**
 * Writes the WebP sizes of one picture into `mediaDir` and returns what content.json says about it.
 * The file names start with a hash of the original, so a changed photo gets a new address
 * and an unchanged one keeps its address (and stays in the phone's cache).
 */
export async function preparePicture(file: string, alt: string, mediaDir: string): Promise<Image> {
  const original = await readFile(file);
  const hash = createHash('sha256').update(original).digest('hex').slice(0, 12);
  const { w, h } = await seenSize(original);

  // Never make a picture bigger than it is. A very small one is kept at its own width.
  const wanted = WIDTHS.filter((width) => width <= w);
  const widths = wanted.length > 0 ? wanted : [w];

  await mkdir(mediaDir, { recursive: true });
  const variants: Image['variants'] = [];
  for (const width of widths) {
    const name = `${hash}-${width}.webp`;
    // .rotate() turns the picture the right way up; sharp then drops ALL metadata (GPS included)
    // because we never ask it to keep any.
    const webp = await sharp(original).rotate().resize({ width }).webp({ quality: WEBP_QUALITY }).toBuffer();
    await writeFile(path.join(mediaDir, name), webp);
    variants.push({ w: width, path: `media/${name}` });
  }

  const small = await sharp(original)
    .rotate()
    .resize(BLURHASH.sample, BLURHASH.sample, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(new Uint8ClampedArray(small.data), small.info.width, small.info.height, BLURHASH.x, BLURHASH.y);

  return { variants, w, h, blurhash, alt };
}

/** Shrinks a photo in place: 2400 on the long side at most, JPEG quality 85, metadata removed. */
export async function shrinkPicture(file: string): Promise<{ before: number; after: number; w: number; h: number }> {
  const original = await readFile(file);
  const out = await sharp(original)
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: SHRINK_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  await writeFile(file, out.data);
  return { before: original.length, after: out.data.length, w: out.info.width, h: out.info.height };
}
