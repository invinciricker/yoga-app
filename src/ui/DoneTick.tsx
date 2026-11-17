/**
 * DoneTick: the small round sage tick of a lesson done (rows, Today's big card, the series page).
 * Sage means done (docs/DESIGN.md). The words around it say "done" to screen readers, so the
 * tick itself is not read.
 */
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';

export function DoneTick() {
  const { color } = useTheme();
  return (
    <View
      style={[styles.tick, { borderColor: color.support.sage }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Check size={size.tickIcon} strokeWidth={size.tickStroke} color={color.support.sage} />
    </View>
  );
}

const styles = StyleSheet.create({
  tick: {
    width: size.tick,
    height: size.tick,
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
