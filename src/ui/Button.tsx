/**
 * Button: three kinds.
 *   primary  the gold one. ONE per screen.
 *   ghost    a hairline outline, for second choices.
 *   quiet    text only, for the least important action.
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, inkColors, layout, radius, space, type InkColor } from '@/theme';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text, type TextVariant } from './Text';

export type ButtonKind = 'primary' | 'ghost' | 'quiet';

export type ButtonProps = {
  label: string;
  kind?: ButtonKind;
  icon?: LucideIcon;
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
};

export function Button({ label, kind = 'primary', icon: Icon, onPress, disabled, style, accessibilityHint }: ButtonProps) {
  const l = look[kind];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      containerStyle={style}
      style={[styles.base, styles[kind]]}
    >
      {Icon ? <Icon size={size.icon.md} strokeWidth={size.stroke.regular} color={inkColors[l.iconInk]} /> : null}
      <Text variant={l.text} color={l.ink} numberOfLines={1}>
        {label}
      </Text>
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
});
