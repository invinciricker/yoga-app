/**
 * A series: its cover with its name, a few lines about it, then its lessons in order, numbered.
 * The words on the cover use the onCover colours (covers are pictures, the same in both themes).
 * Once begun: a thin progress line and "2 of 7 done" on the cover, a sage tick on the lessons done
 * (LessonRow), and a ghost "Continue" under the description that opens the first lesson not yet
 * done. A finished series says "All 7 done." and offers no button.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { slugsForStaticPages } from '@/content/load';
import { findSeries, lessonsOfSeries, seriesMinutes } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { routes, useBack } from '@/lib/nav';
import { seriesProgress } from '@/practice/progress';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Button,
  Cover,
  DraftChip,
  IconButton,
  LessonRow,
  LoadingPage,
  NotHere,
  Overline,
  ProgressLine,
  RichText,
  Screen,
  size,
  Text,
} from '@/ui';

/** Web preview only: the series pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('series');
}

export default function SeriesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = useBack(routes.practice);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const entries = useDays((s) => s.entries);

  const series = findSeries(content, slug);
  if (!series) {
    if (status === 'loading') return <LoadingPage />;
    return (
      <NotHere
        sentence={strings.series.gone}
        actionLabel={strings.lesson.toPractice}
        onAction={() => router.replace(routes.practice)}
      />
    );
  }
  const lessons = lessonsOfSeries(content, series.slug);
  const progress = seriesProgress(entries, lessons.map((l) => l.slug));
  const next = progress.done > 0 ? progress.next : undefined;

  return (
    <Screen bleed darkTop={size.cover.series}>
      <Cover aura={series.aura} image={series.cover} height={size.cover.series} radius="none" scrim>
        <View style={[styles.coverTop, { top: insets.top + space.md }]}>
          <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
        </View>
        <View style={styles.coverWords}>
          <View style={styles.labels}>
            <Overline tone="cover">{strings.series.facts(lessons.length, seriesMinutes(content, series.slug))}</Overline>
            <DraftChip item={series} onCover />
          </View>
          <Text variant="h1" color="onCover.primary" accessibilityRole="header">
            {series.title}
          </Text>
          <ProgressLine done={progress.done} total={progress.total} />
        </View>
      </Cover>

      <View style={styles.sections}>
        <Arrive index={0} style={styles.intro}>
          {series.body.length > 0 ? (
            <RichText blocks={series.body} ink="text.secondary" />
          ) : (
            <Text variant="bodyLarge" color="text.secondary">
              {series.summary}
            </Text>
          )}
          {next ? <Button kind="ghost" label={strings.series.continue} onPress={() => router.push(routes.lesson(next))} /> : null}
        </Arrive>
        <Arrive index={1}>
          {lessons.map((lesson, i) => (
            <LessonRow
              key={lesson.slug}
              lesson={lesson}
              number={i + 1}
              onPress={() => router.push(routes.lesson(lesson.slug))}
            />
          ))}
        </Arrive>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverTop: { position: 'absolute', left: layout.gutter, right: layout.gutter, flexDirection: 'row' },
  coverWords: { position: 'absolute', left: layout.gutter, right: layout.gutter, bottom: space.xl, gap: space.xs },
  labels: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  sections: { paddingHorizontal: layout.gutter, paddingTop: space.xl, gap: space.xl },
  intro: { gap: space.xl },
});
