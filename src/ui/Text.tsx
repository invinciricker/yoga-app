/**
 * Text: the only way to put words on screen.
 * Pick a style by name (variant) and a colour by its token path. Never set a font size elsewhere.
 */
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { font, inkColors, type InkColor, type } from '@/theme';

import { size } from './sizes';

export type TextVariant = keyof typeof type;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: InkColor;
  /** Cormorant italic: Maria's words and the second line of a greeting. Nowhere else. */
  italic?: boolean;
  /** Times and counts that line up. */
  tabular?: boolean;
  center?: boolean;
};

export function Text({
  variant = 'body',
  color = 'text.primary',
  italic = false,
  tabular = false,
  center = false,
  style,
  ...rest
}: TextProps) {
  const extra: TextStyle = {
    color: inkColors[color],
    ...(variant === 'overline' ? { textTransform: 'uppercase' } : null),
    ...(italic ? { fontFamily: font.displayItalic } : null),
    ...(tabular ? { fontVariant: ['tabular-nums'] } : null),
    ...(center ? { textAlign: 'center' } : null),
  };
  return (
    <RNText maxFontSizeMultiplier={size.fontScaleMax} {...rest} style={[type[variant], extra, style]} />
  );
}
