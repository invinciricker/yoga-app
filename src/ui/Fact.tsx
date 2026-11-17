/**
 * Fact: one small fact about a lesson, a gold icon and a few words ("12 min", "Gentle").
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme';

import { size } from './sizes';
import { Text } from './Text';

export type FactProps = { icon: LucideIcon; label: string };

export function Fact({ icon: Icon, label }: FactProps) {
  return (
    <View style={styles.fact}>
      <Icon size={size.icon.sm} strokeWidth={size.stroke.regular} color={color.accent.gold} />
      <Text variant="meta" color="text.secondary" tabular>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
