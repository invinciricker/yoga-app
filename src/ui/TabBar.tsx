/**
 * TabBar: the floating pill at the bottom with the tabs (five when every area is open).
 * The active tab takes the colour of its area (docs/V2.md, "The map"); the others are muted.
 * Not translucent on purpose (a blurred bar is not reliable on Android).
 * This part only draws; app/(tabs)/_layout.tsx connects it to the navigation.
 */
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/strings';
import { layout, radius, space, type Area } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type TabItem = { key: string; label: string; icon: LucideIcon; area: Area };

export type TabBarProps = {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** True in the app: floats over the screen. False in the gallery: sits in the page. */
  floating?: boolean;
};

export function TabBar({ items, activeKey, onSelect, floating = true }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const styles = useStyles();
  const bar = (
    <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel={strings.tabs.barLabel}>
      {items.map((item) => {
        const active = item.key === activeKey;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            style={styles.item}
          >
            <Icon
              size={size.icon.lg}
              color={active ? color.area[item.area] : color.text.muted}
              strokeWidth={active ? size.stroke.active : size.stroke.regular}
            />
            {/* Five labels share 64 at 360 wide; "Meditate" at the largest text size needs about 61.
                Should a phone still run short, the label shrinks a little instead of being cut. */}
            <Text
              variant="tab"
              color={active ? `area.${item.area}` : 'text.muted'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={size.tabLabelMinScale}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!floating) return bar;
  return (
    // "box-none": touches pass through the empty space around the pill.
    <View pointerEvents="box-none" style={[styles.floating, { bottom: insets.bottom + layout.tabBarInset }]}>
      {bar}
    </View>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    floating: {
      position: 'absolute',
      left: 0,
      right: 0,
      paddingHorizontal: layout.tabBarInset,
      alignItems: 'center',
    },
    bar: {
      width: '100%',
      maxWidth: layout.maxContentWidth - layout.tabBarInset * 2,
      height: layout.tabBarHeight,
      borderRadius: radius.pill,
      backgroundColor: color.bg.elevated,
      borderColor: color.border.strong,
      borderWidth: size.stroke.hairline,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.xxs,
    },
    item: {
      flex: 1,
      height: size.tabItem,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xxs,
    },
  }),
);
