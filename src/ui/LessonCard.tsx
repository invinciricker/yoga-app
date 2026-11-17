/**
 * LessonCard: a lesson as a tall card, 200 wide, in a row that scrolls sideways
 * ("New from Maria" on Today).
 */
import { StyleSheet, View } from 'react-native';

import type { Lesson } from '../../shared/content-schema';

import { lessonMeta } from '@/content/labels';
import { layout, space } from '@/theme';

import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type LessonCardProps = { lesson: Lesson; onPress: () => void };

export function LessonCard({ lesson, onPress }: LessonCardProps) {
  const meta = lessonMeta(lesson);
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${lesson.title}, ${meta}`} style={styles.card}>
      <Cover aura={lesson.aura} image={lesson.cover} height={size.lessonCard.cover} radius="lg">
        <DraftChip item={lesson} onCover style={styles.draft} />
      </Cover>
      <View style={styles.words}>
        <Text variant="title" numberOfLines={2}>
          {lesson.title}
        </Text>
        <Text variant="meta" color="text.muted" tabular>
          {meta}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { width: size.lessonCard.width, gap: layout.cardGap },
  words: { gap: space.xxs },
  draft: { position: 'absolute', top: space.sm, left: space.sm },
});
