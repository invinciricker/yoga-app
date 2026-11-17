/**
 * The person's small preferences, kept on the phone: the theme (You → Appearance), the app's own
 * "reduce motion" switch, whether the welcome was seen, and the last day the billboard was shown
 * on Home. Read once when the app opens, before the splash screen goes, so that the first screen
 * is the right one, drawn in the right theme, at the right place, and still if it should be still.
 */
import { create } from 'zustand';

import { asAppearance, type Appearance } from '@/theme/scheme';

import { readJson, removeKey, storageKeys, writeJson } from './storage';

type PrefsState = {
  /** True once the saved preferences have been read (the splash screen waits for this). */
  started: boolean;
  appearance: Appearance;
  /** The switch in You. useReduceMotion() (motion.ts) also follows the phone's own setting. */
  reduceMotion: boolean;
  /** False until "Begin" or "Skip" is pressed on the welcome. */
  welcomeSeen: boolean;
  /** "2026-11-17", or undefined when the billboard has never been shown (or must show again). */
  billboardDay: string | undefined;
  start: () => Promise<void>;
  setAppearance: (appearance: Appearance) => void;
  setReduceMotion: (on: boolean) => void;
  /** "Begin" or "Skip": the welcome will not show again. */
  setWelcomeSeen: () => void;
  /** About → "Show the welcome again": forgotten on the phone, so it also shows at the next launch. */
  forgetWelcome: () => void;
  setBillboardDay: (day: string) => void;
  /** Home opens on the billboard again (after the welcome). Not saved: Home saves the day itself. */
  forgetBillboardDay: () => void;
};

export const usePrefs = create<PrefsState>((set, get) => ({
  started: false,
  appearance: 'system',
  reduceMotion: false,
  welcomeSeen: false,
  billboardDay: undefined,

  start: async () => {
    if (get().started) return;
    const [appearance, day, welcome, reduceMotion] = await Promise.all([
      readJson(storageKeys.appearance),
      readJson(storageKeys.billboardDay),
      readJson(storageKeys.welcome),
      readJson(storageKeys.reduceMotion),
    ]);
    set({
      started: true,
      appearance: asAppearance(appearance),
      billboardDay: typeof day === 'string' ? day : undefined,
      welcomeSeen: welcome === true,
      reduceMotion: reduceMotion === true,
    });
  },

  setAppearance: (appearance) => {
    set({ appearance });
    void writeJson(storageKeys.appearance, appearance);
  },

  setReduceMotion: (on) => {
    set({ reduceMotion: on });
    void writeJson(storageKeys.reduceMotion, on);
  },

  setWelcomeSeen: () => {
    set({ welcomeSeen: true });
    void writeJson(storageKeys.welcome, true);
  },

  forgetWelcome: () => {
    set({ welcomeSeen: false });
    void removeKey(storageKeys.welcome);
  },

  setBillboardDay: (day) => {
    set({ billboardDay: day });
    void writeJson(storageKeys.billboardDay, day);
  },

  forgetBillboardDay: () => set({ billboardDay: undefined }),
}));
