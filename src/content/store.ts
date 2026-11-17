/**
 * The content store: what every screen reads Maria's content from.
 *
 *   status "loading"  nothing to show yet (only on a first launch with no saved copy)
 *          "ready"    showing content, and the last refresh worked (or is still running)
 *          "stale"    showing the saved copy because the last refresh failed
 */
import { create } from 'zustand';

import type { ContentFile } from '../../shared/content-schema';

import { emptyContent } from './fallback';
import { fetchFresh, loadSaved } from './load';

export type ContentStatus = 'loading' | 'ready' | 'stale';

type ContentState = {
  status: ContentStatus;
  content: ContentFile;
  /** True once the saved copy has been looked for: the splash screen waits for this. */
  started: boolean;
  /** True while a pull-to-refresh is running. */
  refreshing: boolean;
  /** Called once when the app opens: shows the saved copy, then refreshes. */
  start: () => Promise<void>;
  /** Downloads the content again. */
  refresh: () => Promise<void>;
};

export const useContent = create<ContentState>((set, get) => ({
  status: 'loading',
  content: emptyContent,
  started: false,
  refreshing: false,

  start: async () => {
    if (get().started) return;
    const saved = await loadSaved();
    if (saved) set({ content: saved, status: 'ready' });
    set({ started: true });
    await get().refresh();
  },

  refresh: async () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    const fresh = await fetchFresh();
    if (fresh) set({ content: fresh, status: 'ready', refreshing: false });
    else set({ status: 'stale', refreshing: false });
  },
}));
