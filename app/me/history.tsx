/**
 * You → History: the lessons done and the breathing sessions (Phase 7), grouped by day, the newest
 * first ("Today", "Yesterday", then "16 November"). A lesson is its row with the minutes recorded;
 * a session is a small tide disc, the exercise's title and its minutes. Something no longer in the
 * content is left out here, but it still lights its candle and counts in the totals.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { routes, useBack } from '@/lib/nav';
import { historyDays } from '@/practice/progress';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, BreathRow, EmptyState, IconButton, LessonRow, Overline, Screen, Text } from '@/ui';

export default function HistoryScreen() {
  const router = useRouter();
  const back = useBack(routes.me);
  const content = useContent((s) => s.content);
  const entries = useDays((s) => s.entries);
  const days = historyDays(entries, content, dayOf(new Date()));

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.history.title}
        </Text>
      </Arrive>

      {days.length > 0 ? (
        days.map((group, i) => (
          <Arrive key={group.day} index={i + 1} style={styles.day}>
            <Overline tone="muted" accessibilityRole="header">
              {group.label}
            </Overline>
            <View>
              {group.items.map((item) =>
                item.kind === 'move' ? (
                  <LessonRow
                    key={item.key}
                    lesson={item.lesson}
                    minutes={item.minutes}
                    marks={false}
                    onPress={() => router.push(routes.lesson(item.lesson.slug))}
                  />
                ) : (
                  <BreathRow
                    key={item.key}
                    exercise={item.exercise}
                    line={strings.history.breathLine(item.minutes)}
                    onPress={() => router.push(routes.breath(item.exercise.slug))}
                  />
                ),
              )}
            </View>
          </Arrive>
        ))
      ) : (
        <EmptyState sentence={strings.me.nothingYet} aura="candle" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  day: { gap: space.xxs },
});
