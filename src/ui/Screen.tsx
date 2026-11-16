/**
 * Screen: the ground every screen stands on.
 * It gives the background, the safe areas (status bar, navigation bar), the 20 gutter,
 * a centred column on wide screens, optional scrolling, and room at the bottom for the tab bar.
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout, space } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls when the content is taller than the screen. On by default. */
  scroll?: boolean;
  /** True on the four tabs: leaves room so nothing hides behind the floating tab bar. */
  tabBar?: boolean;
  /** Drawn behind the content, in the same column (for example the candlelight). */
  backdrop?: ReactNode;
  /** Extra style for the column, usually a gap between sections. */
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = true, tabBar = false, backdrop, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    // Every screen starts 16 below the top inset.
    paddingTop: insets.top + space.md,
    paddingBottom:
      insets.bottom + (tabBar ? layout.tabBarInset + layout.tabBarHeight + layout.sectionGap : space.xl),
  };

  const column = (
    <View style={[styles.column, padding]}>
      {backdrop}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <View style={styles.root}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {column}
        </ScrollView>
      ) : (
        column
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.base },
  scroll: { flexGrow: 1 },
  column: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    overflow: 'hidden', // keeps the backdrop from spilling sideways
  },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter },
});
