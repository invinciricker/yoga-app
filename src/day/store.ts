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
  /**
   * Records one thing done, or updates it: an entry of the same kind, ref and day is replaced
   * (a page being written keeps one entry per day, its minutes growing). Phase 5.
   */
  upsert: (entry: DayEntry) => void;
  /** Forgets every entry of one ref (a page deleted, or left with nothing written). Phase 5. */
  removeRef: (ref: string) => void;
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

  upsert: (entry) => {
    const same = (e: DayEntry) => e.kind === entry.kind && e.ref === entry.ref && e.day === entry.day;
    const before = get().entries;
    const entries = before.some(same) ? before.map((e) => (same(e) ? entry : e)) : [...before, entry];
    set({ entries });
    if (!get().sample) void writeJson(storageKeys.days, entries);
  },

  removeRef: (ref) => {
    const before = get().entries;
    const entries = before.filter((e) => e.ref !== ref);
    if (entries.length === before.length) return;
    set({ entries });
    if (!get().sample) void writeJson(storageKeys.days, entries);
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
