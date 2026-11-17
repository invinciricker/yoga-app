/**
 * Where things are in the app, in one place, and a "back" that always leads somewhere.
 */
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/** The address of each page. The file app/lesson/[slug].tsx answers to "/lesson/<slug>". */
export const routes = {
  today: '/' as Href,
  practice: '/practice' as Href,
  journal: '/journal' as Href,
  gallery: '/gallery' as Href,
  lesson: (slug: string): Href => ({ pathname: '/lesson/[slug]', params: { slug } }),
  series: (slug: string): Href => ({ pathname: '/series/[slug]', params: { slug } }),
  entry: (slug: string): Href => ({ pathname: '/journal/[slug]', params: { slug } }),
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
