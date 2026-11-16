/**
 * Chip: a small pill.
 *   With onPress: a filter that is selected (gold) or not (outline).
 *   Without onPress: a small static label, as in "You'll need".
 */
import { StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '@/theme';

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
  if (!onPress) {
    return (
      <View style={[styles.base, styles.static]}>
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
      style={[styles.base, styles.select, selected ? styles.selected : styles.unselected]}
    >
      <Text variant="meta" color={selected ? 'text.onAccent' : 'text.secondary'}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  select: { minHeight: size.chip.select, minWidth: layout.touchMin, paddingHorizontal: space.md },
  selected: { backgroundColor: color.accent.gold, borderColor: color.accent.gold },
  unselected: { borderColor: color.border.strong },
  static: {
    minHeight: size.chip.static,
    paddingHorizontal: space.md,
    backgroundColor: color.bg.raised,
    borderColor: color.border.subtle,
  },
});
