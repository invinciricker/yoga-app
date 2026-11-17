/**
 * You → Privacy: docs/legal/privacy-policy.md, turned into blocks when the app is built
 * (src/legal/privacy.json, by "npm run legal"), with the names filled from the content.
 * The same text is on the website as privacy.html (tools/site/build.mjs).
 */
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { useContent } from '@/content/store';
import { fillPlaceholders, placeholderValues, privacyPolicy } from '@/legal';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, IconButton, RichText, Screen, Text } from '@/ui';

export default function PrivacyScreen() {
  const back = useBack(routes.me);
  const site = useContent((s) => s.content.site);
  const blocks = fillPlaceholders(privacyPolicy.blocks, placeholderValues(site));

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {privacyPolicy.title}
        </Text>
      </Arrive>
      <Arrive index={1}>
        <RichText blocks={blocks} ink="text.secondary" />
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl },
  header: { gap: space.xl },
});
