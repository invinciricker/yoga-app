/**
 * Cover: the picture of a lesson, a series or a note.
 * Shows the photo when there is one, otherwise the aura. When text sits on it, ask for the scrim
 * (a dark veil rising from the bottom) so the words stay readable.
 */
import { Image, type ImageSource } from 'expo-image';
import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { color, motion, radius as radii, splitAlpha, type AuraName } from '@/theme';

import { Aura } from './Aura';
import { size } from './sizes';

export type CoverProps = {
  aura: AuraName;
  /** A photo, when the content has one. */
  photo?: ImageSource;
  /** Give a height, or an aspect (width divided by height). */
  height?: number;
  aspect?: number;
  width?: number;
  radius?: keyof typeof radii;
  /** Dark veil over the lower part. Use whenever text sits on the cover. */
  scrim?: boolean;
  /** Text and buttons drawn on top. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const veil = splitAlpha(color.scrim);

export function Cover({ aura, photo, height, aspect, width, radius = 'lg', scrim = false, children, style }: CoverProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View style={[styles.box, { height, width, aspectRatio: aspect, borderRadius: radii[radius] }, style]}>
      {photo ? (
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={motion.duration.base} />
      ) : (
        <Aura name={aura} />
      )}
      {scrim ? (
        <View style={styles.scrim} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor={veil.color} stopOpacity={0} />
                <Stop offset={1} stopColor={veil.color} stopOpacity={veil.opacity} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}s)`} />
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: color.bg.raised },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: `${size.scrimHeight * 100}%` },
});
