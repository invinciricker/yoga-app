/**
 * The five tabs and the floating tab bar (docs/V2.md, "The map").
 * Each <Tabs.Screen> below matches a file in this folder (index = Home).
 *
 * Breathe, Meditate and Journal are opened by their own phases (`areas` in src/config.ts). Until
 * then the public app hides their tabs and the preview app shows a placeholder in them. A built area
 * with nothing in it (Breathe with no exercise published) is hidden the same way (src/lib/areas.ts).
 *
 * The very first time the app opens (the welcome not yet seen), the tabs give their place to the
 * welcome before anything is drawn. The answer is read once, when the tabs first appear: "Show the
 * welcome again" in About opens the welcome on top instead.
 */
import { Redirect, Tabs } from 'expo-router';
import { useState } from 'react';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Feather, House, Moon, Play, Wind, type LucideIcon } from 'lucide-react-native';

import type { BuildingArea } from '@/config';
import { useAreas } from '@/lib/areas';
import { tick } from '@/lib/haptics';
import { routes } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import type { Area } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { TabBar, type TabItem } from '@/ui';

// The icon and the area (its colour) of each tab, by the name of its file.
const tabs: Record<string, { icon: LucideIcon; area: Area; building?: BuildingArea }> = {
  index: { icon: House, area: 'home' },
  practice: { icon: Play, area: 'move' },
  breathe: { icon: Wind, area: 'breathe', building: 'breathe' },
  meditate: { icon: Moon, area: 'sit', building: 'meditate' },
  journal: { icon: Feather, area: 'write', building: 'journal' },
};

/**
 * A tab shows when its area is built and has something in it, or in the preview app (which shows a
 * placeholder, or a quiet line when there is nothing in it yet).
 */
function shown(name: string, available: Record<BuildingArea, boolean>): boolean {
  const tab = tabs[name];
  if (!tab) return false;
  return !tab.building || available[tab.building] || isPreview;
}

/** Connects our TabBar part to the navigation. */
function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const available = useAreas();
  const items: TabItem[] = state.routes
    .filter((route) => shown(route.name, available))
    .map((route) => ({
      key: route.key,
      label: descriptors[route.key].options.title ?? route.name,
      icon: tabs[route.name].icon,
      area: tabs[route.name].area,
    }));

  const onSelect = (key: string) => {
    const alreadyThere = state.routes[state.index].key === key;
    // The screen hears this too: Home scrolls back to its top when its tab is tapped again.
    const event = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!alreadyThere && !event.defaultPrevented) {
      tick(); // a light haptic when changing tab
      navigateToTab(key);
    }
  };

  return <TabBar items={items} activeKey={state.routes[state.index].key} onSelect={onSelect} />;
}

export default function TabsLayout() {
  const { color } = useTheme();
  const [needsWelcome] = useState(() => !usePrefs.getState().welcomeSeen);
  if (needsWelcome) return <Redirect href={routes.welcome} />;
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg.base } }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.home }} />
      <Tabs.Screen name="practice" options={{ title: strings.tabs.practice }} />
      <Tabs.Screen name="breathe" options={{ title: strings.tabs.breathe }} />
      <Tabs.Screen name="meditate" options={{ title: strings.tabs.meditate }} />
      <Tabs.Screen name="journal" options={{ title: strings.tabs.journal }} />
    </Tabs>
  );
}
