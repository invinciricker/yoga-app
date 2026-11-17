/**
 * The icons of the status bar (clock, battery) follow what is under them:
 *   light icons on a dark screen, and on a dark top (the billboard, a cover, a dark ThemeScope
 *   that reaches the top of the screen); dark icons on a light screen.
 *
 * <ThemedStatusBar /> sits once in app/_layout.tsx. A screen whose top is dark calls
 * useDarkTop(true) while that dark part is under the status bar. Only the screen in front counts:
 * the claim is dropped when the screen loses focus.
 */
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useId } from 'react';
import { create } from 'zustand';

import { useTheme } from './ThemeProvider';

/** Which screen, if any, has a dark top under the status bar right now. */
const useDarkTopOwner = create<{ owner: string | null }>(() => ({ owner: null }));

export function useDarkTop(dark: boolean): void {
  const id = useId();
  useFocusEffect(
    useCallback(() => {
      const release = () => {
        if (useDarkTopOwner.getState().owner === id) useDarkTopOwner.setState({ owner: null });
      };
      if (dark) useDarkTopOwner.setState({ owner: id });
      else release();
      return release;
    }, [dark, id]),
  );
}

export function ThemedStatusBar() {
  const { scheme } = useTheme();
  const darkTop = useDarkTopOwner((s) => s.owner !== null);
  return <StatusBar style={scheme === 'dark' || darkTop ? 'light' : 'dark'} />;
}
