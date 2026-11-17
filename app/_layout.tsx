/**
 * The root of the app: loads the fonts, the content and the person's preferences, holds the splash
 * screen until they are ready, and sets up the theme and the stack of screens. Every screen in the
 * app lives inside this.
 */
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, type ReactNode } from 'react';

import { useContent } from '@/content/store';
import { usePrefs } from '@/lib/prefs';
import { fontFiles } from '@/theme/fonts';
import { ThemedStatusBar } from '@/theme/statusBar';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Keep the splash (the small gold light) on screen until we say otherwise.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or not available here (the web preview): nothing to do.
});

/**
 * The stack of screens, on the ground of the current theme. The navigation library draws a layer
 * of its own behind the screens: it gets the same colours, so it can never flash through.
 */
function Screens(): ReactNode {
  const { scheme, color } = useTheme();
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: color.accent.gold,
        background: color.bg.base,
        card: color.bg.elevated,
        text: color.text.primary,
        border: color.border.subtle,
        notification: color.support.danger,
      },
    };
  }, [scheme, color]);
  return (
    <NavigationTheme value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.base } }} />
    </NavigationTheme>
  );
}

export default function RootLayout() {
  const [fontsReady, fontsError] = useFonts(fontFiles);
  // True once the copy of the content saved on the phone has been read (a few milliseconds).
  const contentStarted = useContent((s) => s.started);
  // True once the theme setting and the billboard's day have been read (a few milliseconds).
  const prefsStarted = usePrefs((s) => s.started);
  const ready = fontsReady && contentStarted && prefsStarted;

  // Once, when the app opens: read the preferences; show the saved content, then download the newest.
  useEffect(() => {
    void usePrefs.getState().start();
    void useContent.getState().start();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // The fonts are bundled inside the app, so loading them cannot fail for lack of network.
  // If it ever did, that is a broken build: stop loudly instead of showing a fallback font.
  if (fontsError) throw fontsError;

  // Nothing may ever render in a fallback font or in the wrong theme: draw nothing (the splash is
  // still up) until ready.
  if (!fontsReady || !prefsStarted) return null;

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <Screens />
    </ThemeProvider>
  );
}
