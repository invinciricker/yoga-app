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
  /** You: the person's own page (Appearance). */
  me: '/me' as Href,
  gallery: '/gallery' as Href,
  lesson: (slug: string): Href => ({ pathname: '/lesson/[slug]', params: { slug } }),
  series: (slug: string): Href => ({ pathname: '/series/[slug]', params: { slug } }),
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
