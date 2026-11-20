/**
 * Which areas a person can go to right now: built (`areas` in src/config.ts) AND with something in
 * them (docs/V2.md, limit 4: "Nothing is shown empty"). Breathe with no exercise the app may show
 * (none published, in the public app) is hidden: its tab, Today's card and the "Three minutes of
 * breath?" of a closing screen. The preview app still shows the tab, with a quiet line.
 */
import type { ContentFile } from '../../shared/content-schema';

import { areas, type BuildingArea } from '@/config';
import { useContent } from '@/content/store';

/** The areas built and not empty, for this content. Pure. */
export function areasWithContent(content: ContentFile): Record<BuildingArea, boolean> {
  return { ...areas, breathe: areas.breathe && (content.breath ?? []).length > 0 };
}

/** The same, for a screen: follows the content as it refreshes. */
export function useAreas(): Record<BuildingArea, boolean> {
  const content = useContent((s) => s.content);
  return areasWithContent(content);
}
