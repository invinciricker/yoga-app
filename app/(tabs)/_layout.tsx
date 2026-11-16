/**
 * The four tabs and the floating tab bar.
 * Each <Tabs.Screen> below matches a file in this folder (index = Today).
 */
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BookOpen, MapPin, Play, Sun, type LucideIcon } from 'lucide-react-native';

import { tick } from '@/lib/haptics';
import { strings } from '@/strings';
import { color } from '@/theme';
import { TabBar, type TabItem } from '@/ui';

// The icon of each tab, by the name of its file (docs/DESIGN.md).
const icons: Record<string, LucideIcon> = {
  index: Sun,
  practice: Play,
  journal: BookOpen,
  studio: MapPin,
};

/** Connects our TabBar part to the navigation. */
function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const items: TabItem[] = state.routes
    .filter((route) => icons[route.name])
    .map((route) => ({
      key: route.key,
      label: descriptors[route.key].options.title ?? route.name,
      icon: icons[route.name],
    }));

  const onSelect = (key: string) => {
    const alreadyThere = state.routes[state.index].key === key;
    const event = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!alreadyThere && !event.defaultPrevented) {
      tick(); // a light haptic when changing tab
      navigateToTab(key);
    }
  };

  return <TabBar items={items} activeKey={state.routes[state.index].key} onSelect={onSelect} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg.base } }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.today }} />
      <Tabs.Screen name="practice" options={{ title: strings.tabs.practice }} />
      <Tabs.Screen name="journal" options={{ title: strings.tabs.journal }} />
      <Tabs.Screen name="studio" options={{ title: strings.tabs.studio }} />
    </Tabs>
  );
}
