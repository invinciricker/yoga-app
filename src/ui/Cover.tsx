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
import { useReduceMotion } from '@/lib/motion';
import { motion, radius as radii, splitAlpha, type AuraName } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

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
  /** Which part of the photo stays in view when it is cropped: the top for a portrait. */
  imagePosition?: 'center' | 'top';
  /** Text and buttons drawn on top. Words over a cover use the onCover.* colours. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Cover({
  aura,
  image,
  height,
  aspect,
  width,
  radius = 'lg',
  scrim = false,
  fade = false,
  imagePosition = 'center',
  children,
  style,
}: CoverProps) {
  const { color } = useTheme();
  const styles = useStyles();
  const reduce = useReduceMotion();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  // The width on screen, known after the first layout. Until then only the blurred preview shows.
  const [shownWidth, setShownWidth] = useState(0);
  const variant = image && shownWidth > 0 ? pickVariant(image, shownWidth * PixelRatio.get()) : undefined;

  // The veil: a gradient from nothing to the scrim colour, or to the screen colour for "fade".
  // The scrim is the same in both themes (covers are pictures); the fade melts into the screen.
  const to = fade ? { color: color.bg.base, opacity: 1 } : splitAlpha(color.scrim);
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
          contentPosition={imagePosition}
          cachePolicy="disk"
          // The photo fades in over its blurred preview; shorter with "reduce motion".
          transition={reduce ? motion.duration.quick : motion.duration.base}
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

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    box: { overflow: 'hidden', backgroundColor: color.bg.raised },
    veil: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  }),
);
