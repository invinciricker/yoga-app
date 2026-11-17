/**
 * Breathe: breathing exercises with a pacer. Built in Phase 7.
 * Until then: a placeholder in the preview app; the public app hides this tab (src/config.ts).
 */
import { Redirect } from 'expo-router';

import { areas } from '@/config';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { RoomPlaceholder } from '@/ui';

export default function BreatheScreen() {
  if (!areas.breathe && !isPreview) return <Redirect href={routes.home} />;
  return <RoomPlaceholder title={strings.tabs.breathe} aura="tide" />;
}
