/**
 * The app's three sounds, made from plain arithmetic (docs/phases/phase-7.md, section 7): nothing
 * recorded, nothing downloaded, nothing licensed. Pure functions: the same code always gives the
 * same bytes, which is what sounds.test.ts checks against the files in assets/sounds/.
 *
 *   in.wav     a soft sine tone at 440 Hz, with a faint octave above for warmth: a 60 ms rise, then
 *              a fade of about one second. The start of every breath in (the higher tone).
 *   out.wav    the same, a fourth lower (330 Hz). The start of every breath out.
 *   bell.wav   a struck bowl: a low tone at 220 Hz, slowly beating, with three quieter partials at
 *              bell-like ratios (2.7, 5.4 and 8.9 times), each fading at its own speed, the low one
 *              slowest; about 4 seconds. The start and the end of a session (Phase 8 reuses it).
 *
 * Small 16-bit mono WAV files at 22,050 samples a second: the highest partial (about 1,960 Hz) is
 * far below the limit that rate can hold (11,025 Hz).
 */

export const SAMPLE_RATE = 22050;

/** How loud each sound is at its loudest, as a share of full scale (a quarter, for the tones). */
export const PEAK = { tone: 0.25, bell: 0.3 } as const;

/** One part of a sound: a sine at `ratio` times the base pitch, `level` loud, fading with `fade` seconds. */
type Partial = { ratio: number; level: number; fade: number };

type Recipe = {
  /** The base pitch, in hertz. */
  hz: number;
  partials: Partial[];
  /** The rise at the start, in seconds (a half cosine, so it never clicks). */
  rise: number;
  /** The whole length, in seconds. Every partial is brought to exactly zero at the end. */
  length: number;
  peak: number;
};

/** A tone of the pacer: the base pitch and a faint octave, the same fade for both. */
const tone = (hz: number): Recipe => ({
  hz,
  partials: [
    { ratio: 1, level: 1, fade: 0.3 },
    { ratio: 2, level: 0.12, fade: 0.3 },
  ],
  rise: 0.06,
  length: 1.1,
  peak: PEAK.tone,
});

export const recipes = {
  in: tone(440),
  // A fourth lower: 440 × 3/4.
  out: tone(330),
  bell: {
    hz: 220,
    partials: [
      // The low tone, and a twin a hair apart, so it beats slowly like a real bowl (about once in 1.5 s).
      { ratio: 1, level: 1, fade: 1.6 },
      { ratio: 1.003, level: 0.35, fade: 1.6 },
      { ratio: 2.7, level: 0.45, fade: 0.9 },
      { ratio: 5.4, level: 0.22, fade: 0.5 },
      { ratio: 8.9, level: 0.12, fade: 0.28 },
    ],
    rise: 0.004,
    length: 4,
    peak: PEAK.bell,
  },
} satisfies Record<string, Recipe>;

export type SoundName = keyof typeof recipes;
export const soundNames = Object.keys(recipes) as SoundName[];

/**
 * The samples of a sound, from -1 to 1. Each partial fades exponentially (`fade` is the time it
 * takes to fall to about a third), multiplied by a gentle half-cosine over the last 15 % so that
 * every sound ends at exactly zero. The whole is then scaled so that its loudest sample is `peak`.
 */
export function samples(recipe: Recipe): Float64Array {
  const count = Math.round(recipe.length * SAMPLE_RATE);
  const out = new Float64Array(count);
  const tailStart = 0.85 * count;
  let loudest = 0;
  for (let i = 0; i < count; i++) {
    const t = i / SAMPLE_RATE;
    const rise = t < recipe.rise ? 0.5 * (1 - Math.cos((Math.PI * t) / recipe.rise)) : 1;
    const tail = i < tailStart ? 1 : 0.5 * (1 + Math.cos((Math.PI * (i - tailStart)) / (count - 1 - tailStart)));
    let value = 0;
    for (const p of recipe.partials) {
      value += p.level * Math.exp(-t / p.fade) * Math.sin(2 * Math.PI * recipe.hz * p.ratio * t);
    }
    out[i] = value * rise * tail;
    loudest = Math.max(loudest, Math.abs(out[i]));
  }
  const scale = loudest === 0 ? 0 : recipe.peak / loudest;
  for (let i = 0; i < count; i++) out[i] *= scale;
  return out;
}

/** A 16-bit mono WAV file holding the samples. */
export function wav(data: Float64Array): Buffer {
  const bytes = data.length * 2;
  const file = Buffer.alloc(44 + bytes);
  file.write('RIFF', 0, 'ascii');
  file.writeUInt32LE(36 + bytes, 4);
  file.write('WAVE', 8, 'ascii');
  file.write('fmt ', 12, 'ascii');
  file.writeUInt32LE(16, 16); // the size of this part
  file.writeUInt16LE(1, 20); // plain PCM
  file.writeUInt16LE(1, 22); // mono
  file.writeUInt32LE(SAMPLE_RATE, 24);
  file.writeUInt32LE(SAMPLE_RATE * 2, 28); // bytes a second
  file.writeUInt16LE(2, 32); // bytes a sample
  file.writeUInt16LE(16, 34); // bits a sample
  file.write('data', 36, 'ascii');
  file.writeUInt32LE(bytes, 40);
  for (let i = 0; i < data.length; i++) {
    const value = Math.max(-32768, Math.min(32767, Math.round(data[i] * 32767)));
    file.writeInt16LE(value, 44 + i * 2);
  }
  return file;
}

/** Every sound, as the bytes of its file. */
export function makeSounds(): Record<SoundName, Buffer> {
  return Object.fromEntries(soundNames.map((name) => [name, wav(samples(recipes[name]))])) as Record<SoundName, Buffer>;
}

/** The 16-bit samples of a WAV file made by `wav`, back as numbers from -1 to 1 (for the tests). */
export function readWav(file: Buffer): Float64Array {
  const count = file.readUInt32LE(40) / 2;
  const out = new Float64Array(count);
  for (let i = 0; i < count; i++) out[i] = file.readInt16LE(44 + i * 2) / 32767;
  return out;
}
