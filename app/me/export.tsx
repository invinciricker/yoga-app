/**
 * You → Export my journal: the only way the journal leaves the phone, and only by the person's own
 * hand (docs/V2.md, limit 7). One sentence, then the gold "Export": React Native's own Share hands
 * the text (src/journal/exportText.ts) to the app the person picks, such as their email or notes.
 *
 * Android refuses very large shares, so above 100,000 characters the journal comes in parts, oldest
 * first: one gold button for the next part, "Export part 2 of 3", until all are handed over.
 */
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Share, StyleSheet } from 'react-native';

import { useContent } from '@/content/store';
import { exportParts, journalPages } from '@/journal/exportText';
import { useJournal } from '@/journal/store';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, IconButton, Screen, Text } from '@/ui';

export default function ExportScreen() {
  const back = useBack(routes.me);
  const content = useContent((s) => s.content);
  const entries = useJournal((s) => s.entries);
  const parts = useMemo(() => {
    const pages = journalPages(entries, content.guidedJournals ?? []);
    return pages.length > 0 ? exportParts(pages) : [];
  }, [entries, content]);
  // How many parts were handed over already, and whether this place cannot share at all (the web).
  const [handed, setHanded] = useState(0);
  const [failed, setFailed] = useState(false);

  const share = async () => {
    tick(); // a light tick in the hand
    const part = parts[handed];
    try {
      await Share.share({ message: part, title: strings.journal.exportTitle });
      setHanded((n) => Math.min(parts.length, n + 1));
    } catch {
      setFailed(true);
    }
  };

  const many = parts.length > 1;
  const label = many ? strings.journal.exportPart(Math.min(handed + 1, parts.length), parts.length) : strings.journal.export;

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="h1" accessibilityRole="header">
          {strings.journal.exportTitle}
        </Text>
        <Text variant="bodyLarge" color="text.secondary">
          {parts.length > 0 ? strings.journal.exportSentence : strings.journal.exportNothing}
        </Text>
        {many ? (
          <Text variant="bodyLarge" color="text.secondary">
            {strings.journal.exportParts(parts.length)}
          </Text>
        ) : null}
      </Arrive>

      {parts.length > 0 ? (
        <Arrive index={1} style={styles.action}>
          {/* One part after another; once all are handed over, the button offers them again from the first. */}
          {handed < parts.length || !many ? (
            <Button label={label} onPress={() => void share()} />
          ) : (
            <Button kind="ghost" label={strings.journal.exportPart(1, parts.length)} onPress={() => setHanded(0)} />
          )}
          {many && handed > 0 ? (
            <Text variant="meta" color="text.secondary" center>
              {strings.journal.exportHanded(handed, parts.length)}
            </Text>
          ) : null}
          {failed ? (
            <Text variant="meta" color="text.secondary" center>
              {strings.journal.exportFailed}
            </Text>
          ) : null}
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  action: { gap: space.sm },
});
