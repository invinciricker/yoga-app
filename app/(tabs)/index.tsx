/**
 * Home: one vertical scroll with two parts (docs/phases/phase-2.md, "Home").
 *
 *   The billboard  Maria and her class, always dark, exactly as tall as the window. Shown the first
 *                  time the app is opened on a calendar day; later that day Home opens on Today.
 *   Today          in the phone's theme: a greeting that follows the clock, with the candlelight
 *                  behind it, the practice of the day, what is new, and one of Maria's sayings.
 *
 * The scroll rests at two places only, the top and the start of Today; below that it moves freely.
 * (The week card arrives with Phase 4; the cards of Breathe, Sit and Write with their own phases.)
 */
import { useNavigation, useRouter } from 'expo-router';
import type { BottomTabNavigationProp } from 'expo-router/tabs';
import { ArrowRight, CalendarDays, ChevronDown, Play, User } from 'lucide-react-native';
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

import { lessonMeta } from '@/content/labels';
import { dayOf, featuredLesson, latestQuote, newestLessons } from '@/content/selectors';
import { useContent } from '@/content/store';
import { longDate, nextClass, showBillboard } from '@/lib/billboard';
import { greetingFor } from '@/lib/greeting';
import { useReduceMotion } from '@/lib/motion';
import { routes } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { makeStyles, ThemeScope, useTheme } from '@/theme/ThemeProvider';
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
  SectionHeader,
  size,
  Skeleton,
  Text,
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

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  // ---- Once a day: the first opening of a calendar day shows the billboard; later ones open on Today.
  const [startOnToday] = useState(() => !showBillboard(usePrefs.getState().billboardDay, dayOf(new Date())));
  const [placed, setPlaced] = useState(!startOnToday);
  useEffect(() => {
    usePrefs.getState().setBillboardDay(dayOf(new Date()));
  }, []);

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
  const hero = featuredLesson(content, now);
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

            {/* The practice of the day: tap anywhere on it, or "Begin". */}
            {hero ? (
              <Arrive index={1} style={styles.heroBlock}>
                <Overline tone="muted">{greeting.practice}</Overline>
                <PressableScale onPress={() => open(hero.slug)} accessibilityLabel={`${hero.title}, ${lessonMeta(hero)}`}>
                  <Cover aura={hero.aura} image={hero.cover} height={size.hero.height} radius="xl" scrim>
                    <DraftChip item={hero} onCover style={styles.heroDraft} />
                    <View style={styles.heroText}>
                      <Overline tone="cover">{lessonMeta(hero)}</Overline>
                      <Text variant="h1" color="onCover.primary">
                        {hero.title}
                      </Text>
                      <Text variant="body" color="onCover.secondary">
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
              <Arrive index={2} style={styles.block2}>
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
              <Arrive index={3}>
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
    begin: { alignSelf: 'flex-start', marginTop: space.xs },
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
