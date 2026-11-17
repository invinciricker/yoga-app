/**
 * Skeleton: a quiet shape that holds the place of something still loading.
 * Seen only on the very first launch, before any content has been saved on the phone.
 * It does not shimmer: the only looping animation in the app is the candlelight.
 */
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { radius as radii } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

export type SkeletonProps = {
  height: number;
  /** Full width when left out. */
  width?: DimensionValue;
  radius?: keyof typeof radii;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ height, width = '100%', radius = 'lg', style }: SkeletonProps) {
  const styles = useStyles();
  return (
    <View
      style={[styles.shape, { height, width, borderRadius: radii[radius] }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    shape: { backgroundColor: color.bg.raised },
  }),
);
