/**
 * Meditate: a timer and guided sittings. Built in Phase 8.
 * Until then: a placeholder in the preview app; the public app hides this tab (src/config.ts).
 */
import { Redirect } from 'expo-router';

import { areas } from '@/config';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { RoomPlaceholder } from '@/ui';

export default function MeditateScreen() {
  if (!areas.meditate && !isPreview) return <Redirect href={routes.home} />;
  return <RoomPlaceholder title={strings.tabs.meditate} aura="iris" />;
}
