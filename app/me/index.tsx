/**
 * You: the person's own page, opened from the round "You" button on Home.
 * For now: Appearance (System, Light, Dark), and in the preview app the link to the design gallery.
 * Phase 3 adds reduce motion, about and privacy.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { space, type Appearance } from '@/theme';
import { Arrive, Button, Chip, IconButton, Screen, SectionHeader, Text } from '@/ui';

const choices: { key: Appearance; label: string }[] = [
  { key: 'system', label: strings.me.system },
  { key: 'light', label: strings.me.light },
  { key: 'dark', label: strings.me.dark },
];

export default function YouScreen() {
  const router = useRouter();
  const back = useBack(routes.home);
  const appearance = usePrefs((s) => s.appearance);
  const setAppearance = usePrefs((s) => s.setAppearance);

  const choose = (key: Appearance) => {
    if (key === appearance) return;
    tick(); // a light tick in the hand
    setAppearance(key);
  };

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="display" accessibilityRole="header">
          {strings.me.title}
        </Text>
      </Arrive>

      <Arrive index={1} style={styles.block}>
        <SectionHeader title={strings.me.appearance} />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={strings.me.appearance}>
          {choices.map((c) => (
            <Chip key={c.key} label={c.label} selected={appearance === c.key} onPress={() => choose(c.key)} />
          ))}
        </View>
      </Arrive>

      {isPreview ? (
        <Arrive index={2}>
          <Button
            kind="quiet"
            label={strings.me.galleryLink}
            onPress={() => router.push(routes.gallery)}
            style={styles.galleryLink}
          />
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  block: { gap: space.md },
  chips: { flexDirection: 'row', gap: space.xs, paddingVertical: space.xxs },
  galleryLink: { alignSelf: 'flex-start' },
});
