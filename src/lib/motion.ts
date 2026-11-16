/**
 * Motion helpers shared by the parts.
 */
import { Easing, useReducedMotion } from 'react-native-reanimated';

import { motion } from '@/theme';

/**
 * True when the phone's "reduce motion" setting is on.
 * Then: no arriving, no breathing, no scaling; only short fades.
 * (Phase 3 adds the app's own switch here, so every part follows it.)
 */
export function useReduceMotion(): boolean {
  return useReducedMotion();
}

const [x1, y1, x2, y2] = motion.easing.standard;
/** The app's one easing curve for things that arrive or respond. */
export const standardEasing = Easing.bezier(x1, y1, x2, y2);
