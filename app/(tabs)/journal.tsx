/**
 * Journal: the person's own private writing (free pages and three guided journals). Built in
 * Phases 5 and 6. Nothing written here ever leaves the phone.
 * Until then: a placeholder in the preview app; the public app hides this tab (src/config.ts).
 *
 * (Maria's tips and notes, which this tab used to show, are now at /notes.)
 */
import { Redirect } from 'expo-router';

import { areas } from '@/config';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { RoomPlaceholder } from '@/ui';

export default function JournalScreen() {
  if (!areas.journal && !isPreview) return <Redirect href={routes.home} />;
  return <RoomPlaceholder title={strings.tabs.journal} aura="rose" />;
}
