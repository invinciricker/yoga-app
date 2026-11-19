/**
 * About this journal (/guided-about/gratitude): the intro cards one under the other (title in h3,
 * text with RichText), then "The research behind it" with the sources in meta. Opened before
 * starting, it ends with the gold "Begin": the journal starts, and page 1 opens in its place.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { slugsForStaticPages } from '@/content/load';
import { useContent } from '@/content/store';
import { isStarted } from '@/journal/guided';
import { useJournal } from '@/journal/store';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, Card, IconButton, LoadingPage, NotHere, Overline, RichText, Screen, SectionHeader, Text } from '@/ui';

/** Web preview only: the pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('guidedJournals');
}

export default function AboutJournalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const entries = useJournal((s) => s.entries);
  const begun = useJournal((s) => s.begun);
  const back = useBack(slug ? routes.guided(slug) : routes.journal);
  const journal = content.guidedJournals?.find((j) => j.slug === slug);

  if (!journal) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.journal.gone} actionLabel={strings.journal.toJournal} onAction={() => router.replace(routes.journal)} />;
  }

  const begin = () => {
    tick(); // a light tick in the hand
    useJournal.getState().begin(journal.slug);
    router.replace(routes.write(journal.slug));
  };

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.titles}>
          <Overline tone="area" area="write">
            {journal.title}
          </Overline>
          <Text variant="h1" accessibilityRole="header">
            {strings.journal.about}
          </Text>
        </View>
      </Arrive>

      {journal.intro.map((card, i) => (
        <Arrive key={i} index={i + 1}>
          <Card padding="xl" style={styles.card}>
            <Text variant="h3" accessibilityRole="header">
              {card.title}
            </Text>
            <RichText blocks={card.text} ink="text.secondary" />
          </Card>
        </Arrive>
      ))}

      {journal.sources.length > 0 ? (
        <Arrive index={journal.intro.length + 1} style={styles.sources}>
          <SectionHeader title={strings.journal.research} />
          {journal.sources.map((source) => (
            <Text key={source} variant="meta" color="text.secondary">
              {source}
            </Text>
          ))}
        </Arrive>
      ) : null}

      {isStarted(journal, entries, begun) ? null : <Button label={strings.journal.begin} onPress={begin} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl },
  header: { gap: space.xl },
  titles: { gap: space.xs },
  card: { gap: space.sm },
  sources: { gap: space.sm, marginTop: space.sm },
});
