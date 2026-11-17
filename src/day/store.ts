/**
 * The record of the day, kept on the phone under ywm:days:v1 (src/day/record.ts says what is in it).
 * Read once when the app opens, before the splash goes, so Today's week never pops in.
 *
 * The screen always carries on: if the phone refuses to save (storage full), the entry stays in
 * memory for this session and the next change tries to save the whole list again.
 *
 * Sample progress (the design gallery, ?demo=streak) replaces the list in memory only: while it
 * shows, nothing is saved, and switching it off brings the person's own list back.
 */
import { create } from 'zustand';

import { readJson, removeKey, storageKeys, writeJson } from '@/lib/storage';

import { parseEntries, type DayEntry } from './record';

type DaysState = {
  /** True once the saved list has been read (the splash screen waits for this). */
  started: boolean;
  entries: DayEntry[];
  /** Sample progress is showing instead of the person's own (preview app and web only). */
  sample: boolean;
  start: () => Promise<void>;
  /**
   * Records one thing done. `opening` names one opening of a closing screen: a second call with
   * the same name is ignored, so a screen drawn twice still writes once. Answers whether it was
   * recorded now.
   */
  add: (entry: DayEntry, opening?: string) => boolean;
  /** Delete my data: forgets every entry, on the phone too. */
  clear: () => Promise<void>;
  /** Shows sample entries in memory (or, with undefined, the person's own again). */
  showSample: (entries: DayEntry[] | undefined) => void;
};

// The openings already recorded during this session (never saved: a new session is a new opening).
const openings = new Set<string>();
// The person's own list, kept aside while sample progress shows.
let ownEntries: DayEntry[] = [];

export const useDays = create<DaysState>((set, get) => ({
  started: false,
  entries: [],
  sample: false,

  start: async () => {
    if (get().started) return;
    const saved = parseEntries(await readJson(storageKeys.days));
    // Something may have been added while the list was being read (never in practice): keep both.
    set({ started: true, entries: [...saved, ...get().entries] });
  },

  add: (entry, opening) => {
    if (opening !== undefined) {
      if (openings.has(opening)) return false;
      openings.add(opening);
    }
    const entries = [...get().entries, entry];
    set({ entries });
    if (!get().sample) void writeJson(storageKeys.days, entries);
    return true;
  },

  clear: async () => {
    ownEntries = [];
    set({ entries: [], sample: false });
    await removeKey(storageKeys.days);
  },

  showSample: (entries) => {
    const { sample } = get();
    if (entries) {
      if (!sample) ownEntries = get().entries;
      set({ entries, sample: true });
    } else if (sample) {
      set({ entries: ownEntries, sample: false });
    }
  },
}));
