/**
 * Journal: empty for now. Its title and one calm sentence.
 * The real screen is built in a later phase (see CLAUDE.md, "Phases").
 */
import { strings } from '@/strings';
import { QuietPlace, Screen } from '@/ui';

export default function JournalScreen() {
  return (
    <Screen tabBar>
      <QuietPlace title={strings.journal.title} sentence={strings.journal.empty} aura="candle" />
    </Screen>
  );
}
