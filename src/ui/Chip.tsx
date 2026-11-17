/**
 * Chip: a small pill.
 *   With onPress: a filter that is selected (a gold fill with a hairline) or not (outline).
 *   Without onPress: a small static label, as in "You'll need".
 */
import { StyleSheet, View } from 'react-native';

import { layout, radius, space } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function Chip({ label, selected = false, onPress, disabled }: ChipProps) {
  const styles = useStyles();
  if (!onPress) {
    return (
      <View style={[shape.base, styles.static]}>
        <Text variant="meta" color="text.secondary">
          {label}
        </Text>
      </View>
    );
  }
  // The pill is 40 high; hitSlop makes the touch area 48.
  const slop = (layout.touchMin - size.chip.select) / 2;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: slop, bottom: slop }}
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: !!disabled }}
      style={[shape.base, shape.select, selected ? styles.selected : styles.unselected]}
    >
      <Text variant="meta" color={selected ? 'text.onAccent' : 'text.secondary'}>
        {label}
      </Text>
    </PressableScale>
  );
}

const shape = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  select: { minHeight: size.chip.select, minWidth: layout.touchMin, paddingHorizontal: space.md },
});

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    selected: { backgroundColor: color.accent.fill, borderColor: color.accent.fillBorder },
    unselected: { borderColor: color.border.strong },
    static: {
      minHeight: size.chip.static,
      paddingHorizontal: space.md,
      backgroundColor: color.bg.raised,
      borderColor: color.border.subtle,
    },
  }),
);
