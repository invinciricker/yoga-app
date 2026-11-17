/**
 * The person's small preferences, kept on the phone: the theme (You → Appearance) and the last day
 * the billboard was shown on Home. Read once when the app opens, before the splash screen goes,
 * so that the first screen is drawn in the right theme and at the right place.
 */
import { create } from 'zustand';

import { asAppearance, type Appearance } from '@/theme/scheme';

import { readJson, storageKeys, writeJson } from './storage';

type PrefsState = {
  /** True once the saved preferences have been read (the splash screen waits for this). */
  started: boolean;
  appearance: Appearance;
  /** "2026-11-17", or undefined when the billboard has never been shown. */
  billboardDay: string | undefined;
  start: () => Promise<void>;
  setAppearance: (appearance: Appearance) => void;
  setBillboardDay: (day: string) => void;
};

export const usePrefs = create<PrefsState>((set, get) => ({
  started: false,
  appearance: 'system',
  billboardDay: undefined,

  start: async () => {
    if (get().started) return;
    const [appearance, day] = await Promise.all([readJson(storageKeys.appearance), readJson(storageKeys.billboardDay)]);
    set({
      started: true,
      appearance: asAppearance(appearance),
      billboardDay: typeof day === 'string' ? day : undefined,
    });
  },

  setAppearance: (appearance) => {
    set({ appearance });
    void writeJson(storageKeys.appearance, appearance);
  },

  setBillboardDay: (day) => {
    set({ billboardDay: day });
    void writeJson(storageKeys.billboardDay, day);
  },
}));
