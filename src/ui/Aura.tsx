/**
 * Aura: a cover made of light, used when there is no photo.
 * A small night scene: a ground gradient, two soft glows, and one bright disc with a halo
 * (a moon, a sun, a flame). The disc is what makes it a picture: it is never left out.
 * It fills its parent, so put it inside a box that has a size (Cover does this).
 */
import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { aura, type AuraName } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

// How the scenes are drawn (same proportions as docs/design/mockups.html).
const GROUND_STOPS = [0, 0.55, 1]; // where the three ground colours sit, top to bottom
const GLOW_FADE = 0.6; // a glow is fully gone at this fraction of its radius
export const HALO_SCALE = 3; // the halo is this many times the disc
export const HALO_OPACITY = 0.35;
export const HALO_MID = { at: 0.6, opacity: 0.1 }; // the halo falls off quickly, then lingers

export type AuraProps = {
  name: AuraName;
  /**
   * Leaves out the disc and its halo: only for the breathing pacer (Phase 7), which draws the
   * scene's disc itself, large and in the middle, growing and settling with the breath.
   */
  withoutDisc?: boolean;
};

export function Aura({ name, withoutDisc = false }: AuraProps) {
  const scene = aura[name];
  // Auras look the same in both themes: the halo is the light gold used on covers.
  const { onCover } = useTheme();
  // Gradient ids must be unique on the page (the web shares one id space).
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: scene.ground[0] }]}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {box && box.w > 0 && box.h > 0 ? (
        <Svg width={box.w} height={box.h}>
          <Defs>
            <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
              {scene.ground.map((c, i) => (
                <Stop key={i} offset={GROUND_STOPS[i]} stopColor={c} />
              ))}
            </LinearGradient>
            {scene.glows.map((glow, i) => (
              <RadialGradient key={i} id={`${id}w${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset={0} stopColor={glow.color} stopOpacity={glow.opacity} />
                <Stop offset={GLOW_FADE} stopColor={glow.color} stopOpacity={0} />
                <Stop offset={1} stopColor={glow.color} stopOpacity={0} />
              </RadialGradient>
            ))}
            <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
              <Stop offset={1 / HALO_SCALE} stopColor={onCover.accent} stopOpacity={HALO_OPACITY} />
              <Stop offset={HALO_MID.at} stopColor={onCover.accent} stopOpacity={HALO_MID.opacity} />
              <Stop offset={1} stopColor={onCover.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* The ground */}
          <Rect x={0} y={0} width={box.w} height={box.h} fill={`url(#${id}g)`} />

          {/* The two glows: positions and radii are fractions of the width and height */}
          {scene.glows.map((glow, i) => (
            <Ellipse
              key={i}
              cx={glow.cx * box.w}
              cy={glow.cy * box.h}
              rx={glow.r * box.w}
              ry={glow.r * box.h}
              fill={`url(#${id}w${i})`}
            />
          ))}

          {/* The disc and its halo: the radius is a fraction of the width */}
          {withoutDisc ? null : (
            <>
              <Circle
                cx={scene.disc.cx * box.w}
                cy={scene.disc.cy * box.h}
                r={scene.disc.r * box.w * HALO_SCALE}
                fill={`url(#${id}h)`}
              />
              <Circle cx={scene.disc.cx * box.w} cy={scene.disc.cy * box.h} r={scene.disc.r * box.w} fill={scene.disc.color} />
            </>
          )}
        </Svg>
      ) : null}
    </View>
  );
}
