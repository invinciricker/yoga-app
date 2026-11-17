/**
 * The theme: everything from the protected tokens file, plus small helpers.
 * Import from here ("@/theme"), not from tokens.ts directly.
 *
 * Screens and parts never import a colour: they read it with useTheme() (src/theme/ThemeProvider.tsx),
 * because the colours depend on the theme (light or dark). src/theme/noColorImport.test.ts checks it.
 *
 * Nothing in this file imports React Native, so Node tools can use it too.
 */
import { onCover, type Palette } from './tokens';

export * from './tokens';
export { auraForSlug, fnv1a32 } from './auraForSlug';
export { appearances, asAppearance, asScheme, resolveScheme, type Appearance } from './scheme';

/** The five areas of the app, each with its own colour (docs/V2.md, "The map"). */
export const areas = ['home', 'move', 'breathe', 'sit', 'write'] as const;
export type Area = (typeof areas)[number];

/**
 * The colours a piece of text or an icon may take, by their token path.
 * The Text part takes one of these names: <Text color="text.secondary">.
 *   onCover.*  words and icons drawn over a cover or an aura (the same in both themes)
 *   area.*     the colour of an area: overlines and small icons inside it
 */
export const inkNames = [
  'text.primary',
  'text.secondary',
  'text.muted',
  'text.onAccent',
  'accent.gold',
  'accent.goldBright',
  'support.ember',
  'support.sage',
  'support.danger',
  'onCover.primary',
  'onCover.secondary',
  'onCover.accent',
  'area.home',
  'area.move',
  'area.breathe',
  'area.sit',
  'area.write',
] as const;

export type InkColor = (typeof inkNames)[number];

// One map per palette, made once: a palette never changes while the app runs.
const inkCache = new WeakMap<Palette, Record<InkColor, string>>();

/** The value of each ink name in a palette: inkColors(color)['text.secondary']. */
export function inkColors(color: Palette): Record<InkColor, string> {
  const known = inkCache.get(color);
  if (known) return known;
  const map: Record<InkColor, string> = {
    'text.primary': color.text.primary,
    'text.secondary': color.text.secondary,
    'text.muted': color.text.muted,
    'text.onAccent': color.text.onAccent,
    'accent.gold': color.accent.gold,
    'accent.goldBright': color.accent.goldBright,
    'support.ember': color.support.ember,
    'support.sage': color.support.sage,
    'support.danger': color.support.danger,
    'onCover.primary': onCover.primary,
    'onCover.secondary': onCover.secondary,
    'onCover.accent': onCover.accent,
    'area.home': color.area.home,
    'area.move': color.area.move,
    'area.breathe': color.area.breathe,
    'area.sit': color.area.sit,
    'area.write': color.area.write,
  };
  inkCache.set(color, map);
  return map;
}

/**
 * Splits a token such as "rgba(8, 13, 11, 0.82)" into a solid colour and an opacity.
 * SVG gradients want the two separately.
 */
export function splitAlpha(rgba: string): { color: string; opacity: number } {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(rgba);
  if (!m) return { color: rgba, opacity: 1 };
  return { color: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, opacity: Number(m[4]) };
}

/**
 * The same colour at a lower strength, for the soft disc behind an area's icon ("area at 16%").
 * Takes "#RRGGBB" and gives "rgba(r, g, b, alpha)".
 */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
