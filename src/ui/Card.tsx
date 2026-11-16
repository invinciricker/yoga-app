/**
 * Card: a raised surface with a hairline. Depth is a lighter surface, never a shadow.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius, space } from '@/theme';

import { size } from './sizes';

export type CardProps = {
  children: ReactNode;
  /** Inner padding: 20 (default) or 24. */
  padding?: 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padding = 'lg', style }: CardProps) {
  return <View style={[styles.card, { padding: space[padding] }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.bg.raised,
    borderColor: color.border.subtle,
    borderWidth: size.stroke.hairline,
    borderRadius: radius.lg,
  },
});
