/**
 * Candlelight: the soft circle of gold light behind a greeting. It breathes slowly
 * (the only looping animation in the app) and stays still when "reduce motion" is on.
 * Place it inside a box with position relative; it sits at the top right, partly off screen.
 */
import { useEffect, useId } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/lib/motion';
import { color, motion } from '@/theme';

import { size } from './sizes';

const GLOW_OPACITY = 0.2; // gold at 20% in the centre, fading to nothing
// Where the circle sits, as fractions of its own size (matches the Today mockup).
const OFFSET_TOP = -0.33;
const OFFSET_RIGHT = -0.3;

export function Candlelight() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReduceMotion();
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reduce) {
      breath.set(1);
      return;
    }
    // Out and back in one "breath" duration, forever.
    breath.set(withRepeat(
      withTiming(size.breathScale, { duration: motion.duration.breath / 2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    ));
    return () => cancelAnimation(breath);
  }, [reduce, breath]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: breath.get() }] }));
  const d = size.candlelight;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: d, height: d, top: d * OFFSET_TOP, right: d * OFFSET_RIGHT }, animated]}
    >
      <Svg width={d} height={d}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset={0} stopColor={color.accent.gold} stopOpacity={GLOW_OPACITY} />
            <Stop offset={1} stopColor={color.accent.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute' },
});
