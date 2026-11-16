/**
 * TabBar: the floating pill at the bottom with the four tabs.
 * Not translucent on purpose (a blurred bar is not reliable on Android).
 * This part only draws; app/(tabs)/_layout.tsx connects it to the navigation.
 */
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/strings';
import { color, layout, radius, space } from '@/theme';

import { size } from './sizes';
import { Text } from './Text';

export type TabItem = { key: string; label: string; icon: LucideIcon };

export type TabBarProps = {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** True in the app: floats over the screen. False in the gallery: sits in the page. */
  floating?: boolean;
};

export function TabBar({ items, activeKey, onSelect, floating = true }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const bar = (
    <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel={strings.tabs.barLabel}>
      {items.map((item) => {
        const active = item.key === activeKey;
        const ink = active ? color.accent.gold : color.text.muted;
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
            <Icon size={size.icon.lg} color={ink} strokeWidth={active ? size.stroke.active : size.stroke.regular} />
            <Text variant="tab" color={active ? 'accent.gold' : 'text.muted'} numberOfLines={1}>
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

const styles = StyleSheet.create({
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
    paddingHorizontal: space.xs,
  },
  item: {
    flex: 1,
    height: size.tabItem,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
  },
});
