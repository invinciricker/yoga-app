/**
 * ProgressLine: how far into a series, drawn over its cover (a series card, the top of a series
 * page): a thin line and "2 of 7 done". A finished series says "All 7 done." instead.
 * Nothing at all for a series not begun. Words and line use the onCover colours.
 */
import { StyleSheet, View } from 'react-native';

import { strings } from '@/strings';
import { radius, space, withAlpha } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type ProgressLineProps = { done: number; total: number };

export function ProgressLine({ done, total }: ProgressLineProps) {
  const { onCover } = useTheme();
  if (done <= 0 || total <= 0) return null;
  if (done >= total) {
    return (
      <Text variant="meta" color="onCover.secondary">
        {strings.series.allDone(total)}
      </Text>
    );
  }
  return (
    <View style={styles.row}>
      <View
        style={[styles.track, { backgroundColor: withAlpha(onCover.primary, size.progressTrack) }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.fill, { width: `${(done / total) * 100}%`, backgroundColor: onCover.accent }]} />
      </View>
      <Text variant="meta" color="onCover.secondary" tabular>
        {strings.series.progress(done, total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { flex: 1, height: size.progress, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
