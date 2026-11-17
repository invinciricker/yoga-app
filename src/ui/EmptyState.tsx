/**
 * EmptyState: what a list shows when it has nothing: a small disc of light, one calm
 * sentence and, sometimes, one way forward (a button).
 */
import { StyleSheet, View } from 'react-native';

import { space, type AuraName } from '@/theme';

import { Button } from './Button';
import { Cover } from './Cover';
import { size } from './sizes';
import { Text } from './Text';

export type EmptyStateProps = {
  sentence: string;
  aura?: AuraName;
  actionLabel?: string;
  onAction?: () => void;
  /** Takes all the room there is and sits in the middle of it (an empty page). */
  fill?: boolean;
};

export function EmptyState({ sentence, aura = 'candle', actionLabel, onAction, fill = false }: EmptyStateProps) {
  return (
    <View style={[styles.block, fill && styles.fill]}>
      <Cover aura={aura} width={size.thumb} height={size.thumb} radius="pill" />
      <Text variant="bodyLarge" color="text.secondary" center style={styles.sentence}>
        {sentence}
      </Text>
      {actionLabel && onAction ? <Button kind="ghost" label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', justifyContent: 'center', gap: space.xl, paddingVertical: space.xxxl },
  fill: { flex: 1, paddingVertical: space.huge },
  sentence: { maxWidth: size.readWidth },
});
