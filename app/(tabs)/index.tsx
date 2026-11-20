/**
 * Home: one vertical scroll with two parts (docs/phases/phase-2.md, "Home").
 *
 *   The billboard  Maria and her class, always dark, exactly as tall as the window. Shown the first
 *                  time the app is opened on a calendar day; later that day Home opens on Today.
 *   Today          in the phone's theme: a greeting that follows the clock, with the candlelight
 *                  behind it, this week's candles, the practice of the day (todayMove in
 *                  src/day/todayMove.ts), the breath of the time of day (breatheNow in
 *                  src/breathe/words.ts, Phase 7), the day's page of the Journal (journalToday in
 *                  src/journal/guided.ts, Phase 5), what is new, and one of Maria's sayings.
 *
 * The scroll rests at two places only, the top and the start of Today; below that it moves freely.
 * (The card of Sit arrives with its own phase.)
 */
import { useNavigation, useRouter } from 'expo-router';
import type { BottomTabNavigationProp } from 'expo-router/tabs';
import { ArrowRight, Bookmark, CalendarDays, ChevronDown, Feather, Play, User, Wind } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppState, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import type { BreathExercise } from '../../shared/content-schema';

import { DEFAULT_LENGTH } from '@/breathe/session';
import { breathedOn, breatheNow } from '@/breathe/words';
import { lessonMeta } from '@/content/labels';
import { dayOf, latestQuote, newestLessons } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useWeek } from '@/day/hooks';
import { useDays } from '@/day/store';
import { todayMove } from '@/day/todayMove';
import { journalToday, pageAt, pageNumberText, type JournalSuggestion } from '@/journal/guided';
import { useJournalPages } from '@/journal/usePages';
import { useAreas } from '@/lib/areas';
import { longDate, nextClass, showBillboard } from '@/lib/billboard';
import { greetingFor } from '@/lib/greeting';
import { tick } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/motion';
import { routes } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { makeStyles, ThemeScope, useTheme } from '@/theme/ThemeProvider';
import {
  AreaCard,
  Arrive,
  Button,
  Candlelight,
  Card,
  Cover,
  DoneTick,
  DraftChip,
  EmptyState,
  IconButton,
  LessonCard,
  OfflineNote,
  Overline,
  PressableScale,
  SectionHeader,
  size,
  Skeleton,
  Text,
  WeekCard,
} from '@/ui';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation<BottomTabNavigationProp<Record<string, undefined>>>();
  const insets = useSafeAreaInsets();
  const { height: billboardHeight } = useWindowDimensions();
  const { color } = useTheme();
  const styles = useStyles();
  const reduce = useReduceMotion();

  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const refreshing = useContent((s) => s.refreshing);
  const refresh = useContent((s) => s.refresh);
  const entries = useDays((s) => s.entries);
  const savedSlugs = usePractice((s) => s.saved);
  // The pages of each journal's current start (a habit started again counts from its first page).
  const { current: journalEntries, begun } = useJournalPages();
  const weekCard = useWeek();
  const available = useAreas();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  // ---- Once a day: the first opening of a calendar day shows the billboard; later ones open on Today.
  const [startOnToday] = useState(() => !showBillboard(usePrefs.getState().billboardDay, dayOf(new Date())));
  const [placed, setPlaced] = useState(!startOnToday);
  // The billboard's day is saved as soon as it shows. It is forgotten when the welcome ends (the
  // welcome can be opened again from About while Home stays underneath): back to the billboard.
  const billboardDay = usePrefs((s) => s.billboardDay);
  useEffect(() => {
    const today = dayOf(new Date());
    if (!showBillboard(billboardDay, today)) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    usePrefs.getState().setBillboardDay(today);
  }, [billboardDay, scrollRef]);

  // Back from the background on a new day (the app stayed open overnight): the billboard again.
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      const today = dayOf(new Date());
      if (state !== 'active' || !showBillboard(usePrefs.getState().billboardDay, today)) return;
      usePrefs.getState().setBillboardDay(today);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => listener.remove();
  }, [scrollRef]);

  // Tapping the Home tab while on Home goes back to the top.
  useEffect(() => {
    // The tab bar sends "tabPress" (app/(tabs)/_layout.tsx); only Home's own tab reaches this screen.
    return navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: !reduce });
    });
  }, [navigation, scrollRef, reduce]);

  // ---- The status bar: light icons while the billboard is under it.
  const [overBillboard, setOverBillboard] = useState(!startOnToday);
  useDarkTop(overBillboard);
  const darkUntil = billboardHeight - insets.top;
  useAnimatedReaction(
    () => scrollY.get() < darkUntil,
    (now, before) => {
      if (now !== before) scheduleOnRN(setOverBillboard, now);
    },
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.set(e.contentOffset.y);
    },
  });

  const toToday = useCallback(() => {
    scrollRef.current?.scrollTo({ y: billboardHeight, animated: !reduce });
  }, [scrollRef, billboardHeight, reduce]);

  // Opening on Today "without any movement": placed before anything shows (contentOffset), and
  // once more when the page first has its height (the web does not read contentOffset).
  const onContentSizeChange = (_w: number, h: number) => {
    if (placed || h <= billboardHeight) return;
    scrollRef.current?.scrollTo({ y: billboardHeight, animated: false });
    setPlaced(true);
  };

  // ---- What the two parts show.
  const now = new Date();
  const teacher = content.site.teacherFirstName;
  const greeting = greetingFor(now);
  // The big card: a series under way, else the featured lesson, else the newest.
  const move = todayMove(content, entries, now);
  const hero = move?.lesson;
  const heroSaved = hero ? savedSlugs.includes(hero.slug) : false;
  const heroOverline = move?.series
    ? strings.lesson.place(move.series.series.title, move.series.position, move.series.count)
    : hero
      ? lessonMeta(hero)
      : '';
  const toggleHeroSave = () => {
    if (!hero) return;
    tick(); // a light tick in the hand
    usePractice.getState().toggleSave(hero.slug);
  };
  // The breath of the time of day: one card in the area Breathe (Phase 7).
  const breath = available.breathe ? breatheNow(content.breath ?? [], now) : undefined;
  const breathedToday = breathedOn(entries, dayOf(now));
  // The day's page of the Journal: one card in the area Write.
  const page = journalToday(content.guidedJournals ?? [], journalEntries, dayOf(now), begun);
  const newest = newestLessons(content, 5, hero?.slug);
  const saying = latestQuote(content);
  const open = (slug: string) => router.push(routes.lesson(slug));
  // Below the billboard, the overline of Today starts 32 down, and never under the status bar.
  const todayTop = Math.max(space.xxl, insets.top + space.md);

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={size.scrollThrottle}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: startOnToday ? billboardHeight : 0 }}
        onContentSizeChange={onContentSizeChange}
        // Two resting places: the top, and the start of Today. Below that it scrolls freely.
        snapToOffsets={[0, billboardHeight]}
        snapToEnd={false}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={color.accent.gold}
            colors={[color.accent.gold]}
            progressBackgroundColor={color.bg.elevated}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* ---------------- The billboard: always dark ---------------- */}
        <ThemeScope scheme="dark">
          <Billboard height={billboardHeight} scrollY={scrollY} onToday={toToday} now={now} />
        </ThemeScope>

        {/* ---------------- Today: in the phone's theme ---------------- */}
        {/* At least one window tall, so that resting on Today never shows a strip of the billboard. */}
        <View
          style={[
            styles.column,
            styles.today,
            {
              minHeight: billboardHeight,
              paddingTop: todayTop,
              paddingBottom: insets.bottom + layout.tabBarInset + layout.tabBarHeight + layout.sectionGap,
            },
          ]}
        >
          <Candlelight />
          <View style={styles.sections}>
            <Arrive index={0} style={styles.header}>
              <View style={styles.headerRow}>
                <Overline>{greeting.overline}</Overline>
                <IconButton icon={User} accessibilityLabel={strings.today.you} onPress={() => router.push(routes.me)} />
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

            {/* This week: seven candles, and the streak. */}
            <Arrive index={1}>
              <WeekCard days={weekCard.days} streak={weekCard.streak} ever={weekCard.ever} />
            </Arrive>

            {/* The practice of the day: tap anywhere on it, or "Begin". Once done today: a tick. */}
            {hero && move ? (
              <Arrive index={2} style={styles.heroBlock}>
                <Overline tone="muted">{greeting.practice}</Overline>
                <PressableScale
                  onPress={() => open(hero.slug)}
                  accessibilityLabel={[hero.title, heroOverline, move.doneToday ? strings.today.doneToday : '']
                    .filter(Boolean)
                    .join(', ')}
                >
                  <Cover aura={hero.aura} image={hero.cover} height={size.hero.height} radius="xl" scrim>
                    <DraftChip item={hero} onCover style={styles.heroDraft} />
                    <IconButton
                      icon={Bookmark}
                      kind="glass"
                      active={heroSaved}
                      accessibilityLabel={heroSaved ? strings.lesson.unsave : strings.lesson.save}
                      onPress={toggleHeroSave}
                      style={styles.heroSave}
                    />
                    <View style={styles.heroText}>
                      <Overline tone="cover">{heroOverline}</Overline>
                      <Text variant="h1" color="onCover.primary">
                        {hero.title}
                      </Text>
                      <Text variant="body" color="onCover.secondary">
                        {hero.summary}
                      </Text>
                      {move.doneToday ? (
                        <View style={styles.heroDone}>
                          {/* Over a cover, the sage of the dark palette (covers are night pictures). */}
                          <ThemeScope scheme="dark">
                            <DoneTick />
                          </ThemeScope>
                          <Text variant="label" color="onCover.primary">
                            {strings.today.doneToday}
                          </Text>
                        </View>
                      ) : (
                        <Button
                          label={strings.today.begin}
                          icon={Play}
                          iconFilled
                          shape="pill"
                          onPress={() => open(hero.slug)}
                          style={styles.begin}
                        />
                      )}
                    </View>
                  </Cover>
                </PressableScale>
              </Arrive>
            ) : status === 'loading' ? (
              <Skeleton height={size.hero.height} radius="xl" />
            ) : (
              <EmptyState sentence={strings.today.empty} aura="dusk" />
            )}

            {breath ? (
              <Arrive index={3}>
                <BreatheCard exercise={breath} done={breathedToday} />
              </Arrive>
            ) : null}

            {page ? (
              <Arrive index={4}>
                <WriteCard suggestion={page} />
              </Arrive>
            ) : null}

            {newest.length > 0 ? (
              <Arrive index={5} style={styles.block2}>
                <SectionHeader
                  title={strings.today.newFrom(teacher)}
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
              <Arrive index={6}>
                <Card padding="xl" style={styles.saying}>
                  <Overline>{strings.today.noteFrom(teacher)}</Overline>
                  <Text variant="quote">{saying.quote}</Text>
                  <Button
                    kind="link"
                    icon={ArrowRight}
                    label={saying.kind === 'tip' ? strings.today.readTip : strings.today.readNote}
                    onPress={() => router.push(routes.note(saying.slug))}
                    style={styles.sayingLink}
                  />
                </Card>
              </Arrive>
            ) : null}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/**
 * The Breathe card of Today (Phase 7): "Breathe · 3 min", the exercise of the time of day and its
 * summary. One tap opens the player for 3 minutes. Once anything was breathed today: the sage tick
 * and "Done today", and the card opens the Breathe tab.
 */
