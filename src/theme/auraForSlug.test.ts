import { auraForSlug, fnv1a32 } from './auraForSlug';
// Version 2 has ten auras; the pick by slug uses only the first five (autoAuraNames).
import { autoAuraNames as auraNames } from './tokens';

describe('auraForSlug', () => {
  it('uses the standard FNV-1a hash (known values)', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);
  });

  it('gives the same aura for the same slug, every time', () => {
    for (const slug of ['evening-wind-down', 'slow-morning-flow', 'breath-before-sleep']) {
      expect(auraForSlug(slug)).toBe(auraForSlug(slug));
      expect(auraNames).toContain(auraForSlug(slug));
    }
  });

  it('spreads many slugs over all five auras, none of them rare', () => {
    const counts = new Map<string, number>();
    const total = 500;
    for (let i = 0; i < total; i++) {
      const name = auraForSlug(`lesson-number-${i}`);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    expect(counts.size).toBe(auraNames.length);
    for (const n of counts.values()) expect(n).toBeGreaterThan(total / auraNames.length / 2);
  });

  it('keeps the covers of version 1: the same picks as before the five new auras', () => {
    expect(auraForSlug('evening-wind-down')).toBe('forest');
    expect(auraForSlug('slow-morning-flow')).toBe('moss');
    expect(auraForSlug('seven-evenings-of-rest')).toBe('dusk');
    expect(auraForSlug('why-we-slow-down')).toBe('candle');
  });
});
