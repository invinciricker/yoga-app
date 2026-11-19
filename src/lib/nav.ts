/**
 * Where things are in the app, in one place, and a "back" that always leads somewhere.
 */
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/** The address of each page. The file app/lesson/[slug].tsx answers to "/lesson/<slug>". */
export const routes = {
  home: '/' as Href,
  practice: '/practice' as Href,
  /** Maria's tips and notes (all of them), and one of them. */
  notes: '/notes' as Href,
  note: (slug: string): Href => ({ pathname: '/notes/[slug]', params: { slug } }),
  /** Maria's page, behind the billboard. */
  maria: '/maria' as Href,
  /** You: the person's own page (settings), and its pages. */
  me: '/me' as Href,
  about: '/me/about' as Href,
  privacy: '/me/privacy' as Href,
  licences: '/me/licences' as Href,
  saved: '/me/saved' as Href,
  history: '/me/history' as Href,
  deleteData: '/me/delete' as Href,
  /** The three screens of the first launch. */
  welcome: '/welcome' as Href,
  gallery: '/gallery' as Href,
  lesson: (slug: string): Href => ({ pathname: '/lesson/[slug]', params: { slug } }),
  /**
   * A lesson's closing screen ("Well done."), over the lesson. Its own address, not under
   * /lesson/<slug>/: the web export would otherwise hold a folder and a page of the same name.
   */
  lessonDone: (slug: string): Href => ({ pathname: '/lesson-done/[slug]', params: { slug } }),
  /** The tabs of the other areas, for the one hand-off a closing screen may offer. */
  breathe: '/breathe' as Href,
  meditate: '/meditate' as Href,
  journal: '/journal' as Href,
  series: (slug: string): Href => ({ pathname: '/series/[slug]', params: { slug } }),
  /**
   * The Journal (Phase 5). Each page has its own first word, never under /journal/: the web export
   * would otherwise hold both journal.html (the tab) and a folder journal/ (Phase 4's lesson).
   *   /guided/<slug>          a guided journal: its cover, its progress, the pages written
   *   /guided-about/<slug>    "About this journal"
   *   /write?journal=<slug>   today's page of a guided journal; &entry=<id> a page written before
   *   /free-pages             the free pages; /free-page?entry=<id> one of them, or a new one
   */
  guided: (slug: string): Href => ({ pathname: '/guided/[slug]', params: { slug } }),
  guidedAbout: (slug: string): Href => ({ pathname: '/guided-about/[slug]', params: { slug } }),
  write: (journal: string, entry?: string): Href => ({ pathname: '/write', params: entry ? { journal, entry } : { journal } }),
  freePages: '/free-pages' as Href,
  freePage: (params: { entry?: string; prompt?: string } = {}): Href => ({ pathname: '/free-page', params }),
  exportJournal: '/me/export' as Href,
};

/**
 * What a back button does: go back, or, when the page was opened directly (a link, the web
 * preview) and there is nothing to go back to, go to the given place instead.
 */
export function useBack(fallback: Href): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
