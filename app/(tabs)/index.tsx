/**
 * Today: the first screen. A greeting that follows the clock, with the candlelight behind it,
 * and one cover announcing that the first lessons are on their way.
 * (The week card, the lesson of the day and the rest arrive with Phases 1 to 3.)
 */
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { greetingFor } from '@/lib/greeting';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { Arrive, Button, Candlelight, Cover, IconButton, Overline, Screen, size, Text } from '@/ui';

export default function TodayScreen() {
  const router = useRouter();
  const greeting = greetingFor(new Date());

  return (
    <Screen tabBar backdrop={<Candlelight />} contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <View style={styles.topRow}>
          <Overline>{greeting.overline}</Overline>
          {/* Opens "My practice" from Phase 2. It does nothing yet. */}
          <IconButton icon={User} accessibilityLabel={strings.today.myPractice} />
        </View>
        <Text variant="display" accessibilityRole="header">
          {greeting.hello}
          {'\n'}
          <Text variant="display" italic color="text.secondary">
            {greeting.line}
          </Text>
        </Text>
      </Arrive>

      <Arrive index={1}>
        <Cover aura="dusk" height={size.hero.height} radius="xl" scrim>
          <View style={styles.heroText}>
            <Overline>{strings.today.comingOverline}</Overline>
            <Text variant="h1">{strings.today.comingTitle}</Text>
            <Text variant="body" color="text.secondary">
              {strings.today.comingBody}
            </Text>
          </View>
        </Cover>
      </Arrive>

      {isPreview ? (
        <Arrive index={2}>
          <Button
            kind="quiet"
            label={strings.today.galleryLink}
            onPress={() => router.push('/gallery')}
            style={styles.galleryLink}
          />
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  header: { gap: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroText: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
  galleryLink: { alignSelf: 'center' },
});
