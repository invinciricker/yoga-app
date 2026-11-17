/**
 * LessonRow: a lesson as one line of a list: a small cover, the title, and
 * "12 min · Gentle · Hips". In a series it is numbered (a gold numeral on the left).
 *
 * On the right, the person's own marks: the sage tick when the lesson was done, else the gold
 * bookmark when it is saved (the tick wins when both). History leaves them out (`marks={false}`):
 * everything there is done.
 */
import { Bookmark } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Lesson } from '../../shared/content-schema';

import { lessonMetaLong } from '@/content/labels';
import { useDays } from '@/day/store';
import { isDone } from '@/practice/progress';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { space } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { Cover } from './Cover';
import { DoneTick } from './DoneTick';
import { DraftChip } from './DraftChip';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type LessonRowProps = {
  lesson: Lesson;
  onPress: () => void;
  /** Its place in a series: 1, 2, 3… */
  number?: number;
  /** The minutes to show, when not the lesson's own (History shows the minutes recorded). */
  minutes?: number;
  /** The tick and the bookmark on the right. On by default. */
  marks?: boolean;
};

export function LessonRow({ lesson, onPress, number, minutes, marks = true }: LessonRowProps) {
  const { color } = useTheme();
  const done = useDays((s) => marks && isDone(s.entries, lesson.slug));
  const saved = usePractice((s) => marks && s.saved.includes(lesson.slug));
  const meta = lessonMetaLong(minutes === undefined ? lesson : { ...lesson, minutes });
  const spoken = [
    `${number ? `${number}. ` : ''}${lesson.title}`,
    meta,
    done ? strings.lesson.isDone : '',
    saved ? strings.lesson.isSaved : '',
  ];
  return (
    <PressableScale onPress={onPress} accessibilityLabel={spoken.filter(Boolean).join(', ')} style={styles.row}>
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
      {done ? (
        <DoneTick />
      ) : saved ? (
        <Bookmark
          size={size.icon.lg}
          strokeWidth={size.stroke.regular}
          color={color.accent.gold}
          fill={color.accent.gold}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
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
