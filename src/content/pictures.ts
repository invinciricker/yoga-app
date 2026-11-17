/**
 * Pictures from the content: choosing the right size and building its address.
 * The build prepares each photo at several widths (480, 960, 1440); the app downloads the
 * smallest one that still looks sharp where it is shown.
 */
import type { Image } from '../../shared/content-schema';

import { CONTENT_BASE } from '@/config';

/**
 * The smallest variant at least as wide as needed (the width on screen × the screen's pixel
 * ratio). If none is wide enough, the widest there is.
 */
export function pickVariant(image: Image, neededPixels: number): Image['variants'][number] {
  const sorted = [...image.variants].sort((a, b) => a.w - b.w);
  return sorted.find((v) => v.w >= neededPixels) ?? sorted[sorted.length - 1];
}

/** Paths in the content file are relative to that file. */
export function pictureUrl(path: string): string {
  return CONTENT_BASE + path.replace(/^\/+/, '');
}
