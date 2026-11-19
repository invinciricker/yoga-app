/**
 * A guided journal's page (/guided/gratitude): its cover (aura, title, summary, "3 min a page") with
 * a progress line ("Page 6 of 28", or in the pool "28 pages, and 4 more"); the gold "Write today's
 * page" (or "Begin", or the written state); a row "About this journal"; then "Your pages", newest
 * first: the page's title, its section, its day ("Skipped", quietly, for a page passed).
 *
 * A journal taken down (or turned into a draft) still opens here while the person has pages in it:
 * their pages stay readable, with the titles they had.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GuidedJournal } from '../../shared/content-schema';

import { slugsForStaticPages } from '@/content/load';
import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { longDay } from '@/journal/dates';
import { isOpenToday, pageAt, pageNumberText, progressOf } from '@/journal/guided';
import { useJournal } from '@/journal/store';
import { entriesOf, type JournalEntry } from '@/journal/types';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Button,
  Cover,
  DoneTick,
  DraftChip,
  IconButton,
  ListCard,
  LoadingPage,
  NotHere,
  Overline,
  PressableScale,
  ProgressLine,
  Screen,
  SectionHeader,
  SettingsRow,
  size,
  Text,
} from '@/ui';

/** Web preview only: the journal pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('guidedJournals');
}

export default function GuidedJournalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const all = useJournal((s) => s.entries);
  const begun = useJournal((s) => s.begun);
  const journal = content.guidedJournals?.find((j) => j.slug === slug);
  const pages = entriesOf(slug ?? '', all).sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));

  if (!journal && pages.length === 0) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.journal.gone} actionLabel={strings.journal.toJournal} onAction={() => router.replace(routes.journal)} />;
  }
  return <JournalPage slug={slug ?? ''} journal={journal} pages={pages} entries={all} begun={begun} />;
}

type PageProps = {
  slug: string;
  journal: GuidedJournal | undefined;
  /** This journal's pages, newest first. */
  pages: JournalEntry[];
  entries: JournalEntry[];
  begun: string[];
};

function JournalPage({ slug, journal, pages, entries, begun }: PageProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = useBack(routes.journal);
  const today = dayOf(new Date());
  const title = journal?.title ?? pages[0]?.titles?.journal ?? slug;
  const progress = journal ? progressOf(journal, entries, begun) : undefined;
  const open = journal ? isOpenToday(journal, entries, today) : false;
  const label = progress?.number?.kind === 'pool'
    ? strings.journal.poolProgress(progress.total, progress.pool)
    : progress?.number
      ? pageNumberText(progress.number)
      : undefined;

  /** The gold button, or the written state, or nothing. */
  let action = null;
  if (journal && progress) {
    if (!progress.started) {
      action = <Button label={strings.journal.begin} onPress={() => router.push(routes.guidedAbout(slug))} />;
    } else if (progress.next && open) {
      action = <Button label={strings.journal.writeToday} onPress={() => router.push(routes.write(slug))} />;
    } else if (progress.next) {
      action = (
        <View style={styles.written}>
          <DoneTick />
          <Text variant="label" color="text.secondary">
            {strings.journal.written}
          </Text>
        </View>
      );
    }
  }

  return (
    <Screen bleed darkTop={size.cover.series}>
      <Cover aura={journal?.aura ?? 'rose'} height={size.cover.series} radius="none" scrim>
        <View style={[styles.coverTop, { top: insets.top + space.md }]}>
          <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
        </View>
        <View style={styles.coverWords}>
          <View style={styles.labels}>
            <Overline tone="cover">{journal ? strings.journal.minutesAPage(journal.minutes) : strings.journal.yourPages}</Overline>
            {journal ? <DraftChip item={journal} onCover /> : null}
          </View>
          <Text variant="h1" color="onCover.primary" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body" color="onCover.secondary">
            {journal ? journal.summary : strings.journal.goneLine}
          </Text>
          {progress?.started && label ? <ProgressLine done={progress.done} total={progress.total} label={label} /> : null}
        </View>
      </Cover>

      <View style={styles.sections}>
        {journal ? (
          <Arrive index={0} style={styles.block}>
            {action}
            <ListCard>
              <SettingsRow label={strings.journal.about} onPress={() => router.push(routes.guidedAbout(slug))} />
            </ListCard>
          </Arrive>
        ) : null}

        <Arrive index={1} style={styles.block}>
          <SectionHeader title={strings.journal.yourPages} />
          {pages.length > 0 ? (
            <ListCard>
              {pages.map((entry) => (
                <PageRow key={entry.id} entry={entry} journal={journal} onPress={() => router.push(routes.write(slug, entry.id))} />
              ))}
            </ListCard>
          ) : (
            <Text variant="bodyLarge" color="text.secondary">
              {strings.journal.noPagesYet}
            </Text>
          )}
        </Arrive>
      </View>
    </Screen>
  );
}

/** One page written: its title, its section and its day; a page passed reads "Skipped", quietly. */
function PageRow({ entry, journal, onPress }: { entry: JournalEntry; journal: GuidedJournal | undefined; onPress: () => void }) {
  const at = journal && entry.section && entry.page ? pageAt(journal, { section: entry.section, page: entry.page }) : undefined;
  const title = at?.page.title ?? entry.titles?.page ?? entry.page ?? '';
  const section = at?.section.title ?? entry.titles?.section ?? '';
  const line = [entry.skipped ? strings.journal.skipped : section, longDay(entry.day)].filter(Boolean).join(' · ');
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${title}, ${line}`} style={styles.row}>
      <Text variant="title" color={entry.skipped ? 'text.muted' : 'text.primary'}>
        {title}
      </Text>
      <Text variant="meta" color={entry.skipped ? 'text.muted' : 'text.secondary'}>
        {line}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  coverTop: { position: 'absolute', left: layout.gutter, right: layout.gutter, flexDirection: 'row' },
  coverWords: { position: 'absolute', left: layout.gutter, right: layout.gutter, bottom: space.xl, gap: space.xs },
  labels: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  sections: { paddingHorizontal: layout.gutter, paddingTop: space.xl, gap: space.xxl },
  block: { gap: space.md },
  written: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: size.button.ghost },
  row: { minHeight: size.settingsRow, justifyContent: 'center', gap: space.xxs / 2, paddingVertical: space.sm, paddingHorizontal: space.lg },
});
