/**
 * The Journal on the phone: every page written, and the journals begun.
 *
 *   ywm:journal:v1:page:<id>   one key per page (a JournalEntry, src/journal/types.ts)
 *   ywm:journal:v1:begun       the slugs of the guided journals whose "Begin" was pressed
 *   ywm:journal:v1:cycles      the current start of each journal started again, { "habit": 2 } (Phase 6)
 *
 * An answer handed from one journal to another ("Make it a habit", Phase 6) waits in memory only,
 * until the page it is for opens; it is gone when the app closes.
 *
 * Nothing of it is ever sent, logged or counted outside the phone (docs/V2.md, limit 7). Read once
 * when the app opens, before the splash goes, like the record of the day.
 *
 * Saving: a change is in memory at once, and on the phone within SAVE_WITHIN_MS (one key: only the
 * page that changed), and at once when the page is left or the app goes to the background. So
 * closing or killing the app mid-sentence loses at most the last second. As with the other stores,
 * a phone that refuses to save never stops the screen, and sample progress lives in memory only.
 */
import { AppState } from 'react-native';
import { create } from 'zustand';

import { readAllStartingWith, readJson, removeAllStartingWith, removeKey, storageKeys, writeJson } from '@/lib/storage';

import { parseCycles, startedAgain } from './cycles';
import { parseEntry, type JournalEntry } from './types';

/** An answer handed to another journal's first page, waiting for that page to open. */
export type Carried = { journal: string; prompt: string; text: string };
/** What sample progress shows in place of the person's own. */
export type SampleJournal = { entries: JournalEntry[]; begun: string[]; cycles?: Record<string, number> };

/** The longest a change waits before it is written to the phone. */
export const SAVE_WITHIN_MS = 700;

type JournalState = {
  /** True once the saved pages have been read (the splash screen waits for this). */
  started: boolean;
  entries: JournalEntry[];
  /** The guided journals whose "Begin" was pressed. */
  begun: string[];
  /** The current start of each journal started again (src/journal/cycles.ts). */
  cycles: Record<string, number>;
  /** An answer handed to another journal, in memory only. */
  carried: Carried | undefined;
  /** Sample progress is showing instead of the person's own (preview app and web only). */
  sample: boolean;
  start: () => Promise<void>;
  /** "Begin" at the end of "About this journal". */
  begin: (slug: string) => void;
  /** "Start a new habit": the journal starts again from its first page; every page written stays. */
  startAgain: (slug: string) => void;
  /** Keeps an answer for another journal's first page ("Make it a habit"), or forgets it. */
  carry: (carried: Carried | undefined) => void;
  /** Keeps a page (new or changed): in memory now, on the phone within SAVE_WITHIN_MS. */
  put: (entry: JournalEntry) => void;
  /** Forgets one page, on the phone too. */
  remove: (id: string) => void;
  /** Writes every change still waiting, now. */
  flush: () => Promise<void>;
  /** Delete my data: forgets every page and every journal begun, on the phone too. */
  clear: () => Promise<void>;
  /** Shows sample pages in memory (or, with undefined, the person's own again). */
  showSample: (sample: SampleJournal | undefined) => void;
};

const pageKey = (id: string) => `${storageKeys.journalPage}${id}`;

// The pages changed and not yet written to the phone, and the timer that will write them.
const waiting = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
// The person's own, kept aside while sample progress shows.
let own: Required<SampleJournal> = { entries: [], begun: [], cycles: {} };
let listening = false;

export const useJournal = create<JournalState>((set, get) => {
  const schedule = () => {
    if (timer === undefined) timer = setTimeout(() => void get().flush(), SAVE_WITHIN_MS);
  };

  return {
    started: false,
    entries: [],
    begun: [],
    cycles: {},
    carried: undefined,
    sample: false,

    start: async () => {
      if (get().started) return;
      if (!listening) {
        listening = true;
        // Going to the background (or being closed from the recent apps): write what is waiting.
        AppState.addEventListener('change', (state) => {
          if (state !== 'active') void get().flush();
        });
      }
      const [pages, begun, cycles] = await Promise.all([
        readAllStartingWith(storageKeys.journalPage),
        readJson(storageKeys.journalBegun),
        readJson(storageKeys.journalCycles),
      ]);
      const saved = pages.flatMap(({ value }) => {
        const entry = parseEntry(value);
        return entry ? [entry] : [];
      });
      const slugs = Array.isArray(begun) ? begun.filter((s): s is string => typeof s === 'string') : [];
      // Something may have been written while the pages were being read (never in practice): keep both.
      const written = new Set(get().entries.map((e) => e.id));
      set({
        started: true,
        entries: [...saved.filter((e) => !written.has(e.id)), ...get().entries],
        begun: [...new Set([...slugs, ...get().begun])],
        cycles: { ...parseCycles(cycles), ...get().cycles },
      });
    },

    begin: (slug) => {
      if (get().begun.includes(slug)) return;
      const begun = [...get().begun, slug];
      set({ begun });
      if (!get().sample) void writeJson(storageKeys.journalBegun, begun);
    },

    startAgain: (slug) => {
      const cycles = startedAgain(get().cycles, slug);
      set({ cycles });
      if (!get().sample) void writeJson(storageKeys.journalCycles, cycles);
    },

    carry: (carried) => set({ carried }),

    put: (entry) => {
      const before = get().entries;
      const entries = before.some((e) => e.id === entry.id) ? before.map((e) => (e.id === entry.id ? entry : e)) : [...before, entry];
      set({ entries });
      if (get().sample) return;
      waiting.add(entry.id);
      schedule();
    },

    remove: (id) => {
      set({ entries: get().entries.filter((e) => e.id !== id) });
      waiting.delete(id);
      if (!get().sample) void removeKey(pageKey(id));
    },

    flush: async () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      const ids = [...waiting];
      waiting.clear();
      const { entries } = get();
      await Promise.all(
        ids.map((id) => {
          const entry = entries.find((e) => e.id === id);
          // A refused save leaves the page in memory; its next change tries again.
          return entry ? writeJson(pageKey(id), entry) : Promise.resolve(true);
        }),
      );
    },

    clear: async () => {
      // Nothing waiting may land after the erasing: no ghost of a page left behind.
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      waiting.clear();
      own = { entries: [], begun: [], cycles: {} };
      set({ entries: [], begun: [], cycles: {}, carried: undefined, sample: false });
      await removeAllStartingWith(storageKeys.journal);
    },

    showSample: (sample) => {
      const state = get();
      // An answer on its way to another journal belongs to the pages it was written among.
      if (sample) {
        if (!state.sample) own = { entries: state.entries, begun: state.begun, cycles: state.cycles };
        set({ entries: sample.entries, begun: sample.begun, cycles: sample.cycles ?? {}, carried: undefined, sample: true });
      } else if (state.sample) {
        set({ entries: own.entries, begun: own.begun, cycles: own.cycles, carried: undefined, sample: false });
      }
    },
  };
});
