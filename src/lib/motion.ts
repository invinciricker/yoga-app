/**
 * Motion helpers shared by the parts.
 */
import { Easing, useReducedMotion } from 'react-native-reanimated';

import { motion } from '@/theme';

import { usePrefs } from './prefs';

/**
 * True when the phone's "reduce motion" setting is on, OR the app's own switch in You.
 * Then: no arriving, no breathing, no scaling, no sliding; only short fades.
 * Everything that moves asks this, so flipping the switch stills the whole app at once.
 */
export function useReduceMotion(): boolean {
  const phone = useReducedMotion();
  const app = usePrefs((s) => s.reduceMotion);
  return phone || app;
}

const [x1, y1, x2, y2] = motion.easing.standard;
/** The app's one easing curve for things that arrive or respond. */
export const standardEasing = Easing.bezier(x1, y1, x2, y2);
