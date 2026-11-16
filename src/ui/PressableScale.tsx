/**
 * PressableScale: the press behaviour of every card and button.
 * It shrinks a little while pressed and comes back. With "reduce motion" on, it only dims.
 */
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { standardEasing, useReduceMotion } from '@/lib/motion';
import { motion, opacity } from '@/theme';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Style of the part that is seen (and that scales). */
  style?: StyleProp<ViewStyle>;
  /** Style of the outer touch area, for layout such as flex or alignSelf. */
  containerStyle?: StyleProp<ViewStyle>;
};

export function PressableScale({
  children,
  style,
  containerStyle,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduce = useReduceMotion();
  const pressed = useSharedValue(0); // 0 = resting, 1 = pressed

  const animated = useAnimatedStyle(() => ({
    opacity: disabled ? opacity.disabled : 1 - pressed.get() * (1 - opacity.pressed),
    transform: [{ scale: reduce ? 1 : 1 - pressed.get() * (1 - motion.pressScale) }],
  }));

  const timing = { duration: motion.duration.quick, easing: standardEasing };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={containerStyle}
      onPressIn={(e) => {
        pressed.set(withTiming(1, timing));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, timing));
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
