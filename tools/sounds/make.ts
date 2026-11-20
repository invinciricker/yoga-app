/**
 * Makes the app's sounds into assets/sounds/ (docs/phases/phase-7.md, section 7).
 *
 *   npm run sounds
 *
 * The recipes are in sounds.ts. Never edit the WAV files by hand: change a recipe, run this, and
 * commit both. The test sounds.test.ts fails while the files differ from what this makes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { makeSounds, PEAK, readWav, SAMPLE_RATE } from './sounds';

export const SOUNDS_DIR = path.join('assets', 'sounds');

async function main(): Promise<void> {
  await mkdir(SOUNDS_DIR, { recursive: true });
  for (const [name, bytes] of Object.entries(makeSounds())) {
    const file = path.join(SOUNDS_DIR, `${name}.wav`);
    await writeFile(file, bytes);
    const data = readWav(bytes);
    const peak = data.reduce((most, v) => Math.max(most, Math.abs(v)), 0);
    const dbfs = (20 * Math.log10(peak)).toFixed(1);
    console.log(`${file}: ${(data.length / SAMPLE_RATE).toFixed(2)} s, peak ${peak.toFixed(3)} (${dbfs} dBFS), ${Math.round(bytes.length / 1024)} KB`);
  }
  console.log(`Peaks asked for: tones ${PEAK.tone}, bell ${PEAK.bell} of full scale.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
