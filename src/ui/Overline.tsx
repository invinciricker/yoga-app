/**
 * Overline: the small uppercase label above a block. It labels; it never carries the message.
 *   gold   the usual one (accent.gold)
 *   muted  a quieter one
 *   area   the colour of an area, inside that area: <Overline tone="area" area="move">
 *   cover  on top of a cover or an aura (onCover.accent, the same in both themes)
 */
import type { Area, InkColor } from '@/theme';

import { Text, type TextProps } from './Text';

export type OverlineProps = Omit<TextProps, 'variant' | 'color'> & {
  tone?: 'gold' | 'muted' | 'area' | 'cover';
  /** With tone="area": which area. */
  area?: Area;
};

export function Overline({ tone = 'gold', area = 'home', ...rest }: OverlineProps) {
  const ink: InkColor =
    tone === 'muted' ? 'text.muted' : tone === 'cover' ? 'onCover.accent' : tone === 'area' ? `area.${area}` : 'accent.gold';
  return <Text variant="overline" color={ink} {...rest} />;
}
