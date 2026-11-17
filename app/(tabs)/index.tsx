/**
 * Today: the first screen. A greeting that follows the clock, with the candlelight behind it,
 * the practice of the day (the featured lesson), what is new, and one of Maria's sayings.
 * (The week card arrives with Phase 3, the Studio card with Phase 2.)
 */
import { useRouter } from 'expo-router';
import { ArrowRight, Play, User } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { lessonMeta } from '@/content/labels';
import { featuredLesson, latestQuote, newestLessons } from '@/content/selectors';
import { useContent } from '@/content/store';
import { greetingFor } from '@/lib/greeting';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import {
  Arrive,
  Button,
  Candlelight,
  Card,
  Cover,
  DraftChip,
  EmptyState,
  IconButton,
  LessonCard,
  OfflineNote,
  Overline,
  PressableScale,
  Screen,
  SectionHeader,
  size,
  Skeleton,
  Text,
} from '@/ui';

export default function TodayScreen() {
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const refreshing = useContent((s) => s.refreshing);
  const refresh = useContent((s) => s.refresh);

  const now = new Date();
  const greeting = greetingFor(now);
  const hero = featuredLesson(content, now);
  const newest = newestLessons(content, 5, hero?.slug);
  const saying = latestQuote(content);
  const open = (slug: string) => router.push(routes.lesson(slug));

  return (
    <Screen tabBar backdrop={<Candlelight />} contentStyle={styles.sections} refreshing={refreshing} onRefresh={refresh}>
      <Arrive index={0} style={styles.header}>
        <View style={styles.topRow}>
          <Overline>{greeting.overline}</Overline>
          {/* Opens "My practice" from Phase 2. It does nothing yet. */}
          <IconButton icon={User} accessibilityLabel={strings.today.myPractice} />
        </View>
        <Text variant="display" accessibilityRole="header">
          {greeting.hello}
          {'\n'}
          <Text variant="display" italic color="text.secondary">
            {greeting.line}
          </Text>
        </Text>
        {status === 'stale' ? <OfflineNote /> : null}
      </Arrive>

      {/* The practice of the day: tap anywhere on it, or "Begin". */}
      {hero ? (
        <Arrive index={1} style={styles.heroBlock}>
          <Overline tone="muted">{greeting.practice}</Overline>
          <PressableScale onPress={() => open(hero.slug)} accessibilityLabel={`${hero.title}, ${lessonMeta(hero)}`}>
            <Cover aura={hero.aura} image={hero.cover} height={size.hero.height} radius="xl" scrim>
              <DraftChip item={hero} style={styles.heroDraft} />
              <View style={styles.heroText}>
                <Overline>{lessonMeta(hero)}</Overline>
                <Text variant="h1">{hero.title}</Text>
                <Text variant="body" color="text.secondary">
                  {hero.summary}
                </Text>
                <Button
                  label={strings.today.begin}
                  icon={Play}
                  iconFilled
                  shape="pill"
                  onPress={() => open(hero.slug)}
                  style={styles.begin}
                />
              </View>
            </Cover>
          </PressableScale>
        </Arrive>
      ) : status === 'loading' ? (
        <Skeleton height={size.hero.height} radius="xl" />
      ) : (
        <EmptyState sentence={strings.today.empty} aura="dusk" />
      )}

      {newest.length > 0 ? (
        <Arrive index={2} style={styles.block}>
          <SectionHeader
            title={strings.today.newFrom(content.site.teacherFirstName)}
            actionLabel={strings.common.seeAll}
            onAction={() => router.navigate(routes.practice)}
          />
          {/* The row runs to the right edge of the screen, past the gutter. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleedRight}
            contentContainerStyle={styles.cards}
          >
            {newest.map((lesson) => (
              <LessonCard key={lesson.slug} lesson={lesson} onPress={() => open(lesson.slug)} />
            ))}
          </ScrollView>
        </Arrive>
      ) : null}

      {saying?.quote ? (
        <Arrive index={3}>
          <Card padding="xl" style={styles.saying}>
            <Overline>{strings.today.fromJournal}</Overline>
            <Text variant="quote">{saying.quote}</Text>
            <Button
              kind="link"
              icon={ArrowRight}
              label={saying.kind === 'tip' ? strings.today.readTip : strings.today.readNote}
              onPress={() => router.push(routes.entry(saying.slug))}
              style={styles.sayingLink}
            />
          </Card>
        </Arrive>
      ) : null}

      {isPreview ? (
        <Arrive index={4}>
          <Button
            kind="quiet"
            label={strings.today.galleryLink}
            onPress={() => router.push(routes.gallery)}
            style={styles.galleryLink}
          />
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: layout.sectionGap },
  header: { gap: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBlock: { gap: space.sm },
  heroText: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
  heroDraft: { position: 'absolute', top: space.md, left: space.md },
  begin: { alignSelf: 'flex-start', marginTop: space.xs },
  block: { gap: space.md },
  bleedRight: { marginRight: -layout.gutter },
  cards: { gap: layout.cardGap, paddingRight: layout.gutter },
  saying: { gap: space.sm },
  sayingLink: { alignSelf: 'flex-start' },
  galleryLink: { alignSelf: 'center' },
});
