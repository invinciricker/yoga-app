/**
 * BreathPacer: the picture of the breathing player (docs/phases/phase-7.md, section 4). The `tide`
 * aura fills the screen; its disc, moved to the middle and made large, grows with the air in and
 * settles with the air out, its halo with it. `scale` is the disc's size as a part of its largest
 * (0.45 empty, 1 full: discSize in src/breathe/session.ts), moved by the player on the UI thread.
 * Where the disc sits and how large it may grow come from BreathStage (`pacerGeometry`), which
 * leaves room for the words under it. Always drawn inside the dark room (the player wraps it in
 * ThemeScope).
 */
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { aura, layout } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { Aura, HALO_MID, HALO_OPACITY, HALO_SCALE } from './Aura';
import { size } from './sizes';

/** Where the disc's centre is, and its radius at full size. */
export type PacerGeometry = { cx: number; cy: number; radius: number };

export type BreathPacerProps = { scale: SharedValue<number>; geometry: PacerGeometry };

/**
 * Where the disc goes on a stage of this size: its centre at 36 % of the height and its full
 * radius a fifth of the column, unless the words under it (`wordsHeight`, measured) would then
 * reach the controls at the bottom (`bottomRoom`) or the disc the speaker at the top (`topRoom`):
 * then it rises, and if need be grows less. On an ordinary phone nothing is in the way.
 */
export function pacerGeometry(
  width: number,
  height: number,
  room: { top: number; bottom: number; words: number; gap: number } = { top: 0, bottom: 0, words: 0, gap: 0 },
): PacerGeometry {
  const column = Math.min(width, layout.maxContentWidth);
  const lowest = height - room.bottom - room.gap - room.words - room.gap; // the disc's bottom edge may not pass this
  const radius = Math.max(0, Math.min(column * size.pacer.disc, (lowest - room.top) / 2));
  const cy = Math.min(height * size.pacer.centre, lowest - radius);
  return { cx: width / 2, cy, radius };
}

export function BreathPacer({ scale, geometry }: BreathPacerProps) {
  const { onCover } = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { cx, cy, radius } = geometry;
  const halo = radius * HALO_SCALE;
  const grows = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Aura name="tide" withoutDisc />
      <Animated.View style={[styles.disc, { left: cx - halo, top: cy - halo, width: halo * 2, height: halo * 2 }, grows]}>
        <Svg width={halo * 2} height={halo * 2}>
          <Defs>
            {/* The same halo as every aura's disc: light gold, falling off quickly, then lingering. */}
            <RadialGradient id={id} cx="50%" cy="50%" r="50%">
              <Stop offset={1 / HALO_SCALE} stopColor={onCover.accent} stopOpacity={HALO_OPACITY} />
              <Stop offset={HALO_MID.at} stopColor={onCover.accent} stopOpacity={HALO_MID.opacity} />
              <Stop offset={1} stopColor={onCover.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={halo} cy={halo} r={halo} fill={`url(#${id})`} />
          <Circle cx={halo} cy={halo} r={radius} fill={aura.tide.disc.color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { position: 'absolute' },
});
