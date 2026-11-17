/**
 * JournalCard: an entry of the Journal in the list.
 *   a tip   a card with "Tip", its title and its summary
 *   a note  a cover, then "Note", its title and its summary underneath
 */
import { StyleSheet, View } from 'react-native';

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

export type JournalCardProps = { entry: JournalEntry; onPress: () => void };

export function JournalCard({ entry, onPress }: JournalCardProps) {
  const kind = entry.kind === 'tip' ? strings.journal.tip : strings.journal.note;
  const label = `${kind}: ${entry.title}`;

  if (entry.kind === 'tip') {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={label}>
        <Card style={styles.tip}>
          <View style={styles.labels}>
            <Overline>{kind}</Overline>
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
          <Overline>{kind}</Overline>
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
