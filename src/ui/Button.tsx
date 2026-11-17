/**
 * Button: four kinds.
 *   primary  the gold one. ONE per screen. With shape="pill" it is the smaller rounded one
 *            that sits on a cover ("Begin").
 *   ghost    a hairline outline, for second choices.
 *   quiet    text only, for the least important action.
 *   link     gold words, with the icon after them ("Read the note →").
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, inkColors, layout, radius, space, type InkColor } from '@/theme';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text, type TextVariant } from './Text';

export type ButtonKind = 'primary' | 'ghost' | 'quiet' | 'link';

export type ButtonProps = {
  label: string;
  kind?: ButtonKind;
  icon?: LucideIcon;
  /** Draws the icon as a solid shape (the play triangle). */
  iconFilled?: boolean;
  /** "pill": 52 high with fully round ends, as wide as its words. */
  shape?: 'block' | 'pill';
  onPress?: () => void;
  disabled?: boolean;
  /** Layout of the button on the screen (for example alignSelf). */
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const look: Record<ButtonKind, { text: TextVariant; ink: InkColor; iconInk: InkColor }> = {
  primary: { text: 'title', ink: 'text.onAccent', iconInk: 'text.onAccent' },
  ghost: { text: 'label', ink: 'text.primary', iconInk: 'accent.gold' },
  quiet: { text: 'label', ink: 'text.secondary', iconInk: 'text.secondary' },
  link: { text: 'label', ink: 'accent.gold', iconInk: 'accent.gold' },
};

export function Button({
  label,
  kind = 'primary',
  icon: Icon,
  iconFilled = false,
  shape = 'block',
  onPress,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const l = look[kind];
  const icon = Icon ? (
    <Icon
      size={kind === 'link' ? size.icon.sm : size.icon.md}
      strokeWidth={iconFilled ? size.stroke.active : size.stroke.regular}
      color={inkColors[l.iconInk]}
      fill={iconFilled ? inkColors[l.iconInk] : 'none'}
    />
  ) : null;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      containerStyle={style}
      style={[styles.base, styles[kind], shape === 'pill' && styles.pill]}
    >
      {kind === 'link' ? null : icon}
      <Text variant={l.text} color={l.ink} numberOfLines={1}>
        {label}
      </Text>
      {kind === 'link' ? icon : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.xl,
    minWidth: layout.touchMin,
    borderRadius: radius.lg,
  },
  primary: { minHeight: size.button.primary, backgroundColor: color.accent.gold },
  ghost: {
    minHeight: size.button.ghost,
    borderWidth: size.stroke.hairline,
    borderColor: color.border.strong,
  },
  quiet: { minHeight: size.button.quiet, paddingHorizontal: space.md },
  link: { minHeight: size.button.quiet, paddingHorizontal: 0, justifyContent: 'flex-start' },
  pill: { minHeight: size.button.pill, borderRadius: radius.pill },
});
