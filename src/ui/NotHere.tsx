/**
 * NotHere: a calm page for an address that leads to nothing any more (a lesson Maria took down,
 * an old link): one sentence and a button to a place that exists.
 * LoadingPage: the same page while the content is still arriving for the first time.
 */
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme';

import { EmptyState } from './EmptyState';
import { Screen } from './Screen';
import { size } from './sizes';
import { Skeleton } from './Skeleton';

export type NotHereProps = { sentence: string; actionLabel: string; onAction: () => void };

export function NotHere({ sentence, actionLabel, onAction }: NotHereProps) {
  return (
    <Screen scroll={false}>
      <EmptyState sentence={sentence} actionLabel={actionLabel} onAction={onAction} aura="moss" fill />
    </Screen>
  );
}

export function LoadingPage() {
  return (
    <Screen scroll={false}>
      <View style={styles.shapes}>
        <Skeleton height={size.cover.series} radius="xl" />
        <Skeleton height={space.xxxl} width="70%" radius="md" />
        <Skeleton height={space.xl} radius="md" />
        <Skeleton height={space.xl} width="85%" radius="md" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shapes: { gap: space.lg },
});
