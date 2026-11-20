/**
 * The welcome: three calm screens, the very first time the app opens, before Home
 * (docs/phases/phase-3.md, "The welcome"). Always dark: the room dims.
 *
 * Swipe sideways or press the gold button. "Skip" (on the first two) and "Begin" (on the last)
 * remember that it was seen (ywm:welcome:v1) and open Home on the billboard. Closing the app
 * halfway remembers nothing, so the welcome shows again next time.
 * The system back button goes to the screen before; on the first one it does what it always
 * does (on a first launch: leaves the app).
 * With "reduce motion", the screens change with a short fade instead of a slide.
 *
 * The words come from src/lib/welcome.ts, with the app's and the teacher's names from the
 * content (the copy bundled in the app on a very first launch without network).
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useContent } from '@/content/store';
import { useAreas } from '@/lib/areas';
import { standardEasing, useReduceMotion } from '@/lib/motion';
import { routes } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { welcomeSlides, type WelcomeSlide } from '@/lib/welcome';
import { strings } from '@/strings';
import { layout, motion, space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { makeStyles, ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { Button, Cover, Overline, size, Text } from '@/ui';

/** How far a finger must travel sideways to count as a swipe (reduce motion only). */
const SWIPE = 48;

export default function WelcomeScreen() {
  return (
    <ThemeScope scheme="dark">
      <Welcome />
    </ThemeScope>
  );
}

function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = useStyles();
  const reduce = useReduceMotion();
  useDarkTop(true);

  const site = useContent((s) => s.content.site);
  // Built and not empty: the welcome never names a room with nothing in it.
  const available = useAreas();
  const slides = welcomeSlides(available, { app: site.appName, teacher: site.teacherFirstName });
  const last = slides.length - 1;

  const [page, setPage] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  // How tall the dots and the button are, so the words never sit under them.
  const [footerHeight, setFooterHeight] = useState(0);
  const fade = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  const goTo = useCallback(
    (n: number) => {
      const target = Math.max(0, Math.min(last, n));
      if (target === page) return;
      setPage(target);
      if (reduce) {
        // A short fade, no slide.
        fade.set(0);
        fade.set(withTiming(1, { duration: motion.duration.quick, easing: standardEasing }));
      } else {
        pager.current?.scrollTo({ x: target * width, animated: true });
      }
    },
    [last, page, reduce, fade, width],
  );

  /** "Begin" or "Skip": remember it, and open Home on the billboard. */
  const finish = () => {
    const prefs = usePrefs.getState();
    prefs.setWelcomeSeen();
    prefs.forgetBillboardDay();
    if (router.canDismiss()) {
      // Opened again from About: back to the tabs underneath, on Home.
      router.dismissAll();
      router.navigate(routes.home);
    } else {
      // The very first launch: the welcome is the only screen; Home takes its place.
      router.replace(routes.home);
    }
  };

  // Android's back button: the screen before. On the first one, the usual (leave the app).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (page === 0) return false;
        goTo(page - 1);
        return true;
      });
      return () => sub.remove();
    }, [page, goTo]),
  );

  // While sliding: which screen is mostly in view.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const shown = Math.round(e.nativeEvent.contentOffset.x / width);
    if (shown !== page && shown >= 0 && shown <= last) setPage(shown);
  };

  // With reduce motion the screens do not slide under the finger: a swipe changes them with a fade.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: GestureResponderEvent) => {
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };
  const onTouchEnd = (e: GestureResponderEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.nativeEvent.pageX - start.x;
    const dy = e.nativeEvent.pageY - start.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return; // a tap, or a vertical scroll
    goTo(dx < 0 ? page + 1 : page - 1);
  };

  const slide = slides[page];
  const pageProps = { insets, footerHeight, width };

  return (
    <View style={styles.root}>
      {reduce ? (
        <Animated.View style={[styles.fill, fadeStyle]} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Page slide={slide} {...pageProps} />
        </Animated.View>
      ) : (
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={size.scrollThrottle}
          style={styles.fill}
        >
          {slides.map((s, i) => (
            <Page key={i} slide={s} {...pageProps} />
          ))}
        </ScrollView>
      )}

      {/* Skip: quiet, at the top right of the first two screens. */}
      {slide.skip ? (
        <View style={[styles.skip, { top: insets.top + space.xs }]}>
          <Button kind="quiet" onCover label={strings.welcome.skip} accessibilityHint={strings.welcome.skipHint} onPress={finish} />
        </View>
      ) : null}

      {/* The dots and the gold button stay in place while the screens change under them. */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + space.xl }]}
        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.column}>
          <Dots count={slides.length} current={page} />
          <Button label={slide.button} onPress={page === last ? finish : () => goTo(page + 1)} />
        </View>
      </View>
    </View>
  );
}

type PageProps = {
  slide: WelcomeSlide;
  width: number;
  footerHeight: number;
  insets: { top: number };
};

/**
 * One screen: the aura edge to edge, and the words in its lower part. If the words do not fit
 * (a small phone, large text), they scroll; they are never cut.
 */
function Page({ slide, width, footerHeight, insets }: PageProps) {
  const styles = useStyles();
  return (
    <View style={[styles.page, { width }]}>
      <Cover aura={slide.aura} radius="none" scrim style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.words,
          // Below the "Skip" row at the top, above the dots and the button at the bottom.
          { paddingTop: insets.top + space.xs + layout.touchMin + space.xl, paddingBottom: footerHeight + space.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <Overline tone="cover">{slide.overline}</Overline>
          <Text variant="display" color="onCover.primary" accessibilityRole="header" style={styles.title}>
            {slide.title}
          </Text>
          <Text variant="bodyLarge" color="onCover.secondary" style={styles.sentence}>
            {slide.sentence}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/** Three small dots; the current one is gold. */
function Dots({ count, current }: { count: number; current: number }) {
  const { color, onCover } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.dots} accessible accessibilityLabel={strings.welcome.place(current + 1, count)}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: i === current ? onCover.accent : color.glassBorder }]} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: color.bg.sunken },
    fill: { flex: 1 },
    page: { flex: 1, overflow: 'hidden' },
    words: { flexGrow: 1, justifyContent: 'flex-end' },
    column: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      paddingHorizontal: layout.gutter,
    },
    title: { marginTop: space.sm },
    sentence: { marginTop: space.md },
    skip: { position: 'absolute', right: layout.gutter - space.md },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    dots: { flexDirection: 'row', gap: space.xs, marginBottom: space.xl },
    dot: { width: size.dot, height: size.dot, borderRadius: size.dot / 2 },
  }),
);
