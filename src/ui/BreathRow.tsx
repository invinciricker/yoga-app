/**
 * BreathRow: a breathing exercise as one line of a list, beside lessons (History): a small round
 * `tide` disc, centred where a lesson's thumbnail sits so the titles line up, the title, and one line
 * ("3 min · Breathe"). The draft chip on a draft. Phase 7.
 */
import { StyleSheet, View } from 'react-native';

import type { BreathExercise } from '../../shared/content-schema';

import { space } from '@/theme';

import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type BreathRowProps = {
  exercise: BreathExercise;
  /** "3 min · Breathe". */
  line: string;
  onPress: () => void;
};

export function BreathRow({ exercise, line, onPress }: BreathRowProps) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${exercise.title}, ${line}`} style={styles.row}>
      <View style={styles.discBox}>
        <Cover aura="tide" width={size.shelfDisc} height={size.shelfDisc} radius="pill" />
      </View>
      <View style={styles.words}>
        <Text variant="title" numberOfLines={2}>
          {exercise.title}
        </Text>
        <Text variant="meta" color="text.muted" tabular numberOfLines={1}>
          {line}
        </Text>
        <DraftChip item={exercise} style={styles.draft} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: size.rowPad },
  discBox: { width: size.thumb, height: size.thumb, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, gap: space.xxs },
  draft: { marginTop: space.xxs },
});
