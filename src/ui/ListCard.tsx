/**
 * ListCard: one Card holding rows, with a hairline between them (never above the first or below
 * the last). Used by the classes on Maria's page and by the settings in You.
 * Rows that are null or false are left out, so a missing row never leaves a lonely hairline.
 */
import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { size } from './sizes';

export type ListCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ListCard({ children, style }: ListCardProps) {
  const styles = useStyles();
  const rows = Children.toArray(children);
  if (rows.length === 0) return null;
  return (
    <Card padding="none" style={[styles.card, style]}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.hairline} /> : null}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    // A pressed row stays inside the rounded corners.
    card: { overflow: 'hidden' },
    hairline: { height: size.stroke.hairline, backgroundColor: color.border.subtle },
  }),
);
