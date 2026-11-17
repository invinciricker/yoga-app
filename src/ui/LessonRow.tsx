/**
 * LessonRow: a lesson as one line of a list: a small cover, the title, and
 * "12 min · Gentle · Hips". In a series it is numbered (a gold numeral on the left).
 */
import { StyleSheet, View } from 'react-native';

import type { Lesson } from '../../shared/content-schema';

import { lessonMetaLong } from '@/content/labels';
import { space } from '@/theme';

import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type LessonRowProps = {
  lesson: Lesson;
  onPress: () => void;
  /** Its place in a series: 1, 2, 3… */
  number?: number;
};

export function LessonRow({ lesson, onPress, number }: LessonRowProps) {
  const meta = lessonMetaLong(lesson);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${number ? `${number}. ` : ''}${lesson.title}, ${meta}`}
      style={styles.row}
    >
      {number ? (
        <Text variant="h3" color="accent.gold" style={styles.number}>
          {number}
        </Text>
      ) : null}
      <Cover aura={lesson.aura} image={lesson.cover} width={size.thumb} height={size.thumb} radius="md" />
      <View style={styles.words}>
        <Text variant="title" numberOfLines={2}>
          {lesson.title}
        </Text>
        <Text variant="meta" color="text.muted" tabular numberOfLines={1}>
          {meta}
        </Text>
        <DraftChip item={lesson} style={styles.draft} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: size.rowPad },
  // "Lining" figures: the old-style 1 of this typeface looks like a capital I.
  number: { minWidth: space.xl, textAlign: 'center', fontVariant: ['lining-nums', 'tabular-nums'] },
  words: { flex: 1, gap: space.xxs },
  draft: { marginTop: space.xxs },
});
