/**
 * Fact: one small fact about a lesson, a small icon and a few words ("12 min", "Gentle").
 * The icon is gold, or the colour of the area it sits in (ink="area.move" in Practice).
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { inkColors, space, type InkColor } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type FactProps = { icon: LucideIcon; label: string; ink?: InkColor };

export function Fact({ icon: Icon, label, ink = 'accent.gold' }: FactProps) {
  const { color } = useTheme();
  return (
    <View style={styles.fact}>
      <Icon size={size.icon.sm} strokeWidth={size.stroke.regular} color={inkColors(color)[ink]} />
      <Text variant="meta" color="text.secondary" tabular>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
