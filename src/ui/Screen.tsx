/**
 * Screen: the ground every screen stands on.
 * It gives the background, the safe areas (status bar, navigation bar), the 20 gutter,
 * a centred column on wide screens, optional scrolling, and room at the bottom for the tab bar.
 * It can also pull to refresh, and hold a bar fixed at the bottom (a lesson's "Begin practice").
 */
import { useId, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { layout, space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls when the content is taller than the screen. On by default. */
  scroll?: boolean;
  /** True on the tabs: leaves room so nothing hides behind the floating tab bar. */
  tabBar?: boolean;
  /** Drawn behind the content, in the same column (for example the candlelight). */
  backdrop?: ReactNode;
  /** Extra style for the column, usually a gap between sections. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * For a page that opens with a full-width cover: the content starts at the very top of the
   * screen (under the status bar) and has no gutter. The page pads its own text.
   */
  bleed?: boolean;
  /**
   * How tall the dark part at the top of the page is (a cover). While it is under the status bar,
   * the status bar's icons are light, whatever the theme.
   */
  darkTop?: number;
  /** A bar fixed at the bottom, fading in from the background. */
  footer?: ReactNode;
  /** Pull to refresh: give both. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** To scroll the page from the outside (back to the top when a video starts). */
  scrollRef?: RefObject<ComponentRef<typeof ScrollView> | null>;
  /**
   * A page to write on: the page ends where the keyboard begins (React Native's own
   * KeyboardAvoidingView), so the phone keeps the field being typed in, and its cursor, in view.
   */
  keyboard?: boolean;
};

export function Screen({
  children,
  scroll = true,
  tabBar = false,
  backdrop,
  contentStyle,
  bleed = false,
  darkTop,
  footer,
  refreshing = false,
  onRefresh,
  scrollRef,
  keyboard = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const styles = useStyles();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [footerHeight, setFooterHeight] = useState(0);
  // True once the dark top has scrolled away from under the status bar.
  const [pastDarkTop, setPastDarkTop] = useState(false);
  useDarkTop(darkTop !== undefined && darkTop > 0 && !pastDarkTop);

  const onScroll =
    darkTop === undefined
      ? undefined
      : (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const past = e.nativeEvent.contentOffset.y > darkTop - insets.top;
          if (past !== pastDarkTop) setPastDarkTop(past);
        };

  const padding = {
    // Every screen starts 16 below the top inset.
    paddingTop: bleed ? 0 : insets.top + space.md,
    paddingBottom: footer
      ? footerHeight + space.md
      : insets.bottom + (tabBar ? layout.tabBarInset + layout.tabBarHeight + layout.sectionGap : space.xl),
  };

  const column = (
    <View style={[styles.column, padding]}>
      {backdrop}
      <View style={[styles.content, !bleed && styles.gutter, contentStyle]}>{children}</View>
    </View>
  );

  const Root = keyboard ? KeyboardAvoidingView : View;
  return (
    <Root style={styles.root} {...(keyboard ? { behavior: 'padding' as const } : null)}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={onScroll ? size.scrollThrottle : undefined}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={color.accent.gold}
                colors={[color.accent.gold]}
                progressBackgroundColor={color.bg.elevated}
                progressViewOffset={insets.top}
              />
            ) : undefined
          }
        >
          {column}
        </ScrollView>
      ) : (
        column
      )}

      {footer ? (
        <View style={styles.footer} pointerEvents="box-none" onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          {/* The bar's ground: nothing at the top, the screen colour from a third of the way down. */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor={color.bg.base} stopOpacity={0} />
                <Stop offset={size.footerFade} stopColor={color.bg.base} stopOpacity={1} />
                <Stop offset={1} stopColor={color.bg.base} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}f)`} />
          </Svg>
          <View style={[styles.footerContent, { paddingBottom: insets.bottom + space.lg }]}>{footer}</View>
        </View>
      ) : null}
    </Root>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: color.bg.base },
    scroll: { flexGrow: 1 },
    column: {
      flexGrow: 1,
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
      overflow: 'hidden', // keeps the backdrop from spilling sideways
    },
    content: { flexGrow: 1 },
    gutter: { paddingHorizontal: layout.gutter },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
    footerContent: {
      width: '100%',
      maxWidth: layout.maxContentWidth,
      paddingTop: space.xxxl,
      paddingHorizontal: layout.gutter,
      gap: space.xxs,
    },
  }),
);
