/**
 * ProgressLine: how far into a series, drawn over its cover (a series card, the top of a series
 * page): a thin line and "2 of 7 done". A finished series says "All 7 done." instead.
 * Nothing at all for a series not begun. Words and line use the onCover colours.
 * A guided journal gives its own words ("Page 6 of 28", "28 pages, and 4 more") with `label`.
 */
import { StyleSheet, View } from 'react-native';

import { strings } from '@/strings';
import { radius, space, withAlpha } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type ProgressLineProps = {
  done: number;
  total: number;
  /** Words in place of "2 of 7 done" (and of "All 7 done."). */
  label?: string;
};

export function ProgressLine({ done, total, label }: ProgressLineProps) {
  const { onCover } = useTheme();
  // A series not begun shows nothing; a journal begun shows its words from its first page on.
  if (total <= 0 || (done <= 0 && label === undefined)) return null;
  if (done >= total && label === undefined) {
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
        <View style={[styles.fill, { width: `${Math.min(1, done / total) * 100}%`, backgroundColor: onCover.accent }]} />
      </View>
      <Text variant="meta" color="onCover.secondary" tabular>
        {label ?? strings.series.progress(done, total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { flex: 1, height: size.progress, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
