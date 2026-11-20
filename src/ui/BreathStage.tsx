/**
 * BreathStage: everything the breathing player shows (docs/phases/phase-7.md, section 4), drawn from
 * what it is given and nothing else, so the design gallery can show it at any moment. The player
 * (app/breath-play/[slug].tsx) owns the clock and moves `scale` and `left`.
 *
 *   the pacer: the `tide` aura over the whole stage, its disc growing and settling (BreathPacer);
 *   under the disc, one word, large ("In", "Hold", "Out", "Top up"), how ("through the nose"), and
 *     the count of the step (1, 2, 3, 4). Before the first step, "Settle in": the title, the round
 *     in short and the safety sentence. Paused: "Paused", with "Go on" and "Stop";
 *   the speaker at the top right (Sound, the same setting as the exercise's page), the pause button
 *     at the bottom, and a thin line along the bottom that shows how much is left (no numbers).
 *
 * A tap anywhere on the stage pauses. A screen reader hears the word at each change (a polite live
 * region). Always dark: the player wraps it in ThemeScope. The stage measures itself, so it fits the
 * window (the player) or any box (the gallery).
 */
import { Pause, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { standardEasing } from '@/lib/motion';
import { strings } from '@/strings';
import { layout, motion, space, withAlpha } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { BreathPacer, pacerGeometry } from './BreathPacer';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Overline } from './Overline';
import { size } from './sizes';
import { Text } from './Text';

export type StageState =
  | { kind: 'settle'; title: string; round: string }
  | { kind: 'step'; word: string; way?: string; count: number; /** Changes at every step: the word fades in anew. */ stepKey: string }
  | { kind: 'paused' }
  | { kind: 'end' };

export type BreathStageProps = {
  /** The disc's size, a part of its largest (0.45 to 1). */
  scale: SharedValue<number>;
  /** How much of the session is left, 1 to 0, for the thin line. */
  left: SharedValue<number>;
  /** "About 2 minutes left", for a screen reader (no numbers on screen). */
  leftLabel: string;
  state: StageState;
  sound: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onGoOn: () => void;
  onStop: () => void;
};

/** Fades its children in whenever `id` changes (120 ms): the word and the count. */
function FadeIn({ id, children }: { id: string; children: ReactNode }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.set(0);
    opacity.set(withTiming(1, { duration: motion.duration.quick, easing: standardEasing }));
  }, [id, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.View style={[styles.centre, style]}>{children}</Animated.View>;
}

export function BreathStage({ scale, left, leftLabel, state, sound, onToggleSound, onPause, onGoOn, onStop }: BreathStageProps) {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // The tallest the words have been (settling in, paused…): the disc keeps room for them, so on a
  // small phone with large text the words never reach the buttons, and the disc does not jump about.
  const [wordsHeight, setWordsHeight] = useState(0);
  const topRoom = insets.top + space.md + size.iconButton + space.md;
  const bottomRoom = insets.bottom + space.md + size.timeLine + space.lg + size.iconButton;
  const geometry = box ? pacerGeometry(box.w, box.h, { top: topRoom, bottom: bottomRoom, words: wordsHeight, gap: space.xxl }) : undefined;
  const wordsTop = geometry ? geometry.cy + geometry.radius + space.xxl : 0;
  const line = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, left.get())) * 100}%` }));
  const running = state.kind === 'settle' || state.kind === 'step';

  return (
    <Pressable
      style={styles.stage}
      onPress={running ? onPause : undefined}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      // The words and the buttons are read one by one; the pause button says what a tap does.
      accessible={false}
    >
      {geometry ? <BreathPacer scale={scale} geometry={geometry} /> : null}

      <View style={[styles.top, { top: insets.top + space.md }]}>
        <IconButton
          icon={sound ? Volume2 : VolumeX}
          kind="glass"
          accessibilityLabel={sound ? strings.breathe.soundOff : strings.breathe.soundOn}
          onPress={onToggleSound}
        />
      </View>

      {geometry ? (
        <View
          style={[styles.words, { top: wordsTop }]}
          onLayout={(e) => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            if (h > wordsHeight) setWordsHeight(h);
          }}
        >
          {state.kind === 'settle' ? (
            <FadeIn id="settle">
              <Overline tone="cover">{strings.breathe.settle}</Overline>
              <Text variant="h1" color="onCover.primary" center accessibilityRole="header">
                {state.title}
              </Text>
              <Text variant="body" color="onCover.secondary" center tabular>
                {state.round}
              </Text>
              <Text variant="meta" color="onCover.secondary" center style={styles.safety}>
                {strings.breathe.safety}
              </Text>
            </FadeIn>
          ) : state.kind === 'step' ? (
            <FadeIn id={`${state.stepKey}-${state.count}`}>
              <Text variant="display" color="onCover.primary" center aria-live="polite">
                {state.word}
              </Text>
              {state.way ? (
                <Text variant="body" color="onCover.secondary" center>
                  {state.way}
                </Text>
              ) : null}
              <Text variant="meta" color="onCover.secondary" center tabular style={styles.count}>
                {state.count}
              </Text>
            </FadeIn>
          ) : state.kind === 'paused' ? (
            <FadeIn id="paused">
              <Text variant="display" color="onCover.primary" center aria-live="polite">
                {strings.breathe.paused}
              </Text>
              <View style={styles.pausedButtons}>
                <Button label={strings.breathe.goOn} shape="pill" onPress={onGoOn} />
                <Button kind="quiet" onCover label={strings.breathe.stop} onPress={onStop} />
              </View>
            </FadeIn>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.bottom, { bottom: insets.bottom + space.md }]}>
        {running ? (
          <IconButton icon={Pause} kind="glass" accessibilityLabel={strings.breathe.pause} onPress={onPause} />
        ) : (
          <View style={styles.buttonSpace} />
        )}
        <View
          style={[styles.track, { backgroundColor: withAlpha(color.text.primary, size.timeLineTrack) }]}
          accessible
          accessibilityLabel={leftLabel}
        >
          <Animated.View style={[styles.fill, { backgroundColor: color.area.breathe }, line]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, overflow: 'hidden' },
  top: { position: 'absolute', right: layout.gutter, flexDirection: 'row' },
  words: { position: 'absolute', left: layout.gutter, right: layout.gutter, alignItems: 'center' },
  centre: { alignItems: 'center', gap: space.xs, maxWidth: layout.maxContentWidth - layout.gutter * 2 },
  safety: { marginTop: space.sm, maxWidth: size.readWidth },
  count: { marginTop: space.xxs },
  pausedButtons: { alignItems: 'center', gap: space.xs, marginTop: space.lg },
  bottom: { position: 'absolute', left: layout.gutter, right: layout.gutter, alignItems: 'center', gap: space.lg },
  buttonSpace: { height: size.iconButton },
  track: { alignSelf: 'stretch', height: size.timeLine, borderRadius: size.timeLine / 2, overflow: 'hidden' },
  fill: { height: '100%' },
});
