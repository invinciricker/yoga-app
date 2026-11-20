/**
 * Breathe's three settings, the same for every exercise (docs/phases/phase-7.md, section 3): the
 * length last chosen (3 minutes at first), Sound (off at first) and Vibration (on at first). Kept on
 * the phone under ywm:breathe:v1, read before the splash goes like the app's other settings, and
 * kept by "Delete my data" ("Your settings stay").
 */
import { create } from 'zustand';

import { readJson, storageKeys, writeJson } from '@/lib/storage';

import { DEFAULT_LENGTH, LENGTHS, type Length } from './session';

export type BreatheSettings = { minutes: Length; sound: boolean; vibration: boolean };

export const defaultSettings: BreatheSettings = { minutes: DEFAULT_LENGTH, sound: false, vibration: true };

/** The saved settings, read back: anything missing or broken takes its first value. Never throws. */
export function parseSettings(raw: unknown): BreatheSettings {
  if (typeof raw !== 'object' || raw === null) return defaultSettings;
  const r = raw as Record<string, unknown>;
  return {
    minutes: (LENGTHS as readonly unknown[]).includes(r.minutes) ? (r.minutes as Length) : defaultSettings.minutes,
    sound: typeof r.sound === 'boolean' ? r.sound : defaultSettings.sound,
    vibration: typeof r.vibration === 'boolean' ? r.vibration : defaultSettings.vibration,
  };
}

type BreatheState = BreatheSettings & {
  /** True once the saved settings have been read (the splash screen waits for this). */
  started: boolean;
  start: () => Promise<void>;
  set: (change: Partial<BreatheSettings>) => void;
};

export const useBreathe = create<BreatheState>((set, get) => ({
  ...defaultSettings,
  started: false,

  start: async () => {
    if (get().started) return;
    set({ ...parseSettings(await readJson(storageKeys.breathe)), started: true });
  },

  set: (change) => {
    set(change);
    const { minutes, sound, vibration } = get();
    void writeJson(storageKeys.breathe, { minutes, sound, vibration });
  },
}));
