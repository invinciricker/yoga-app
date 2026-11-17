/**
 * Practice: every lesson and series. A search, a row of filters, the series, then all lessons.
 * With a search or a filter active, the series step aside and the list shows what matches.
 * ("Saved" joins the filters in Phase 3.)
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { searchLessons, type LessonFilter } from '@/content/selectors';
import { useContent } from '@/content/store';
import { routes } from '@/lib/nav';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Chip,
  EmptyState,
  LessonRow,
  OfflineNote,
  Screen,
  SearchField,
  SectionHeader,
  SeriesCard,
  size,
  Skeleton,
  Text,
} from '@/ui';

const filters: { key: LessonFilter; label: string }[] = [
  { key: 'all', label: strings.practice.filterAll },
  { key: 'gentle', label: strings.levels.gentle },
  { key: 'steady', label: strings.levels.steady },
  { key: 'strong', label: strings.levels.strong },
  { key: 'short', label: strings.practice.filterShort },
];

export default function PracticeScreen() {
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const refreshing = useContent((s) => s.refreshing);
  const refresh = useContent((s) => s.refresh);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LessonFilter>('all');
  const searching = query.trim() !== '' || filter !== 'all';
  const lessons = searchLessons(content, query, filter);
  const clear = () => {
    setQuery('');
    setFilter('all');
  };

  return (
    <Screen tabBar contentStyle={styles.sections} refreshing={refreshing} onRefresh={refresh}>
      <Arrive index={0} style={styles.header}>
        <View style={styles.title}>
          <Text variant="display" accessibilityRole="header">
            {strings.practice.title}
          </Text>
          {status === 'stale' ? <OfflineNote /> : null}
        </View>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={strings.practice.search}
          clearLabel={strings.practice.clearSearch}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.bleedRight}
          contentContainerStyle={styles.chips}
        >
          {filters.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </Arrive>

      {status === 'loading' ? (
        <View style={styles.block}>
          <Skeleton height={size.seriesCard.large} radius="xl" />
          <Skeleton height={size.thumb} radius="md" />
          <Skeleton height={size.thumb} radius="md" />
        </View>
      ) : null}

      {!searching && content.series.length > 0 ? (
        <Arrive index={1} style={styles.block}>
          <SectionHeader title={strings.practice.series} />
          {content.series.map((series, i) => (
            <SeriesCard
              key={series.slug}
              series={series}
              large={i === 0}
              onPress={() => router.push(routes.series(series.slug))}
            />
          ))}
        </Arrive>
      ) : null}

      {lessons.length > 0 ? (
        <Arrive index={2} style={styles.list}>
          <SectionHeader title={strings.practice.allLessons} note={strings.practice.lessonCount(lessons.length)} />
          <View>
            {lessons.map((lesson) => (
              <LessonRow key={lesson.slug} lesson={lesson} onPress={() => router.push(routes.lesson(lesson.slug))} />
            ))}
          </View>
        </Arrive>
      ) : searching ? (
        <EmptyState sentence={strings.practice.noMatch} actionLabel={strings.common.clear} onAction={clear} aura="forest" />
      ) : status !== 'loading' ? (
        <EmptyState sentence={strings.practice.empty} aura="forest" />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.lg },
  title: { gap: space.xs },
  bleedRight: { marginRight: -layout.gutter },
  // A little room above and below, so the whole 48 of each chip can be touched.
  chips: { gap: space.xs, paddingRight: layout.gutter, paddingVertical: space.xxs },
  block: { gap: space.md },
  list: { gap: space.xs },
});
