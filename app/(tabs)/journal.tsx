/**
 * Journal: Maria's tips (short advice) and notes (longer thoughts), newest first.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { journalEntries } from '@/content/selectors';
import { useContent } from '@/content/store';
import { routes } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Chip, EmptyState, JournalCard, OfflineNote, Screen, size, Skeleton, Text } from '@/ui';

type Kind = 'all' | 'tip' | 'note';
const filters: { key: Kind; label: string }[] = [
  { key: 'all', label: strings.journal.filterAll },
  { key: 'tip', label: strings.journal.filterTips },
  { key: 'note', label: strings.journal.filterNotes },
];

export default function JournalScreen() {
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const refreshing = useContent((s) => s.refreshing);
  const refresh = useContent((s) => s.refresh);

  const [kind, setKind] = useState<Kind>('all');
  const entries = journalEntries(content, kind);

  return (
    <Screen tabBar contentStyle={styles.sections} refreshing={refreshing} onRefresh={refresh}>
      <Arrive index={0} style={styles.header}>
        <View style={styles.title}>
          <Text variant="display" accessibilityRole="header">
            {strings.journal.title}
          </Text>
          {status === 'stale' ? <OfflineNote /> : null}
        </View>
        <View style={styles.chips}>
          {filters.map((f) => (
            <Chip key={f.key} label={f.label} selected={kind === f.key} onPress={() => setKind(f.key)} />
          ))}
        </View>
      </Arrive>

      {status === 'loading' ? (
        <View style={styles.entries}>
          <Skeleton height={size.cover.note} />
          <Skeleton height={size.thumb * 2} />
        </View>
      ) : entries.length > 0 ? (
        <Arrive index={1} style={styles.entries}>
          {entries.map((entry) => (
            <JournalCard key={entry.slug} entry={entry} onPress={() => router.push(routes.entry(entry.slug))} />
          ))}
        </Arrive>
      ) : kind !== 'all' && content.journal.length > 0 ? (
        <EmptyState
          sentence={strings.journal.noMatch}
          actionLabel={strings.common.clear}
          onAction={() => setKind('all')}
        />
      ) : (
        <EmptyState sentence={strings.journal.empty} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.lg },
  title: { gap: space.xs },
  chips: { flexDirection: 'row', gap: space.xs, paddingVertical: space.xxs },
  entries: { gap: space.xxl },
});
