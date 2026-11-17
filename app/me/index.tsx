/**
 * You: the person's own page, opened from the round "You" button on Home. A settings page in the
 * phone's theme. From the top: the title, then (Phase 4) the person's numbers and week, then the
 * settings: Appearance and Reduce motion, About and Privacy, and in the preview app only the
 * design gallery.
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
import { Arrive, Button, Chip, IconButton, ListCard, Screen, SectionHeader, SettingsRow, Text } from '@/ui';

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
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const setReduceMotion = usePrefs((s) => s.setReduceMotion);

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

      {/* Phase 4 puts the person's numbers and their week here, between the title and the settings. */}

      <Arrive index={1} style={styles.block}>
        <SectionHeader title={strings.me.appearance} />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={strings.me.appearance}>
          {choices.map((c) => (
            <Chip key={c.key} label={c.label} selected={appearance === c.key} onPress={() => choose(c.key)} />
          ))}
        </View>
        <ListCard>
          <SettingsRow
            label={strings.me.reduceMotion}
            line={strings.me.reduceMotionLine}
            value={reduceMotion}
            onValueChange={(on) => {
              tick();
              setReduceMotion(on);
            }}
          />
        </ListCard>
      </Arrive>

      <Arrive index={2}>
        <ListCard>
          <SettingsRow label={strings.me.about} onPress={() => router.push(routes.about)} />
          <SettingsRow label={strings.me.privacy} onPress={() => router.push(routes.privacy)} />
        </ListCard>
      </Arrive>

      {isPreview ? (
        <Arrive index={3}>
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
  // The quiet button's words line up with the text above.
  galleryLink: { alignSelf: 'flex-start', marginLeft: -space.md },
});
