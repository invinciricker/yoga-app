/**
 * Small touches of vibration. One place, so that a phone without haptics (or the web preview)
 * never causes an error.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** A light tick: changing tab, saving a lesson, choosing a reaction, each step of the breathing pacer. */
export function tick(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // No haptics on this device: nothing to do.
  });
}

/**
 * A firmer tick: the start of every breath in, on the breathing pacer (Phase 7), so it can be felt
 * with eyes closed, next to the light tick of every other step.
 */
export function firm(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
    // No haptics on this device: nothing to do.
  });
}

/** A success in the hand: a lesson is done, a breathing session ends (its closing screen opens). */
export function success(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
    // No haptics on this device: nothing to do.
  });
}
