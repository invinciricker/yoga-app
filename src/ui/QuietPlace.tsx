/**
 * QuietPlace: what a tab shows while it has nothing yet: its title, a small disc of light
 * and one calm sentence. Used by Practice, Journal and Studio in Phase 0.
 * (Phase 1 brings the real EmptyState part and the real screens.)
 */
import { StyleSheet } from 'react-native';

import { space, type AuraName } from '@/theme';

import { Arrive } from './Arrive';
import { Cover } from './Cover';
import { size } from './sizes';
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
        <Cover aura={aura} width={size.thumb} height={size.thumb} radius="pill" />
        <Text variant="bodyLarge" color="text.secondary" center style={styles.sentence}>
          {sentence}
        </Text>
      </Arrive>
    </>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl, paddingVertical: space.huge },
  sentence: { maxWidth: size.readWidth },
});
