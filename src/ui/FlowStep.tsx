/**
 * FlowStep: one pose of "The flow": when it starts in the video (in gold), its name,
 * and a short note. When it can be pressed, it moves the video to that moment.
 */
import { StyleSheet, View } from 'react-native';

import { color, space, type } from '@/theme';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type FlowStepProps = {
  name: string;
  note?: string;
  /** "3:45". Left out for a lesson without times. */
  at?: string;
  /** Keeps the names lined up when some steps of the list have a time and others do not. */
  timeColumn?: boolean;
  /** The last step has no line under it. */
  last?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function FlowStep({ name, note, at, timeColumn = false, last = false, onPress, accessibilityHint }: FlowStepProps) {
  const row = (
    <View style={[styles.row, !last && styles.line]}>
      {timeColumn ? (
        <Text variant="meta" color="accent.gold" tabular style={styles.time}>
          {at ?? ''}
        </Text>
      ) : null}
      <View style={styles.words}>
        <Text variant="title">{name}</Text>
        {note ? (
          <Text variant="meta" color="text.muted">
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return row;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={[at, name, note].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
    >
      {row}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: size.flowPad },
  line: { borderBottomWidth: size.stroke.hairline, borderBottomColor: color.border.subtle },
  // The time sits on the same line as the name (22 high), a little smaller.
  time: { width: size.flowTime, lineHeight: type.title.lineHeight },
  words: { flex: 1, gap: space.xxs / 2 },
});
