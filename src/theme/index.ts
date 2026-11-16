/**
 * The theme: everything from the protected tokens file, plus small helpers.
 * Import from here ("@/theme"), not from tokens.ts directly.
 *
 * Nothing in this file imports React Native, so Node tools can use it too.
 */
import { color } from './tokens';

export * from './tokens';
export { auraForSlug, fnv1a32 } from './auraForSlug';

/**
 * The colours a piece of text or an icon may take, by their token path.
 * The Text part takes one of these names: <Text color="text.secondary">.
 */
export const inkColors = {
  'text.primary': color.text.primary,
  'text.secondary': color.text.secondary,
  'text.muted': color.text.muted,
  'text.onAccent': color.text.onAccent,
  'accent.gold': color.accent.gold,
  'accent.goldBright': color.accent.goldBright,
  'support.ember': color.support.ember,
  'support.sage': color.support.sage,
  'support.danger': color.support.danger,
} as const;

export type InkColor = keyof typeof inkColors;

/**
 * Splits a token such as "rgba(8, 13, 11, 0.82)" into a solid colour and an opacity.
 * SVG gradients want the two separately.
 */
export function splitAlpha(rgba: string): { color: string; opacity: number } {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(rgba);
  if (!m) return { color: rgba, opacity: 1 };
  return { color: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, opacity: Number(m[4]) };
}
