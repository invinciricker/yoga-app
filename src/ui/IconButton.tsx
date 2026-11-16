/**
 * IconButton: a round button holding one icon. Always give it a label for screen readers.
 *   raised  on a screen
 *   glass   on top of a cover
 */
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius } from '@/theme';

import { PressableScale } from './PressableScale';
import { size } from './sizes';

export type IconButtonProps = {
  icon: LucideIcon;
  /** What the button does, read aloud by screen readers. Required. */
  accessibilityLabel: string;
  kind?: 'raised' | 'glass';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon: Icon, accessibilityLabel, kind = 'raised', onPress, disabled, style }: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      containerStyle={style}
      style={[styles.base, styles[kind]]}
    >
      <Icon size={size.icon.lg} strokeWidth={size.stroke.regular} color={color.text.primary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raised: { backgroundColor: color.bg.raised, borderColor: color.border.strong },
  glass: { backgroundColor: color.glass, borderColor: color.glassBorder },
});
