/**
 * IconButton: a round button holding one icon. Always give it a label for screen readers.
 *   raised  on a screen
 *   glass   on top of a cover (its icon in onCover.primary, the same in both themes)
 * With `active` the icon is filled with gold (a saved lesson's bookmark): accent.gold on a screen,
 * onCover.accent on a cover (the bronze of the light theme cannot be read on a night picture).
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';

export type IconButtonProps = {
  icon: LucideIcon;
  /** What the button does, read aloud by screen readers. Required. */
  accessibilityLabel: string;
  kind?: 'raised' | 'glass';
  onPress?: () => void;
  disabled?: boolean;
  /** The icon filled with gold. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  accessibilityLabel,
  kind = 'raised',
  onPress,
  disabled,
  active = false,
  style,
}: IconButtonProps) {
  const { color, onCover } = useTheme();
  const styles = useStyles();
  const gold = kind === 'glass' ? onCover.accent : color.accent.gold;
  const ink = active ? gold : kind === 'glass' ? onCover.primary : color.text.primary;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      containerStyle={style}
      style={[shape.base, styles[kind]]}
    >
      <Icon size={size.icon.lg} strokeWidth={size.stroke.regular} color={ink} fill={active ? ink : 'none'} />
    </PressableScale>
  );
}

const shape = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    raised: { backgroundColor: color.bg.raised, borderColor: color.border.strong },
    glass: { backgroundColor: color.glass, borderColor: color.glassBorder },
  }),
);
