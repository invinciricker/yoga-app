/**
 * The theme at run time: light or dark, and the colours that go with it.
 *
 *   <ThemeProvider>        in app/_layout.tsx, around everything. Follows the setting in You →
 *                          Appearance ("system" follows the phone; no answer from the phone means dark).
 *   <ThemeScope scheme="dark">   forces a scheme for what is inside: the billboard, every player,
 *                          every closing screen ("the room dims", docs/V2.md).
 *   useTheme()             { scheme, color, onCover } for the place where it is called.
 *   makeStyles(fn)         the one way to write styles that hold colours (see below).
 *
 * In the preview app and on the web mirror only, ?scheme=light or ?scheme=dark in the address
 * forces the theme without saving it (the screenshot tool uses it).
 */
import { useGlobalSearchParams } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { usePrefs } from '@/lib/prefs';
import { isPreview } from '@/lib/variant';

import { asScheme, resolveScheme } from './scheme';
import { onCover, palette, type Palette, type Scheme } from './tokens';

export type Theme = {
  scheme: Scheme;
  /** The palette of this scheme: color.bg.base, color.text.primary… */
  color: Palette;
  /** Words and icons over a cover or an aura: the same in both themes. */
  onCover: typeof onCover;
};

// Made once: the same object each time, so nothing re-renders for nothing.
const themes: Record<Scheme, Theme> = {
  dark: { scheme: 'dark', color: palette.dark, onCover },
  light: { scheme: 'light', color: palette.light, onCover },
};

const ThemeContext = createContext<Theme>(themes.dark);

/** Only the preview app and the web mirror obey ?scheme= in the address. */
const canForce = isPreview || Platform.OS === 'web';

/** On the web, the address can be read before the first drawing (no flash of the other theme). */
function schemeInAddress(): Scheme | undefined {
  if (Platform.OS !== 'web' || typeof location === 'undefined') return undefined;
  return asScheme(new URLSearchParams(location.search).get('scheme'));
}

/**
 * The scheme forced by the address, if any. Once seen it stays for the whole visit (moving to
 * another page drops the "?scheme=" from the address), and it is never saved.
 */
function useForcedScheme(): Scheme | undefined {
  const params = useGlobalSearchParams<{ scheme?: string }>();
  const [forced, setForced] = useState<Scheme | undefined>(() => (canForce ? schemeInAddress() : undefined));
  const asked = canForce ? asScheme(params.scheme) : undefined;
  if (asked !== undefined && asked !== forced) setForced(asked);
  return forced;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const setting = usePrefs((s) => s.appearance);
  const phone = useColorScheme();
  const forced = useForcedScheme();
  const theme = themes[resolveScheme(setting, phone, forced)];

  // The window behind every screen follows the theme, so no flash of the other colour shows
  // between two screens.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.color.bg.base).catch(() => {});
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Forces a scheme for everything inside it, whatever the app's theme. */
export function ThemeScope({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  return <ThemeContext.Provider value={themes[scheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * The one way to style with colours:
 *
 *   const useStyles = makeStyles((color) => StyleSheet.create({ card: { backgroundColor: color.bg.raised } }));
 *   …inside the component: const styles = useStyles();
 *
 * The styles are made once per scheme and remembered. Styles that hold no colour may stay in a
 * plain StyleSheet.create.
 */
export function makeStyles<T>(build: (color: Palette, scheme: Scheme) => T): () => T {
  const made = new Map<Scheme, T>();
  return function useStyles(): T {
    const { scheme, color } = useContext(ThemeContext);
    const known = made.get(scheme);
    if (known !== undefined) return known;
    const styles = build(color, scheme);
    made.set(scheme, styles);
    return styles;
  };
}
