/**
 * Button: five kinds.
 *   primary  the gold one. ONE per screen. With shape="pill" it is the smaller rounded one
 *            that sits on a cover ("Begin"). Gold as a fill, with a hairline around it.
 *   ghost    a hairline outline, for second choices.
 *   quiet    text only, for the least important action.
 *   link     gold words, with the icon after them ("Read the note →").
 *   glass    a translucent pill for the top of a cover or the billboard ("Meet Maria →").
 *            48 high; with small, 40 high (the touch area stays 48).
 * On a cover or an aura, give quiet and link buttons `onCover`: their words take the onCover.*
 * colours, which are the same in both themes ("Skip" on the welcome).
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { inkColors, layout, radius, space, type InkColor } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text, type TextVariant } from './Text';

export type ButtonKind = 'primary' | 'ghost' | 'quiet' | 'link' | 'glass';

export type ButtonProps = {
  label: string;
  kind?: ButtonKind;
  icon?: LucideIcon;
  /** Draws the icon as a solid shape (the play triangle). */
  iconFilled?: boolean;
  /** "pill": 52 high with fully round ends, as wide as its words. */
  shape?: 'block' | 'pill';
  /** Glass only: the smaller pill, 40 high. */
  small?: boolean;
  /** Quiet and link only: drawn on a cover, so the words use the onCover.* colours. */
  onCover?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  /** Layout of the button on the screen (for example alignSelf). */
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const look: Record<ButtonKind, { text: TextVariant; ink: InkColor; iconInk: InkColor; iconAfter: boolean }> = {
  primary: { text: 'title', ink: 'text.onAccent', iconInk: 'text.onAccent', iconAfter: false },
  ghost: { text: 'label', ink: 'text.primary', iconInk: 'accent.gold', iconAfter: false },
  quiet: { text: 'label', ink: 'text.secondary', iconInk: 'text.secondary', iconAfter: false },
  link: { text: 'label', ink: 'accent.gold', iconInk: 'accent.gold', iconAfter: true },
  glass: { text: 'label', ink: 'onCover.primary', iconInk: 'onCover.primary', iconAfter: true },
};

/** The words of a quiet or link button drawn on a cover. */
const onCoverInk: Partial<Record<ButtonKind, InkColor>> = { quiet: 'onCover.secondary', link: 'onCover.accent' };

export function Button({
  label,
  kind = 'primary',
  icon: Icon,
  iconFilled = false,
  shape = 'block',
  small = false,
  onCover = false,
  onPress,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { color } = useTheme();
  const styles = useStyles();
  const coverInk = onCover ? onCoverInk[kind] : undefined;
  const l = coverInk ? { ...look[kind], ink: coverInk, iconInk: coverInk } : look[kind];
  const compact = kind === 'glass' && small;
  const icon = Icon ? (
    <Icon
      size={compact ? size.icon.xs : kind === 'link' ? size.icon.sm : size.icon.md}
      strokeWidth={iconFilled ? size.stroke.active : size.stroke.regular}
      color={inkColors(color)[l.iconInk]}
      fill={iconFilled ? inkColors(color)[l.iconInk] : 'none'}
    />
  ) : null;
  // The small glass pill is 40 high; the touch area reaches 48.
  const slop = compact ? (layout.touchMin - size.button.glassSmall) / 2 : undefined;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={slop === undefined ? undefined : { top: slop, bottom: slop }}
      containerStyle={style}
      style={[shapes.base, styles[kind], shape === 'pill' && shapes.pill, compact && shapes.small]}
    >
      {l.iconAfter ? null : icon}
      <Text variant={l.text} color={l.ink} numberOfLines={1}>
        {label}
      </Text>
      {l.iconAfter ? icon : null}
    </PressableScale>
  );
}

// What holds no colour.
const shapes = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.xl,
    minWidth: layout.touchMin,
    borderRadius: radius.lg,
  },
  pill: { minHeight: size.button.pill, borderRadius: radius.pill },
  small: { minHeight: size.button.glassSmall, paddingHorizontal: space.md, gap: space.xxs },
});

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    primary: {
      minHeight: size.button.primary,
      backgroundColor: color.accent.fill,
      borderWidth: size.stroke.hairline,
      borderColor: color.accent.fillBorder,
    },
    ghost: {
      minHeight: size.button.ghost,
      borderWidth: size.stroke.hairline,
      borderColor: color.border.strong,
    },
    quiet: { minHeight: size.button.quiet, paddingHorizontal: space.md },
    link: { minHeight: size.button.quiet, paddingHorizontal: 0, justifyContent: 'flex-start' },
    glass: {
      minHeight: size.button.glass,
      borderRadius: radius.pill,
      paddingHorizontal: space.lg,
      backgroundColor: color.glass,
      borderWidth: size.stroke.hairline,
      borderColor: color.glassBorder,
    },
  }),
);