function BreatheCard({ exercise, done }: { exercise: BreathExercise; done: boolean }) {
  const router = useRouter();
  return (
    <AreaCard
      area="breathe"
      icon={Wind}
      overline={strings.breathe.cardOverline(DEFAULT_LENGTH)}
      title={exercise.title}
      line={done ? strings.breathe.doneToday : exercise.summary}
      done={done}
      onPress={() => (done ? router.navigate(routes.breathe) : router.push(routes.breathPlay(exercise.slug, DEFAULT_LENGTH)))}
    />
  );
}

/**
 * The Write card of Today: the day's page ("Three good things", "Gratitude · page 6 of 28 ·
 * 3 min"); before anything is started, "Start the Gratitude journal"; once written today, the sage
 * tick and "Written today" (it opens the page to read).
 */
function WriteCard({ suggestion }: { suggestion: JournalSuggestion }) {
  const router = useRouter();
  const { journal } = suggestion;
  const common = { area: 'write' as const, icon: Feather, overline: strings.journal.write };
  if (suggestion.kind === 'begin') {
    return (
      <AreaCard
        {...common}
        title={strings.journal.startThe(journal.title)}
        line={journal.summary}
        onPress={() => router.push(routes.guidedAbout(journal.slug))}
      />
    );
  }
  if (suggestion.kind === 'write') {
    return (
      <AreaCard
        {...common}
        title={suggestion.page.title}
        line={strings.journal.todayLine(journal.title, pageNumberText(suggestion.number, true), journal.minutes)}
        onPress={() => router.push(routes.write(journal.slug))}
      />
    );
  }
  const { entry } = suggestion;
  const at = entry.section && entry.page ? pageAt(journal, { section: entry.section, page: entry.page }) : undefined;
  return (
    <AreaCard
      {...common}
      title={at?.page.title ?? entry.titles?.page ?? journal.title}
      line={strings.journal.writtenToday}
      done
      onPress={() => router.push(routes.write(journal.slug, entry.id))}
    />
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: color.bg.base },
    // The words of both parts sit in the centred column; the billboard's picture runs edge to edge.
    column: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.gutter,
    },

    // Today
    today: { overflow: 'hidden' }, // keeps the candlelight from spilling sideways
    sections: { gap: layout.sectionGap },
    header: { gap: space.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroBlock: { gap: space.sm },
    heroText: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.xs },
    heroDraft: { position: 'absolute', top: space.md, left: space.md },
    heroSave: { position: 'absolute', top: space.md, right: space.md },
    begin: { alignSelf: 'flex-start', marginTop: space.xs },
    heroDone: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, minHeight: size.button.pill },
    block2: { gap: space.md },
    bleedRight: { marginRight: -layout.gutter },
    cards: { gap: layout.cardGap, paddingRight: layout.gutter },
    saying: { gap: space.sm },
    sayingLink: { alignSelf: 'flex-start' },
  }),
);

