/**
 * One of Maria's notes or tips: a reading page. The kind and the date, the title, the photo if there
 * is one, the text, and at the end the lessons Maria suggests ("Try this").
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { dayLabel } from '@/content/labels';
import { slugsForStaticPages } from '@/content/load';
import { findLesson, findNote } from '@/content/selectors';
import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Cover, DraftChip, IconButton, LessonRow, LoadingPage, NotHere, Overline, RichText, Screen, SectionHeader, Text } from '@/ui';

/**
 * Web preview only: the pages to prepare when the website is built.
 * "journal" is the key of Maria's notes in content.json: a permanent data name (docs/V2.md).
 */
export function generateStaticParams() {
  return slugsForStaticPages('journal');
}

export default function NoteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const back = useBack(routes.notes);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);

  const entry = findNote(content, slug);
  if (!entry) {
    if (status === 'loading') return <LoadingPage />;
    return (
      <NotHere
        sentence={strings.notes.gone}
        actionLabel={strings.notes.toNotes}
        onAction={() => router.replace(routes.notes)}
      />
    );
  }
  const kind = entry.kind === 'tip' ? strings.notes.tip : strings.notes.note;
  // A lesson that has been taken down since is simply not listed.
  const related = entry.related.map((s) => findLesson(content, s)).filter((l) => l !== undefined);

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.title}>
          <View style={styles.labels}>
            <Overline tone="area" area="move">{`${kind} · ${dayLabel(entry.published)}`}</Overline>
            <DraftChip item={entry} />
          </View>
          <Text variant="h1" accessibilityRole="header">
            {entry.title}
          </Text>
        </View>
      </Arrive>

      {entry.cover ? (
        <Arrive index={1}>
          <Cover aura={entry.aura} image={entry.cover} aspect={entry.cover.w / entry.cover.h} radius="lg" />
        </Arrive>
      ) : null}

      <Arrive index={2}>
        {entry.body.length > 0 ? (
          <RichText blocks={entry.body} />
        ) : (
          <Text variant="bodyLarge">{entry.summary}</Text>
        )}
      </Arrive>

      {related.length > 0 ? (
        <Arrive index={3} style={styles.related}>
          <SectionHeader title={strings.notes.tryThis} />
          <View>
            {related.map((lesson) => (
              <LessonRow key={lesson.slug} lesson={lesson} onPress={() => router.push(routes.lesson(lesson.slug))} />
            ))}
          </View>
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  title: { gap: space.sm },
  labels: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  related: { gap: space.xs },
});
