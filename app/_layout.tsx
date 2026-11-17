/**
 * The root of the app: loads the fonts, starts the content, holds the splash screen until both
 * are ready, and sets up the stack of screens. Every screen in the app lives inside this.
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useContent } from '@/content/store';
import { color } from '@/theme';
import { fontFiles } from '@/theme/fonts';

// Keep the splash (the small gold light) on screen until we say otherwise.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or not available here (the web preview): nothing to do.
});

export default function RootLayout() {
  const [fontsReady, fontsError] = useFonts(fontFiles);
  // True once the copy of the content saved on the phone has been read (a few milliseconds).
  const contentStarted = useContent((s) => s.started);

  // Once, when the app opens: show the saved content, then download the newest.
  useEffect(() => {
    void useContent.getState().start();
  }, []);

  useEffect(() => {
    if (fontsReady && contentStarted) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, contentStarted]);

  // The fonts are bundled inside the app, so loading them cannot fail for lack of network.
  // If it ever did, that is a broken build: stop loudly instead of showing a fallback font.
  if (fontsError) throw fontsError;

  // Nothing may ever render in a fallback font: draw nothing (the splash is still up) until ready.
  if (!fontsReady) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.base } }} />
    </>
  );
}
