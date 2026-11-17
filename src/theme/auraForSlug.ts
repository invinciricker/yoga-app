/**
 * Picks one of the first five auras for a slug, always the same one for the same slug.
 *
 * Used when content names an aura this version of the app does not know, and by the content build
 * in tools/ when a lesson, a series or a note has no `aura`. It picks only from `autoAuraNames`
 * (dusk, forest, candle, ember, moss): the five auras added in version 2 are chosen on purpose,
 * never by chance, so existing covers keep their aura. This file must stay free of React Native
 * imports so that Node tools can import it.
 */
import { autoAuraNames, type AuraName } from './tokens';

/**
 * FNV-1a, 32-bit: a tiny, well-known string hash.
 * Start from a fixed number, then for each character: XOR it in, multiply by a fixed prime.
 * Returns an unsigned 32-bit integer.
 */
export function fnv1a32(text: string): number {
  let hash = 0x811c9dc5; // the FNV offset basis
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // the FNV prime, kept inside 32 bits
  }
  return hash >>> 0;
}

/** A stable pick from the first five auras: hash of the slug, modulo five. */
export function auraForSlug(slug: string): AuraName {
  return autoAuraNames[fnv1a32(slug) % autoAuraNames.length];
}
