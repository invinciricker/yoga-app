/**
 * The sounds in assets/sounds/ are exactly what tools/sounds/ makes (docs/phases/phase-7.md,
 * section 7), and they have the shapes the brief asks for. Nobody can listen in a test, so the
 * shapes are measured: the pitch of each part (a Goertzel filter: how much of one frequency a
 * stretch of samples holds), the rise, the fade, the peak, and silence at both ends.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { makeSounds, PEAK, readWav, SAMPLE_RATE, soundNames } from './sounds';

const DIR = path.join(__dirname, '..', '..', 'assets', 'sounds');
const made = makeSounds();
const data = Object.fromEntries(soundNames.map((name) => [name, readWav(made[name])])) as Record<string, Float64Array>;

/** How strongly `hz` sounds in the samples from `from` to `to` seconds (an amplitude, 0 to about 1). */
function strength(samples: Float64Array, hz: number, from: number, to: number): number {
  const start = Math.round(from * SAMPLE_RATE);
  const end = Math.round(to * SAMPLE_RATE);
  const w = (2 * Math.PI * hz) / SAMPLE_RATE;
  let re = 0;
  let im = 0;
  for (let i = start; i < end; i++) {
    re += samples[i] * Math.cos(w * i);
    im += samples[i] * Math.sin(w * i);
  }
  return (2 * Math.hypot(re, im)) / (end - start);
}

/** The loudest sample between two moments, in seconds. */
function loudest(samples: Float64Array, from = 0, to = samples.length / SAMPLE_RATE): number {
  let most = 0;
  for (let i = Math.round(from * SAMPLE_RATE); i < Math.round(to * SAMPLE_RATE); i++) most = Math.max(most, Math.abs(samples[i]));
  return most;
}

describe('the sounds', () => {
  it.each(soundNames)('%s.wav is byte for byte what npm run sounds makes', async (name) => {
    const committed = await readFile(path.join(DIR, `${name}.wav`));
    if (!committed.equals(made[name])) throw new Error(`assets/sounds/${name}.wav differs: run "npm run sounds" and commit assets/sounds/.`);
  });

  it.each(soundNames)('%s.wav is a 16-bit mono WAV at 22,050 a second, silent at both ends', (name) => {
    const file = made[name];
    expect(file.toString('ascii', 0, 4)).toBe('RIFF');
    expect(file.readUInt16LE(22)).toBe(1); // mono
    expect(file.readUInt32LE(24)).toBe(SAMPLE_RATE);
    expect(file.readUInt16LE(34)).toBe(16);
    const samples = data[name];
    expect(samples[0]).toBe(0);
    expect(samples[samples.length - 1]).toBe(0);
  });

  it('the tones peak at a quarter of full volume and last about a second', () => {
    for (const name of ['in', 'out']) {
      expect(loudest(data[name])).toBeCloseTo(PEAK.tone, 3);
      expect(data[name].length / SAMPLE_RATE).toBeCloseTo(1.1, 2);
    }
  });

  it('In is 440 Hz with a faint octave; Out is a fourth lower, 330 Hz', () => {
    const at = (name: string, hz: number) => strength(data[name], hz, 0.1, 0.4);
    expect(at('in', 440)).toBeGreaterThan(5 * at('in', 330));
    expect(at('out', 330)).toBeGreaterThan(5 * at('out', 440));
    // The octave is there, and faint: about an eighth of the tone.
    expect(at('in', 880) / at('in', 440)).toBeGreaterThan(0.08);
    expect(at('in', 880) / at('in', 440)).toBeLessThan(0.16);
  });

  it('a tone rises in about 60 ms, then fades over about a second', () => {
    const tone = data.in;
    // Still quiet in its first 10 ms, at its loudest within the first tenth of a second.
    expect(loudest(tone, 0, 0.01)).toBeLessThan(0.1 * PEAK.tone);
    expect(loudest(tone, 0.05, 0.1)).toBeGreaterThan(0.8 * PEAK.tone);
    // Fading all the way: a third left after a further 0.3 s, almost nothing near the end.
    expect(loudest(tone, 0.35, 0.4)).toBeLessThan(0.45 * PEAK.tone);
    expect(loudest(tone, 0.95, 1.1)).toBeLessThan(0.06 * PEAK.tone);
  });

  it('the bell is a low 220 Hz tone with bell-like partials, the low one fading slowest, over about 4 seconds', () => {
    const bell = data.bell;
    expect(bell.length / SAMPLE_RATE).toBeCloseTo(4, 2);
    expect(loudest(bell)).toBeCloseTo(PEAK.bell, 3);
    const early = (hz: number) => strength(bell, hz, 0.02, 0.32);
    const late = (hz: number) => strength(bell, hz, 1.5, 1.8);
    // The low tone is the strongest; each partial is there, and each is quieter than the one below.
    const partials = [220, 220 * 2.7, 220 * 5.4, 220 * 8.9].map(early);
    for (let i = 1; i < partials.length; i++) {
      expect(partials[i]).toBeGreaterThan(0.005);
      expect(partials[i]).toBeLessThan(partials[i - 1]);
    }
    // Non-whole ratios: almost nothing at the whole multiples 2 and 3 times the low tone.
    expect(early(440)).toBeLessThan(0.1 * early(220));
    expect(early(660)).toBeLessThan(0.1 * early(220));
    // The low one fades slowest: after 1.5 s it keeps far more of itself than the highest one.
    expect(late(220) / early(220)).toBeGreaterThan(10 * (late(220 * 8.9) / early(220 * 8.9)));
    // Still sounding after three seconds, gone by the end.
    expect(loudest(bell, 3, 3.2)).toBeGreaterThan(0.02);
    expect(loudest(bell, 3.95, 4)).toBeLessThan(0.005);
  });
});
