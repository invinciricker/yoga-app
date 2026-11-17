/**
 * Maria's page, opened from "Meet Maria" on the billboard. For now the same stand-in the Studio
 * tab showed: her name and one calm sentence. Phase 3 builds the real page (portrait, introduction,
 * why yoga, classes, place, price, contact).
 */
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, IconButton, QuietPlace, Screen } from '@/ui';

export default function MariaScreen() {
  const back = useBack(routes.home);
  const name = useContent((s) => s.content.studio.name || s.content.site.teacherFirstName);
  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
      </Arrive>
      <QuietPlace title={name} sentence={strings.maria.empty} aura="saffron" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl },
});
