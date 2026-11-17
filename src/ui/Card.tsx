/**
 * Card: a raised surface with a hairline. Depth is a lighter surface, never a shadow.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

import { size } from './sizes';

export type CardProps = {
  children: ReactNode;
  /** Inner padding: 20 (default) or 24; "none" for a card of rows that pad themselves. */
  padding?: 'none' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padding = 'lg', style }: CardProps) {
  const styles = useStyles();
  return <View style={[styles.card, padding !== 'none' && { padding: space[padding] }, style]}>{children}</View>;
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    card: {
      backgroundColor: color.bg.raised,
      borderColor: color.border.subtle,
      borderWidth: size.stroke.hairline,
      borderRadius: radius.lg,
    },
  }),
);
