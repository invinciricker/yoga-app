/**
 * QuietPlace: what a tab shows while it has not been built yet: its title and one calm sentence.
 * Only Studio still uses it (its real page arrives in Phase 2).
 */
import { StyleSheet } from 'react-native';

import type { AuraName } from '@/theme';

import { Arrive } from './Arrive';
import { EmptyState } from './EmptyState';
import { Text } from './Text';

export type QuietPlaceProps = { title: string; sentence: string; aura: AuraName };

export function QuietPlace({ title, sentence, aura }: QuietPlaceProps) {
  return (
    <>
      <Arrive index={0}>
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
      </Arrive>
      <Arrive index={1} style={styles.block}>
        <EmptyState sentence={sentence} aura={aura} fill />
      </Arrive>
    </>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1 },
});
