/**
 * Every colour that carries words keeps a contrast of 4.5 or more (WCAG AA) on the grounds it sits on,
 * in both palettes. All pairs passed on 17 Nov 2026: this test is here so that nobody dims a colour later.
 */
import { palette, type Palette, type Scheme } from './tokens';

/** Relative luminance of "#RRGGBB" (WCAG 2). */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const MIN = 4.5;

for (const scheme of Object.keys(palette) as Scheme[]) {
  const p: Palette = palette[scheme];
  const grounds = Object.entries(p.bg);
  // Words: every text colour except onAccent (which only sits on gold), gold as a word, support, area.
  const inks: [string, string][] = [
    ...Object.entries(p.text).filter(([k]) => k !== 'onAccent').map(([k, v]): [string, string] => [`text.${k}`, v]),
    ['accent.gold', p.accent.gold],
    ...Object.entries(p.support).map(([k, v]): [string, string] => [`support.${k}`, v]),
    ...Object.entries(p.area).map(([k, v]): [string, string] => [`area.${k}`, v]),
  ];

  describe(`the ${scheme} palette`, () => {
    it.each(inks)('%s can be read on every bg', (_name, ink) => {
      for (const [, ground] of grounds) expect(contrast(ink, ground)).toBeGreaterThanOrEqual(MIN);
    });

    it.each(Object.keys(p.area) as (keyof Palette['area'])[])('text and area.%s can be read on areaSoft.%s', (area) => {
      const ground = p.areaSoft[area];
      expect(contrast(p.text.primary, ground)).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.text.secondary, ground)).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.area[area], ground)).toBeGreaterThanOrEqual(MIN);
    });

    it('text.onAccent can be read on the gold fill', () => {
      expect(contrast(p.text.onAccent, p.accent.fill)).toBeGreaterThanOrEqual(MIN);
    });
  });
}

describe('the contrast formula', () => {
  it('gives the known values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});
