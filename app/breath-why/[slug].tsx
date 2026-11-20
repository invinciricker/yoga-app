/**
 * "Why this works" (/breath-why/long-exhale; docs/phases/phase-7.md, section 3): one tap away from
 * an exercise's page, never on its surface (docs/V2.md, limit 5). How strong the evidence is, in
 * plain words and what that means ("Promising evidence. Some good studies. More are needed."), what
 * the research found, and the sources. No health promise: the words are the architect's.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { levelWords } from '@/breathe/words';
import { slugsForStaticPages } from '@/content/load';
import { useContent } from '@/content/store';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Card, IconButton, LoadingPage, NotHere, Overline, RichText, Screen, SectionHeader, Text } from '@/ui';

/** Web preview only: the pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('breath');
}

export default function BreathWhyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const back = useBack(slug ? routes.breath(slug) : routes.breathe);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const exercise = content.breath?.find((e) => e.slug === slug);

  if (!exercise) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.breathe.gone} actionLabel={strings.breathe.toBreathe} onAction={() => router.replace(routes.breathe)} />;
  }

  const level = levelWords(exercise.why.level);

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.titles}>
          <Overline tone="area" area="breathe">
            {exercise.title}
          </Overline>
          <Text variant="h1" accessibilityRole="header">
            {strings.breathe.why}
          </Text>
        </View>
      </Arrive>

      {level ? (
        <Arrive index={1}>
          <Card padding="xl" style={styles.card}>
            <Text variant="h3">{level.title}</Text>
            <Text variant="body" color="text.secondary">
              {level.line}
            </Text>
          </Card>
        </Arrive>
      ) : null}

      <Arrive index={2}>
        <RichText blocks={exercise.why.text} />
      </Arrive>

      {exercise.why.sources.length > 0 ? (
        <Arrive index={3} style={styles.sources}>
          <SectionHeader title={strings.breathe.sources} />
          {exercise.why.sources.map((source) => (
            <Text key={source} variant="meta" color="text.secondary">
              {source}
            </Text>
          ))}
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl },
  header: { gap: space.xl },
  titles: { gap: space.xs },
  card: { gap: space.xs },
  sources: { gap: space.sm, marginTop: space.sm },
});