type BillboardProps = {
  height: number;
  /** How far Home has scrolled, followed on the UI thread. */
  scrollY: SharedValue<number>;
  onToday: () => void;
  now: Date;
};

/**
 * The billboard: Maria's portrait (or the saffron aura), her name, her next class, "Meet Maria",
 * today's date and a small "Today" button. Drawn inside <ThemeScope scheme="dark">.
 */
function Billboard({ height, scrollY, onToday, now }: BillboardProps) {
  const router = useRouter();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { onCover } = useTheme();
  const styles = useBillboardStyles();
  const content = useContent((s) => s.content);
  const studio = content.studio;
  const teacher = content.site.teacherFirstName;
  const next = nextClass(studio.classes, now);
  // The words end 24 above the top of the floating tab bar.
  const blockBottom = insets.bottom + layout.tabBarInset + layout.tabBarHeight + space.xl;

  // As the page scrolls, the picture rises at half the speed and the words fade out over the first
  // 40% of the height. Not with "reduce motion".
  const groundStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduce ? 0 : Math.max(0, scrollY.get()) * size.parallax }],
  }));
  const blockStyle = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : interpolate(scrollY.get(), [0, height * size.billboardFade], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.billboard, { height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, groundStyle]}>
        <Cover aura="saffron" image={studio.portrait} imagePosition="top" height={height} radius="none" scrim />
      </Animated.View>

      <View style={[styles.column, styles.topRow, { top: insets.top + space.md }]}>
        <Overline tone="cover" numberOfLines={1} style={styles.appName}>
          {content.site.appName}
        </Overline>
        <IconButton icon={User} kind="glass" accessibilityLabel={strings.home.you} onPress={() => router.push(routes.me)} />
      </View>

      <Animated.View style={[styles.column, styles.block, { bottom: blockBottom }, blockStyle]}>
        <Overline tone="cover">{strings.home.yourTeacher}</Overline>
        <Text variant="display" color="onCover.primary" accessibilityRole="header" style={styles.next}>
          {studio.name || teacher}
        </Text>
        {studio.tagline ? (
          <Text variant="bodyLarge" color="onCover.secondary" style={styles.next}>
            {studio.tagline}
          </Text>
        ) : null}
        {next ? (
          <View style={styles.classBlock}>
            <View style={styles.classRow}>
              <CalendarDays size={size.icon.xs} strokeWidth={size.stroke.regular} color={onCover.primary} />
              <Text variant="label" color="onCover.primary" style={styles.classText}>
                {strings.home.nextClass(strings.today.weekdays[next.at.getDay()], next.item.start, next.item.name)}
              </Text>
            </View>
            {studio.location ? (
              <Text variant="meta" color="onCover.secondary">
                {studio.location.name}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Button
          kind="glass"
          label={strings.home.meet(teacher)}
          icon={ArrowRight}
          onPress={() => router.push(routes.maria)}
          style={styles.meet}
        />
        <View style={styles.hairline} />
        <View style={styles.dateRow}>
          <Text variant="title" color="onCover.primary" style={styles.date}>
            {longDate(now)}
          </Text>
          <Button
            kind="glass"
            small
            label={strings.home.today}
            icon={ChevronDown}
            onPress={onToday}
            accessibilityHint={strings.home.todayHint}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const useBillboardStyles = makeStyles((color) =>
  StyleSheet.create({
    billboard: { overflow: 'hidden', backgroundColor: color.bg.sunken },
    column: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.gutter,
    },
    topRow: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    appName: { flexShrink: 1 },
    block: { position: 'absolute' },
    // Each line sits 8 under the one before, unless said otherwise.
    next: { marginTop: space.xs },
    classBlock: { marginTop: space.md, gap: space.xxs },
    classRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    classText: { flexShrink: 1 },
    meet: { marginTop: space.lg, alignSelf: 'flex-start' },
    hairline: { marginTop: space.xl, height: size.stroke.hairline, backgroundColor: color.glassBorder },
    dateRow: {
      marginTop: space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    date: { flexShrink: 1 },
  }),
);
