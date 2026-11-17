/**
 * Chip: a small pill.
 *   With onPress: a filter that is selected (a gold fill with a hairline) or not (outline).
 *     look="soft": selected is a gold hairline and a faint gold wash instead of a fill (the
 *     feelings of a closing screen, where "Done" is the screen's one gold fill).
 *   Without onPress: a small static label, as in "You'll need".
 */
import { StyleSheet, View } from 'react-native';

import { layout, radius, space, withAlpha } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  look?: 'fill' | 'soft';
};

export function Chip({ label, selected = false, onPress, disabled, look = 'fill' }: ChipProps) {
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
      style={[shape.base, shape.select, selected ? (look === 'soft' ? styles.soft : styles.selected) : styles.unselected]}
    >
      <Text variant="meta" color={selected ? (look === 'soft' ? 'text.primary' : 'text.onAccent') : 'text.secondary'}>
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
    soft: { backgroundColor: withAlpha(color.accent.fill, size.softFill), borderColor: color.accent.gold },
    unselected: { borderColor: color.border.strong },
    static: {
      minHeight: size.chip.static,
      paddingHorizontal: space.md,
      backgroundColor: color.bg.raised,
      borderColor: color.border.subtle,
    },
  }),
);
