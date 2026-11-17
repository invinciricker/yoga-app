/**
 * A series: its cover with its name, a few lines about it, then its lessons in order, numbered.
 * (From Phase 3: a tick on the lessons done, and a "Continue" button.)
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { slugsForStaticPages } from '@/content/load';
import { findSeries, lessonsOfSeries, seriesMinutes } from '@/content/selectors';
import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { Arrive, Cover, DraftChip, IconButton, LessonRow, LoadingPage, NotHere, Overline, RichText, Screen, size, Text } from '@/ui';

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

  return (
    <Screen bleed>
      <Cover aura={series.aura} image={series.cover} height={size.cover.series} radius="none" scrim>
        <View style={[styles.coverTop, { top: insets.top + space.md }]}>
          <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
        </View>
        <View style={styles.coverWords}>
          <View style={styles.labels}>
            <Overline>{strings.series.facts(lessons.length, seriesMinutes(content, series.slug))}</Overline>
            <DraftChip item={series} />
          </View>
          <Text variant="h1" accessibilityRole="header">
            {series.title}
          </Text>
        </View>
      </Cover>

      <View style={styles.sections}>
        <Arrive index={0}>
          {series.body.length > 0 ? (
            <RichText blocks={series.body} ink="text.secondary" />
          ) : (
            <Text variant="bodyLarge" color="text.secondary">
              {series.summary}
            </Text>
          )}
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
});
