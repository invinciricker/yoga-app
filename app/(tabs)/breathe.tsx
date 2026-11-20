/**
 * Breathe: breathing exercises with a pacer (docs/phases/phase-7.md, section 2). In the phone's
 * theme, from the top (docs/V2.md, limit 1):
 *
 *   the title, "Breathe";
 *   the one suggestion: a cover in the `tide` aura, "For this evening", the exercise of the time of
 *     day (breatheNow in src/breathe/words.ts), and the gold "Begin · 3 min" to the player. Once
 *     anything was breathed today: the sage tick and "Done today", and the card opens its page;
 *   the shelf: every exercise by order, one row each with the round in short ("In 4 · Out 6").
 *
 * Nothing else: no filter, no search (fewer than 8). With nothing to show, the public app hides the
 * tab (src/lib/areas.ts) and the preview app says so quietly.
 */
import { Redirect, useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { BreathExercise } from '../../shared/content-schema';

import { DEFAULT_LENGTH } from '@/breathe/session';
import { breathedOn, breatheNow, byOrder, roundInShort } from '@/breathe/words';
import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { useAreas } from '@/lib/areas';
import { partOfDay } from '@/lib/greeting';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { ThemeScope } from '@/theme/ThemeProvider';
import { Arrive, Button, Cover, DoneTick, DraftChip, EmptyState, ListCard, Overline, PressableScale, Screen, ShelfRow, size, Text } from '@/ui';

export default function BreatheScreen() {
  const router = useRouter();
  const available = useAreas();
  const content = useContent((s) => s.content);
  const entries = useDays((s) => s.entries);

  if (!available.breathe && !isPreview) return <Redirect href={routes.home} />;

  const now = new Date();
  const exercises = byOrder(content.breath ?? []);
  const suggested = breatheNow(exercises, now);
  const done = breathedOn(entries, dayOf(now));

  return (
    <Screen tabBar contentStyle={styles.sections}>
      <Arrive index={0}>
        <Text variant="display" accessibilityRole="header">
          {strings.breathe.title}
        </Text>
      </Arrive>

      {suggested ? (
        <Arrive index={1}>
          <Suggestion exercise={suggested} overline={strings.breathe.forPart[partOfDay(now)]} done={done} />
        </Arrive>
      ) : (
        <EmptyState sentence={strings.breathe.empty} aura="tide" />
      )}

      {exercises.length > 0 ? (
        <Arrive index={2}>
          <ListCard>
            {exercises.map((exercise) => (
              <ShelfRow
                key={exercise.slug}
                aura="tide"
                title={exercise.title}
                line={roundInShort(exercise.steps)}
                item={exercise}
                onPress={() => router.push(routes.breath(exercise.slug))}
              />
            ))}
          </ListCard>
        </Arrive>
      ) : null}
    </Screen>
  );
}

/** The one suggestion, on the `tide` aura (a cover: always dark, words in onCover). */
function Suggestion({ exercise, overline, done }: { exercise: BreathExercise; overline: string; done: boolean }) {
  const router = useRouter();
  const begin = () => router.push(routes.breathPlay(exercise.slug, DEFAULT_LENGTH));
  const open = done ? () => router.push(routes.breath(exercise.slug)) : begin;
  const label = [overline, exercise.title, exercise.summary, done ? strings.breathe.doneToday : strings.breathe.beginFor(DEFAULT_LENGTH)].join(', ');

  return (
    <PressableScale onPress={open} accessibilityLabel={label}>
      <Cover aura="tide" height={size.todayPage} radius="xl" scrim>
        <DraftChip item={exercise} onCover style={styles.draft} />
        <View style={styles.cardWords}>
          <Overline tone="cover">{overline}</Overline>
          <Text variant="h2" color="onCover.primary">
            {exercise.title}
          </Text>
          <Text variant="body" color="onCover.secondary">
            {exercise.summary}
          </Text>
          {done ? (
            <View style={styles.done}>
              {/* Over a cover, the sage of the dark palette (covers are night pictures). */}
              <ThemeScope scheme="dark">
                <DoneTick />
              </ThemeScope>
              <Text variant="label" color="onCover.primary">
                {strings.breathe.doneToday}
              </Text>
            </View>
          ) : (
            <Button label={strings.breathe.beginFor(DEFAULT_LENGTH)} icon={Play} iconFilled shape="pill" onPress={begin} style={styles.go} />
          )}
        </View>
      </Cover>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  cardWords: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
  draft: { position: 'absolute', top: space.lg, left: space.xl },
  go: { alignSelf: 'flex-start', marginTop: space.xs },
  done: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs, minHeight: size.button.pill },
});
