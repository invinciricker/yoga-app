/**
 * Studio: empty for now. Its title and one calm sentence.
 * The real screen is built in a later phase (see CLAUDE.md, "Phases").
 */
import { strings } from '@/strings';
import { QuietPlace, Screen } from '@/ui';

export default function StudioScreen() {
  return (
    <Screen tabBar>
      <QuietPlace title={strings.studio.title} sentence={strings.studio.empty} aura="ember" />
    </Screen>
  );
}
