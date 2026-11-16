/**
 * Practice: empty for now. Its title and one calm sentence.
 * The real screen is built in a later phase (see CLAUDE.md, "Phases").
 */
import { strings } from '@/strings';
import { QuietPlace, Screen } from '@/ui';

export default function PracticeScreen() {
  return (
    <Screen tabBar>
      <QuietPlace title={strings.practice.title} sentence={strings.practice.empty} aura="forest" />
    </Screen>
  );
}
