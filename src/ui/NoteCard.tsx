/**
 * NoteCard: one of Maria's tips or notes in a list (Notes, and the bottom of Practice).
 *   a tip   a card with "Tip", its title and its summary
 *   a note  a cover, then "Note", its title and its summary underneath
 * The notes live in the Practice area, so their overlines take its colour.
 */
import { StyleSheet, View } from 'react-native';

// "JournalEntry" is the name of Maria's notes in the content: a permanent data name (docs/V2.md).
import type { JournalEntry } from '../../shared/content-schema';

import { strings } from '@/strings';
import { space } from '@/theme';

import { Card } from './Card';
import { Cover } from './Cover';
import { DraftChip } from './DraftChip';
import { Overline } from './Overline';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type NoteCardProps = { entry: JournalEntry; onPress: () => void };

export function NoteCard({ entry, onPress }: NoteCardProps) {
  const kind = entry.kind === 'tip' ? strings.notes.tip : strings.notes.note;
  const label = `${kind}: ${entry.title}`;

  if (entry.kind === 'tip') {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={label}>
        <Card style={styles.tip}>
          <View style={styles.labels}>
            <Overline tone="area" area="move">
              {kind}
            </Overline>
            <DraftChip item={entry} />
          </View>
          <Text variant="h3">{entry.title}</Text>
          <Text variant="body" color="text.secondary">
            {entry.summary}
          </Text>
        </Card>
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.note}>
      <Cover aura={entry.aura} image={entry.cover} height={size.cover.note} radius="lg" />
      <View style={styles.noteWords}>
        <View style={styles.labels}>
          <Overline tone="area" area="move">
            {kind}
          </Overline>
          <DraftChip item={entry} />
        </View>
        <Text variant="h2">{entry.title}</Text>
        <Text variant="body" color="text.secondary">
          {entry.summary}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tip: { gap: space.xs },
  note: { gap: space.md },
  noteWords: { gap: space.xs },
  labels: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
