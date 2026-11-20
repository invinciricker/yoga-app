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
import { useBreathe } from '@/breathe/settings';
import { useDays } from '@/day/store';
import { useJournal } from '@/journal/store';
import { useReduceMotion } from '@/lib/motion';
import { usePrefs } from '@/lib/prefs';
import { SampleFromAddress } from '@/practice/demo';
import { usePractice } from '@/practice/store';
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
  // With "reduce motion" (the phone's or the app's own), screens fade in place of the platform's slide.
  const reduce = useReduceMotion();
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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg.base },
          animation: reduce ? 'fade' : 'default',
        }}
      >
        {/* The welcome fades in, whether it replaces the tabs on a first launch or opens from About. */}
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        {/* A lesson's closing screen covers the lesson, rising from below (a fade with reduce motion). */}
        <Stack.Screen
          name="lesson-done/[slug]"
          options={{ presentation: 'fullScreenModal', animation: reduce ? 'fade' : 'slide_from_bottom' }}
        />
      </Stack>
    </NavigationTheme>
  );
}

export default function RootLayout() {
  const [fontsReady, fontsError] = useFonts(fontFiles);
  // True once the copy of the content saved on the phone has been read (a few milliseconds).
  const contentStarted = useContent((s) => s.started);
  // True once the preferences (theme, reduce motion, welcome seen, billboard's day) have been read.
  const prefsStarted = usePrefs((s) => s.started);
  // True once the record of the day, the saved lessons, the journal and Breathe's settings have been
  // read, so Today's week and its cards never pop in, and an exercise's page opens on the length chosen.
  const daysStarted = useDays((s) => s.started);
  const practiceStarted = usePractice((s) => s.started);
  const journalStarted = useJournal((s) => s.started);
  const breatheStarted = useBreathe((s) => s.started);
  const progressStarted = daysStarted && practiceStarted && journalStarted && breatheStarted;
  const ready = fontsReady && contentStarted && prefsStarted && progressStarted;

  // Once, when the app opens: read the preferences, the person's progress and their journal; show
  // the saved content, then download the newest.
  useEffect(() => {
    void usePrefs.getState().start();
    void useDays.getState().start();
    void usePractice.getState().start();
    void useJournal.getState().start();
    void useBreathe.getState().start();
    void useContent.getState().start();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // The fonts are bundled inside the app, so loading them cannot fail for lack of network.
  // If it ever did, that is a broken build: stop loudly instead of showing a fallback font.
  if (fontsError) throw fontsError;

  // Nothing may ever render in a fallback font, in the wrong theme or without the person's
  // progress: draw nothing (the splash is still up) until ready.
  if (!fontsReady || !prefsStarted || !progressStarted) return null;

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <SampleFromAddress />
      <Screens />
    </ThemeProvider>
  );
}
