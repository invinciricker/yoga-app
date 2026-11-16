/**
 * Overline: the small uppercase label above a block. It labels; it never carries the message.
 * Gold or muted, nothing else.
 */
import { Text, type TextProps } from './Text';

export type OverlineProps = Omit<TextProps, 'variant' | 'color'> & {
  tone?: 'gold' | 'muted';
};

export function Overline({ tone = 'gold', ...rest }: OverlineProps) {
  return <Text variant="overline" color={tone === 'gold' ? 'accent.gold' : 'text.muted'} {...rest} />;
}
