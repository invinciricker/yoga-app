/**
 * You → Saved: the lessons the person saved with the bookmark, the most recently saved first.
 * A saved lesson no longer in the content is simply left out.
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { savedLessons } from '@/practice/progress';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, EmptyState, IconButton, LessonRow, Screen, Text } from '@/ui';

export default function SavedScreen() {
  const router = useRouter();
  const back = useBack(routes.me);
  const content = useContent((s) => s.content);
  const saved = usePractice((s) => s.saved);
  const lessons = savedLessons(content, saved);

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.saved.title}
        </Text>
      </Arrive>

      {lessons.length > 0 ? (
        <Arrive index={1}>
          <View>
            {lessons.map((lesson) => (
              <LessonRow key={lesson.slug} lesson={lesson} onPress={() => router.push(routes.lesson(lesson.slug))} />
            ))}
          </View>
        </Arrive>
      ) : (
        <EmptyState sentence={strings.practice.savedEmpty} aura="forest" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
});
