/**
 * Notes from Maria: her tips (short advice) and notes (longer thoughts), newest first.
 * Opened from the bottom of Practice ("See all"). It was the "Journal" tab before version 2.
 * The chips (All, Tips, Notes) appear only from 8 notes (docs/V2.md, limit 3).
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FILTERS_FROM, notesOfKind } from '@/content/selectors';
import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Chip, EmptyState, IconButton, NoteCard, OfflineNote, Screen, size, Skeleton, Text } from '@/ui';

type Kind = 'all' | 'tip' | 'note';
const filters: { key: Kind; label: string }[] = [
  { key: 'all', label: strings.notes.filterAll },
  { key: 'tip', label: strings.notes.filterTips },
  { key: 'note', label: strings.notes.filterNotes },
];

export default function NotesScreen() {
  const router = useRouter();
  const back = useBack(routes.practice);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const refreshing = useContent((s) => s.refreshing);
  const refresh = useContent((s) => s.refresh);

  const [kind, setKind] = useState<Kind>('all');
  // No filter on a short list.
  const chips = content.journal.length >= FILTERS_FROM;
  const notes = notesOfKind(content, chips ? kind : 'all');

  return (
    <Screen contentStyle={styles.sections} refreshing={refreshing} onRefresh={refresh}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.title}>
          <Text variant="h1" accessibilityRole="header">
            {strings.notes.title(content.site.teacherFirstName)}
          </Text>
          {status === 'stale' ? <OfflineNote /> : null}
        </View>
        {chips ? (
          <View style={styles.chips}>
            {filters.map((f) => (
              <Chip key={f.key} label={f.label} selected={kind === f.key} onPress={() => setKind(f.key)} />
            ))}
          </View>
        ) : null}
      </Arrive>

      {status === 'loading' ? (
        <View style={styles.entries}>
          <Skeleton height={size.cover.note} />
          <Skeleton height={size.thumb * 2} />
        </View>
      ) : notes.length > 0 ? (
        <Arrive index={1} style={styles.entries}>
          {notes.map((entry) => (
            <NoteCard key={entry.slug} entry={entry} onPress={() => router.push(routes.note(entry.slug))} />
          ))}
        </Arrive>
      ) : chips && kind !== 'all' && content.journal.length > 0 ? (
        <EmptyState sentence={strings.notes.noMatch} actionLabel={strings.common.clear} onAction={() => setKind('all')} />
      ) : (
        <EmptyState sentence={strings.notes.empty} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  title: { gap: space.xs },
  chips: { flexDirection: 'row', gap: space.xs, paddingVertical: space.xxs },
  entries: { gap: space.xxl },
});
