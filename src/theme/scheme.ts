/**
 * Which theme to draw: light or dark. A pure function, tested in scheme.test.ts.
 *
 *   the setting (You → Appearance)   "system" (at first), "light" or "dark"
 *   the phone's own choice           "light", "dark", or no answer (then dark)
 *   a forced scheme                  ?scheme=light in the address, preview app and web mirror only
 */
import type { Scheme } from './tokens';

export const appearances = ['system', 'light', 'dark'] as const;
export type Appearance = (typeof appearances)[number];

/** "light" or "dark"; anything else is not a scheme. */
export function asScheme(value: unknown): Scheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

/** A saved setting, read back. Anything unknown (or nothing saved) means "system". */
export function asAppearance(value: unknown): Appearance {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveScheme(setting: Appearance, phone: unknown, forced?: Scheme): Scheme {
  if (forced) return forced;
  if (setting !== 'system') return setting;
  return asScheme(phone) ?? 'dark';
}
