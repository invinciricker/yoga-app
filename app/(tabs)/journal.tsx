/**
 * Journal: the person's own private writing (docs/phases/phase-5.md, section 5). In the phone's
 * theme. Nothing written here ever leaves the phone, except by the person's own Export.
 *
 *   the title, and "Private. It stays on this phone." with a small lock;
 *   today's page: the one suggestion (journalToday in src/journal/guided.ts): the next page to
 *     write, or "Begin" a journal, or "Today's page is written." with a quiet "Read it";
 *   the shelf: one row per guided journal by order, then the free pages with "New page".
 * Nothing else on the tab (docs/V2.md, "Limits that keep it calm").
 *
 * (Maria's tips and notes, which this tab once showed, are at /notes.)
 */
import { useRouter } from 'expo-router';
import { Lock, PenLine } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { GuidedJournal } from '../../shared/content-schema';

import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { journalToday, pageAt, pageNumberText, progressOf, type JournalSuggestion } from '@/journal/guided';
import { useJournal } from '@/journal/store';
import { freePages, type JournalEntry } from '@/journal/types';
import { routes } from '@/lib/nav';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { Arrive, Button, Cover, DoneTick, ListCard, Overline, PressableScale, Screen, ShelfRow, size, Text } from '@/ui';

/** The line of a journal on the shelf: where the person is. */
function shelfLine(journal: GuidedJournal, entries: readonly JournalEntry[], begun: readonly string[]): string {
  const p = progressOf(journal, entries, begun);
  if (!p.started) return strings.journal.notStarted;
  if (p.finished) return strings.journal.finished(p.total);
  if (p.number?.pool) return strings.journal.keepGoing(p.number.title, p.pool);
  return p.number ? pageNumberText(p.number) : strings.journal.notStarted;
}

export default function JournalScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const content = useContent((s) => s.content);
  const entries = useJournal((s) => s.entries);
  const begun = useJournal((s) => s.begun);
  const journals = [...(content.guidedJournals ?? [])].sort((a, b) => a.order - b.order);
  const suggestion = journalToday(journals, entries, dayOf(new Date()), begun);
  const free = freePages(entries);

  return (
    <Screen tabBar contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          {strings.journal.title}
        </Text>
        <View style={styles.private}>
          <Lock size={size.icon.xs} strokeWidth={size.stroke.regular} color={color.area.write} />
          <Text variant="meta" color="text.secondary">
            {strings.journal.private}
          </Text>
        </View>
      </Arrive>

      {suggestion ? (
        <Arrive index={1}>
          <TodaysPage suggestion={suggestion} />
        </Arrive>
      ) : null}

      <Arrive index={2}>
        <ListCard>
          {journals.map((journal) => (
            <ShelfRow
              key={journal.slug}
              aura={journal.aura}
              title={journal.title}
              line={shelfLine(journal, entries, begun)}
              onPress={() => router.push(routes.guided(journal.slug))}
            />
          ))}
          <ShelfRow
            icon={PenLine}
            title={strings.journal.freePages}
            line={free.length > 0 ? strings.journal.freeCount(free.length) : strings.journal.freeEmpty}
            onPress={() => router.push(free.length > 0 ? routes.freePages : routes.freePage())}
            action={{ label: strings.journal.newPage, onPress: () => router.push(routes.freePage()) }}
          />
        </ListCard>
      </Arrive>
    </Screen>
  );
}

/** The card of today's page, on the journal's aura (a cover: always dark, words in onCover). */
function TodaysPage({ suggestion }: { suggestion: JournalSuggestion }) {
  const router = useRouter();
  const { journal } = suggestion;
  let overline: string;
  let title: string;
  let line: string | undefined;
  let open: () => void;
  if (suggestion.kind === 'begin') {
    overline = strings.journal.beginOverline;
    title = strings.journal.theJournal(journal.title);
    line = journal.summary;
    open = () => router.push(routes.guidedAbout(journal.slug));
  } else if (suggestion.kind === 'write') {
    overline = strings.journal.todaysPage;
    title = suggestion.page.title;
    line = strings.journal.cardLine(journal.title, pageNumberText(suggestion.number), journal.minutes);
    open = () => router.push(routes.write(journal.slug));
  } else {
    const { entry } = suggestion;
    const at = entry.section && entry.page ? pageAt(journal, { section: entry.section, page: entry.page }) : undefined;
    overline = journal.title;
    title = at?.page.title ?? entry.titles?.page ?? journal.title;
    open = () => router.push(routes.write(journal.slug, entry.id));
  }
  const label = [overline, title, line, suggestion.kind === 'written' ? strings.journal.written : ''].filter(Boolean).join(', ');

  return (
    <PressableScale onPress={open} accessibilityLabel={label}>
      <Cover aura={journal.aura} height={size.todayPage} radius="xl" scrim>
        <View style={styles.cardWords}>
          <Overline tone="cover">{overline}</Overline>
          <Text variant="h2" color="onCover.primary">
            {title}
          </Text>
          {line ? (
            <Text variant="body" color="onCover.secondary">
              {line}
            </Text>
          ) : null}
          {suggestion.kind === 'written' ? (
            <>
              <View style={styles.written}>
                {/* Over a cover, the sage of the dark palette (covers are night pictures). */}
                <ThemeScope scheme="dark">
                  <DoneTick />
                </ThemeScope>
                <Text variant="label" color="onCover.primary">
                  {strings.journal.written}
                </Text>
              </View>
              <Button kind="quiet" onCover label={strings.journal.readIt} onPress={open} style={styles.readIt} />
            </>
          ) : (
            <Button
              label={suggestion.kind === 'begin' ? strings.journal.begin : strings.journal.write}
              shape="pill"
              onPress={open}
              style={styles.go}
            />
          )}
        </View>
      </Cover>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  header: { gap: space.sm },
  private: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  cardWords: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
  go: { alignSelf: 'flex-start', marginTop: space.xs },
  written: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  readIt: { alignSelf: 'flex-start', marginLeft: -space.md },
});
