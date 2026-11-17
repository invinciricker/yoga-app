/**
 * AnswerChoice: one large answer on a closing screen ("Just right" / "A good match for today").
 * Chosen: a gold hairline, a faint gold wash and a check (the "After practice" mockup). One of a
 * group is chosen at a time: the screen keeps which.
 */
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius, space, withAlpha } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type AnswerChoiceProps = {
  title: string;
  line: string;
  selected: boolean;
  onPress: () => void;
};

export function AnswerChoice({ title, line, selected, onPress }: AnswerChoiceProps) {
  const { color } = useTheme();
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${line}`}
      accessibilityState={{ checked: selected }}
      style={[styles.choice, selected ? styles.chosen : styles.open]}
    >
      <View style={styles.words}>
        <Text variant="title">{title}</Text>
        <Text variant="meta" color="text.muted">
          {line}
        </Text>
      </View>
      {selected ? <Check size={size.icon.lg} strokeWidth={size.tickStroke} color={color.accent.gold} /> : null}
    </PressableScale>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    choice: {
      minHeight: size.choice,
      borderRadius: radius.lg,
      borderWidth: size.stroke.hairline,
      paddingHorizontal: space.lg,
      paddingVertical: space.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    open: { backgroundColor: color.bg.raised, borderColor: color.border.subtle },
    chosen: { backgroundColor: withAlpha(color.accent.fill, size.softFill), borderColor: color.accent.gold },
    words: { flex: 1, gap: space.xxs / 2 },
  }),
);
