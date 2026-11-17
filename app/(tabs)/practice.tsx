/**
 * Practice: every lesson and series. A search, a row of filters, the series, then all lessons,
 * and at the bottom the three newest of Maria's notes.
 * With a search or a filter active, the series and the notes step aside and the list shows what
 * matches.
 *
 * docs/V2.md, limit 3: the search field and the filters appear only from 8 lessons. "Saved" comes
 * second in the filters, and only once something is saved; with fewer than 8 lessons, saved lessons
 * are found in You → Saved. A series begun shows its progress on its card.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FILTERS_FROM, lessonsOfSeries, notesOfKind, searchLessons, type LessonFilter } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { routes } from '@/lib/nav';
import { savedLessons, seriesProgress } from '@/practice/progress';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Chip,
  EmptyState,
  LessonRow,
  NoteCard,
  OfflineNote,
  Screen,
  SearchField,
  SectionHeader,
  SeriesCard,
  size,
  Skeleton,
  Text,
} from '@/ui';

/** How many of Maria's notes the bottom of Practice shows; "See all" leads to the rest. */
const NOTES_SHOWN = 3;

const filters: { key: LessonFilter; label: string }[] = [
  { key: 'all', label: strings.practice.filterAll },
  { key: 'saved', label: strings.practice.filterSaved },
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
  const entries = useDays((s) => s.entries);
  const saved = usePractice((s) => s.saved);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LessonFilter>('all');
  // No search and no filter on a short list (docs/V2.md, limit 3).
  const tools = content.lessons.length >= FILTERS_FROM;
  const anySaved = savedLessons(content, saved).length > 0;
  const shownFilters = filters.filter((f) => f.key !== 'saved' || anySaved || filter === 'saved');
  const activeQuery = tools ? query : '';
  const activeFilter = tools ? filter : 'all';
  const searching = activeQuery.trim() !== '' || activeFilter !== 'all';
  const lessons = searchLessons(content, activeQuery, activeFilter, saved);
  const notes = notesOfKind(content).slice(0, NOTES_SHOWN);
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
        {tools ? (
          <>
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
              {shownFilters.map((f) => (
                <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
              ))}
            </ScrollView>
          </>
        ) : null}
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
              progress={seriesProgress(entries, lessonsOfSeries(content, series.slug).map((l) => l.slug))}
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
      ) : activeFilter === 'saved' && activeQuery.trim() === '' ? (
        <EmptyState sentence={strings.practice.savedEmpty} actionLabel={strings.common.clear} onAction={clear} aura="forest" />
      ) : searching ? (
        <EmptyState sentence={strings.practice.noMatch} actionLabel={strings.common.clear} onAction={clear} aura="forest" />
      ) : status !== 'loading' ? (
        <EmptyState sentence={strings.practice.empty} aura="forest" />
      ) : null}

      {!searching && notes.length > 0 ? (
        <Arrive index={3} style={styles.block}>
          <SectionHeader
            title={strings.practice.notes(content.site.teacherFirstName)}
            actionLabel={strings.common.seeAll}
            onAction={() => router.push(routes.notes)}
          />
          <View style={styles.notes}>
            {notes.map((entry) => (
              <NoteCard key={entry.slug} entry={entry} onPress={() => router.push(routes.note(entry.slug))} />
            ))}
          </View>
        </Arrive>
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
  notes: { gap: space.xxl },
});
