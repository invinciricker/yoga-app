/**
 * Dots: the week as rows of dots, on a page of a guided journal (docs/phases/phase-6.md, 1.5).
 *
 *   This week                                  ← the question, in title
 *   A full dot for each day it happened…       ← its hint, in meta
 *   Did it      ●  ●  ·  ●  ○  ●  ●   5 of 7   ← a yes or no row: its count on the right
 *   Automatic   •  ●  ○  ●  ○  ●  ●            ← a scale: the bigger the dot, the higher
 *                                  ‾
 *                                  the page on screen, marked by a short line under it
 *
 * The labels sit in a column as wide as the longest label of this prompt (measured once), and wrap
 * when the text is large. When even that leaves too little room, each label goes above its dots:
 * the cells never leave the screen. Only the area's colour and the text colours; nothing moves. A
 * screen reader reads each row as one sentence (dotsSentence in src/journal/dots.ts).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { dotSize, dotsSentence, yesCount, type DotsRow } from '@/journal/dots';
import { strings } from '@/strings';
import { radius, space, type Area } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type DotsProps = {
  ask: string;
  hint?: string;
  rows: DotsRow[];
  /** The colour of the dots: the area the page belongs to. */
  area?: Area;
};

export function Dots({ ask, hint, rows, area = 'write' }: DotsProps) {
  const [width, setWidth] = useState(0);
  // The natural widths of the labels and of the counts, measured once off screen.
  const [labels, setLabels] = useState<Record<number, number>>({});
  const [counts, setCounts] = useState<Record<number, number>>({});
  const countTexts = rows.map((row) => {
    const yes = yesCount(row);
    return yes === undefined ? undefined : strings.journal.yesCount(yes, row.values.length);
  });
  const hasCounts = countTexts.some((c) => c !== undefined);
  const cellsMin = Math.max(0, ...rows.map((r) => r.values.length)) * size.dotCell;
  const countWidth = hasCounts ? Math.max(0, ...Object.values(counts)) : 0;
  const longest = Math.max(0, ...Object.values(labels));
  const room = width - cellsMin - countWidth - space.sm * (hasCounts ? 2 : 1);
  const labelWidth = Math.min(longest, room);
  const stacked = width > 0 && labelWidth < Math.min(longest, size.dotLabelMin);

  return (
    <View style={styles.prompt}>
      <View style={styles.question}>
        <Text variant="title" accessibilityRole="header">
          {ask}
        </Text>
        {hint ? (
          <Text variant="meta" color="text.secondary">
            {hint}
          </Text>
        ) : null}
      </View>

      <View style={styles.rows} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {/* Off screen: each label and count on one line, to find the widest. */}
        <View style={styles.measure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
          {rows.map((row, i) => (
            <Text key={`l${i}`} variant="meta" numberOfLines={1} onLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.layout.width) + size.measureSlack;
              setLabels((all) => (all[i] === w ? all : { ...all, [i]: w }));
            }}>
              {row.label}
            </Text>
          ))}
          {countTexts.map((text, i) =>
            text === undefined ? null : (
              <Text key={`c${i}`} variant="meta" tabular numberOfLines={1} onLayout={(e) => {
                const w = Math.ceil(e.nativeEvent.layout.width) + size.measureSlack;
                setCounts((all) => (all[i] === w ? all : { ...all, [i]: w }));
              }}>
                {text}
              </Text>
            ),
          )}
        </View>

        {rows.map((row, i) => (
          <View key={i} style={stacked ? styles.stackedRow : styles.row} accessible accessibilityLabel={dotsSentence(row)}>
            <Text variant="meta" color="text.secondary" style={stacked ? undefined : { width: labelWidth > 0 ? labelWidth : undefined }}>
              {row.label}
            </Text>
            <View style={styles.line}>
              <View style={styles.cells}>
                {row.values.map((value, c) => (
                  <Cell
                    key={c}
                    fraction={dotSize(row.question, value)}
                    no={row.question?.kind === 'yesno' && value === false}
                    here={c === row.here}
                    area={area}
                  />
                ))}
              </View>
              {hasCounts ? (
                <Text variant="meta" color="text.secondary" tabular style={[styles.count, { width: countWidth || undefined }]}>
                  {countTexts[i] ?? ''}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * One square with its dot: a disc of the area's colour (a "No" is small and muted), or an empty
 * ring for no answer; a short line under the page on screen.
 */
function Cell({ fraction, no, here, area }: { fraction: number; no: boolean; here: boolean; area: Area }) {
  const { color } = useTheme();
  const side = size.dotCell;
  const dot = fraction > 0 ? side * fraction : side * size.dotRing;
  return (
    <View style={styles.cell}>
      <View style={styles.square}>
        <View
          style={
            fraction > 0
              ? { width: dot, height: dot, borderRadius: radius.pill, backgroundColor: no ? color.text.muted : color.area[area] }
              : { width: dot, height: dot, borderRadius: radius.pill, borderWidth: size.stroke.hairline, borderColor: color.border.strong }
          }
        />
      </View>
      <View style={[styles.mark, here ? { backgroundColor: color.text.muted } : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { gap: space.sm },
  question: { gap: space.xxs },
  rows: { gap: space.xxs },
  measure: { position: 'absolute', left: 0, top: 0, opacity: 0, alignItems: 'flex-start' },
  row: { minHeight: size.dotRow, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stackedRow: { minHeight: size.dotRow, gap: space.xxs },
  line: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cells: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', gap: space.xxs / 2 },
  square: { width: size.dotCell, height: size.dotCell, alignItems: 'center', justifyContent: 'center' },
  mark: { width: size.dotCell * size.dotMark, height: size.stroke.active, borderRadius: radius.pill },
  count: { textAlign: 'right' },
});
