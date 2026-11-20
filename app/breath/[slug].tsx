/**
 * An exercise's page (/breath/long-exhale; docs/phases/phase-7.md, section 3). In the phone's theme:
 * a cover in the `tide` aura with the title, then
 *   the overline "Breathe" and what it is good for;
 *   the round in words, one line per step ("In · 4 seconds · through the nose");
 *   how to do it;
 *   the length: 1, 3 or 5 minutes (3 at first, then the last one chosen, for every exercise);
 *   the gold "Begin", to the player;
 *   Sound (off at first) and Vibration (on at first), the same for every exercise;
 *   "Why this works", one tap away (/breath-why/<slug>);
 *   and, quietly at the bottom, the safety sentence.
 * Not under /breathe/: the tab is breathe.html in the web export (src/lib/nav.ts).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LENGTHS } from '@/breathe/session';
import { useBreathe } from '@/breathe/settings';
import { levelWords, stepLine } from '@/breathe/words';
import { slugsForStaticPages } from '@/content/load';
import { useContent } from '@/content/store';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Button,
  Chip,
  Cover,
  DraftChip,
  IconButton,
  ListCard,
  LoadingPage,
  NotHere,
  Overline,
  RichText,
  Screen,
  SettingsRow,
  size,
  Text,
} from '@/ui';

/** Web preview only: the pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('breath');
}

export default function BreathScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = useBack(routes.breathe);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const minutes = useBreathe((s) => s.minutes);
  const sound = useBreathe((s) => s.sound);
  const vibration = useBreathe((s) => s.vibration);
  const settings = useBreathe((s) => s.set);
  const exercise = content.breath?.find((e) => e.slug === slug);

  if (!exercise) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.breathe.gone} actionLabel={strings.breathe.toBreathe} onAction={() => router.replace(routes.breathe)} />;
  }

  const level = levelWords(exercise.why.level);
  const begin = () => router.push(routes.breathPlay(exercise.slug, minutes));

  return (
    <Screen bleed darkTop={size.cover.series}>
      <Cover aura="tide" height={size.cover.series} radius="none" scrim>
        <View style={[styles.coverTop, { top: insets.top + space.md }]}>
          <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
        </View>
        <View style={styles.coverWords}>
          <DraftChip item={exercise} onCover style={styles.draft} />
          <Text variant="h1" color="onCover.primary" accessibilityRole="header">
            {exercise.title}
          </Text>
          <Text variant="body" color="onCover.secondary">
            {exercise.summary}
          </Text>
        </View>
      </Cover>

      <View style={styles.sections}>
        <Arrive index={0} style={styles.intro}>
          <Overline tone="area" area="breathe">
            {strings.breathe.overline}
          </Overline>
          <Text variant="bodyLarge" color="text.secondary">
            {exercise.goodFor}
          </Text>
        </Arrive>

        {/* The round in words: one line per step. */}
        <Arrive index={1} style={styles.block}>
          <Text variant="meta" color="text.muted" accessibilityRole="header">
            {strings.breathe.oneRound}
          </Text>
          <View style={styles.steps}>
            {exercise.steps.map((step, i) => (
              <Text key={i} variant="body" tabular>
                {stepLine(step)}
              </Text>
            ))}
          </View>
        </Arrive>

        <Arrive index={2}>
          <RichText blocks={exercise.how} ink="text.secondary" />
        </Arrive>

        {/* The length, the one gold button, and the two settings. */}
        <Arrive index={3} style={styles.block}>
          <Text variant="meta" color="text.muted" accessibilityRole="header">
            {strings.breathe.length}
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={strings.breathe.length}>
            {LENGTHS.map((length) => (
              <Chip
                key={length}
                look="soft"
                label={strings.breathe.lengthChip(length)}
                selected={minutes === length}
                onPress={() => {
                  tick(); // a light tick in the hand
                  settings({ minutes: length });
                }}
              />
            ))}
          </View>
          <Button label={strings.breathe.begin} icon={Play} iconFilled onPress={begin} style={styles.begin} />
        </Arrive>

        <Arrive index={4} style={styles.block}>
          <ListCard>
            <SettingsRow label={strings.breathe.sound} line={strings.breathe.soundLine} value={sound} onValueChange={(on) => settings({ sound: on })} />
            <SettingsRow
              label={strings.breathe.vibration}
              line={strings.breathe.vibrationLine}
              value={vibration}
              onValueChange={(on) => settings({ vibration: on })}
            />
          </ListCard>
          <ListCard>
            <SettingsRow label={strings.breathe.why} detail={level?.title} onPress={() => router.push(routes.breathWhy(exercise.slug))} />
          </ListCard>
        </Arrive>

        <Arrive index={5}>
          <Text variant="meta" color="text.muted">
            {strings.breathe.safety}
          </Text>
        </Arrive>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverTop: { position: 'absolute', left: layout.gutter, right: layout.gutter, flexDirection: 'row' },
  coverWords: { position: 'absolute', left: layout.gutter, right: layout.gutter, bottom: space.xl, gap: space.xs },
  draft: { alignSelf: 'flex-start' },
  sections: { paddingHorizontal: layout.gutter, paddingTop: space.xl, gap: space.xxl },
  intro: { gap: space.xs },
  block: { gap: space.sm },
  steps: { gap: space.xxs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, paddingVertical: space.xxs },
  begin: { marginTop: space.sm },
});
