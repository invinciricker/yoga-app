/**
 * OfflineNote: one quiet line under a title when the content could not be refreshed
 * (no network, usually). Everything on screen comes from the copy saved on the phone.
 */
import { strings } from '@/strings';

import { Text } from './Text';

export function OfflineNote() {
  return (
    <Text variant="meta" color="text.muted" accessibilityLiveRegion="polite">
      {strings.common.offline}
    </Text>
  );
}
