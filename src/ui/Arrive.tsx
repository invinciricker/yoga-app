/**
 * Arrive: a section of a screen fades in and rises a little when the screen is visited.
 * Give each section its place in the order (index 0, 1, 2…); they follow each other 40 ms apart.
 * It plays once per visit, not on every re-render. With "reduce motion" on, it only fades.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { standardEasing, useReduceMotion } from '@/lib/motion';
import { motion } from '@/theme';

import { size } from './sizes';

export type ArriveProps = {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

export function Arrive({ children, index = 0, style }: ArriveProps) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(0); // 0 = not here yet, 1 = arrived

  useFocusEffect(
    useCallback(() => {
      const step = Math.min(index, size.arriveSteps - 1);
      progress.set(0);
      progress.set(withDelay(
        reduce ? 0 : step * motion.stagger,
        withTiming(1, { duration: reduce ? motion.duration.quick : motion.duration.base, easing: standardEasing }),
      ));
    }, [index, reduce, progress]),
  );

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduce ? 0 : (1 - progress.get()) * size.rise }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
