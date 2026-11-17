/**
 * PlayButton: the round gold button in the middle of a lesson's cover.
 * It is one of the few things allowed to glow (docs/DESIGN.md, "Colour").
 */
import { Play } from 'lucide-react-native';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { radius } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';

const GLOW_OPACITY = 0.3; // gold at 30% at the rim of the button, fading to nothing

export type PlayButtonProps = { accessibilityLabel: string; onPress: () => void };

export function PlayButton({ accessibilityLabel, onPress }: PlayButtonProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { color } = useTheme();
  const styles = useStyles();
  const glow = size.play * size.playGlow;
  return (
    <View style={[styles.box, { width: glow, height: glow }]} pointerEvents="box-none">
      <Svg width={glow} height={glow} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset={1 / size.playGlow} stopColor={color.accent.fill} stopOpacity={GLOW_OPACITY} />
            <Stop offset={1} stopColor={color.accent.fill} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill={`url(#${id})`} />
      </Svg>
      <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.button}>
        {/* The triangle looks centred only when it sits a little to the right. */}
        <Play
          size={size.playIcon}
          color={color.text.onAccent}
          fill={color.text.onAccent}
          strokeWidth={size.stroke.active}
          style={styles.nudge}
        />
      </PressableScale>
    </View>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    box: { alignItems: 'center', justifyContent: 'center' },
    button: {
      width: size.play,
      height: size.play,
      borderRadius: radius.pill,
      backgroundColor: color.accent.fill,
      borderWidth: size.stroke.hairline,
      borderColor: color.accent.fillBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nudge: { marginLeft: size.stroke.active * 2 },
  }),
);
