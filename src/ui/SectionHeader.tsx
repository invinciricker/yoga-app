/**
 * SectionHeader: the title of a section, with an optional small action on the right ("See all").
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { layout, space } from '@/theme';

import { Text } from './Text';

export type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text variant="h3" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text variant="label" color="accent.gold">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  title: { flexShrink: 1 },
  action: { minHeight: layout.touchMin, minWidth: layout.touchMin, justifyContent: 'center', alignItems: 'flex-end' },
});
