/**
 * Saved lessons and the answers to "How did that feel?", kept on the phone under ywm:practice:v1
 * (src/practice/types.ts). Read once when the app opens, before the splash goes.
 *
 * As with the record of the day (src/day/store.ts): a phone that refuses to save never stops the
 * screen, and sample progress lives in memory only.
 */
import { create } from 'zustand';

import { readJson, removeKey, storageKeys, writeJson } from '@/lib/storage';

import { emptyPractice, parsePractice, toggled, type Difficulty, type Feeling, type Practice } from './types';

type PracticeState = Practice & {
  /** True once the saved copy has been read (the splash screen waits for this). */
  started: boolean;
  /** Sample progress is showing instead of the person's own (preview app and web only). */
  sample: boolean;
  start: () => Promise<void>;
  /** Saves or unsaves a lesson. Answers whether it is saved now. */
  toggleSave: (slug: string) => boolean;
  /** Stores an answer at once. A new answer replaces the old one for that lesson. */
  answer: (slug: string, difficulty: Difficulty, feeling: Feeling | undefined) => void;
  /** Delete my data: forgets saved lessons and answers, on the phone too. */
  clear: () => Promise<void>;
  /** Shows sample progress in memory (or, with undefined, the person's own again). */
  showSample: (practice: Practice | undefined) => void;
};

// The person's own, kept aside while sample progress shows.
let own: Practice = emptyPractice;

export const usePractice = create<PracticeState>((set, get) => {
  /** Applies a change, and saves it unless sample progress is showing. */
  const change = (next: Practice) => {
    set(next);
    if (!get().sample) void writeJson(storageKeys.practice, { saved: next.saved, reactions: next.reactions });
  };

  return {
    ...emptyPractice,
    started: false,
    sample: false,

    start: async () => {
      if (get().started) return;
      const saved = parsePractice(await readJson(storageKeys.practice));
      set({ ...saved, started: true });
    },

    toggleSave: (slug) => {
      const saved = toggled(get().saved, slug);
      change({ saved, reactions: get().reactions });
      return saved.includes(slug);
    },

    answer: (slug, difficulty, feeling) => {
      const reaction = { difficulty, ...(feeling ? { feeling } : null), at: new Date().toISOString(), sent: false };
      change({ saved: get().saved, reactions: { ...get().reactions, [slug]: reaction } });
    },

    clear: async () => {
      own = emptyPractice;
      set({ ...emptyPractice, sample: false });
      await removeKey(storageKeys.practice);
    },

    showSample: (practice) => {
      const { sample, saved, reactions } = get();
      if (practice) {
        if (!sample) own = { saved, reactions };
        set({ ...practice, sample: true });
      } else if (sample) {
        set({ ...own, sample: false });
      }
    },
  };
});
