/**
 * Cover: the picture of a lesson, a series or a note.
 * Shows the photo when the content has one, otherwise the aura. When text sits on it, ask for
 * the scrim (a dark veil rising from the bottom) so the words stay readable.
 *
 * A photo comes in several widths (the content build makes them). The cover measures itself and
 * downloads the smallest one that is still sharp on this screen. While it loads, the tiny blurred
 * preview stored in the content (the "blurhash") is shown. Photos are kept on the phone's disk,
 * so they are still there without the network.
 */
import { Image } from 'expo-image';
import { useId, useState, type ReactNode } from 'react';
import { PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { Image as ContentImage } from '../../shared/content-schema';

import { pickVariant, pictureUrl } from '@/content/pictures';
import { color, motion, radius as radii, splitAlpha, type AuraName } from '@/theme';

import { Aura } from './Aura';
import { size } from './sizes';

export type CoverProps = {
  aura: AuraName;
  /** The photo from the content, when there is one. */
  image?: ContentImage;
  /** Give a height, or an aspect (width divided by height). */
  height?: number;
  aspect?: number;
  width?: number;
  /** "none" for a cover that runs edge to edge. */
  radius?: keyof typeof radii | 'none';
  /** Dark veil over the lower part. Use whenever text sits on the cover. */
  scrim?: boolean;
  /** The lower part melts into the screen's background (the top of a lesson). */
  fade?: boolean;
  /** Text and buttons drawn on top. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const veil = splitAlpha(color.scrim);

export function Cover({ aura, image, height, aspect, width, radius = 'lg', scrim = false, fade = false, children, style }: CoverProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  // The width on screen, known after the first layout. Until then only the blurred preview shows.
  const [shownWidth, setShownWidth] = useState(0);
  const variant = image && shownWidth > 0 ? pickVariant(image, shownWidth * PixelRatio.get()) : undefined;

  // The veil: a gradient from nothing to the scrim colour, or to the screen colour for "fade".
  const to = fade ? { color: color.bg.base, opacity: 1 } : veil;
  const veilHeight = fade ? size.fadeHeight : size.scrimHeight;

  return (
    <View
      style={[styles.box, { height, width, aspectRatio: aspect, borderRadius: radius === 'none' ? 0 : radii[radius] }, style]}
      onLayout={image ? (e) => setShownWidth(e.nativeEvent.layout.width) : undefined}
    >
      {image ? (
        <Image
          source={variant ? { uri: pictureUrl(variant.path) } : undefined}
          placeholder={{ blurhash: image.blurhash }}
          placeholderContentFit="cover"
          contentFit="cover"
          cachePolicy="disk"
          transition={motion.duration.base}
          style={StyleSheet.absoluteFill}
          accessible={image.alt !== ''}
          accessibilityLabel={image.alt}
          alt={image.alt}
        />
      ) : (
        <Aura name={aura} />
      )}
      {scrim || fade ? (
        <View style={[styles.veil, { height: `${veilHeight * 100}%` }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset={0} stopColor={to.color} stopOpacity={0} />
                <Stop offset={1} stopColor={to.color} stopOpacity={to.opacity} />
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
  veil: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
