/**
 * Storage: the one small wrapper around the phone's key-value store (AsyncStorage).
 * Everything the app keeps goes through here. Keys start with "ywm:" and carry a version.
 * Nothing here ever throws: a phone with a full or broken store must not break a screen.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  /** The last content file that was downloaded and accepted. */
  content: 'ywm:content:v1',
  /** The theme chosen in You → Appearance: "system", "light" or "dark". */
  appearance: 'ywm:appearance:v1',
  /** The last calendar day the billboard was shown on Home, "2026-11-17". */
  billboardDay: 'ywm:billboard-day:v1',
  /** true once the welcome was finished ("Begin") or skipped. Absent: show the welcome. */
  welcome: 'ywm:welcome:v1',
  /** The app's own "reduce motion" switch in You: true or false. The phone's setting is followed too. */
  reduceMotion: 'ywm:reduce-motion:v1',
  /** The record of the day: every thing done, one entry each (src/day/). */
  days: 'ywm:days:v1',
  /** Saved lessons and the answers to "How did that feel?" (src/practice/). */
  practice: 'ywm:practice:v1',
} as const;

/** Reads and parses a saved value. Returns undefined when there is none or it cannot be read. */
export async function readJson(key: string): Promise<unknown> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Saves a value. Returns false if the phone refused (storage full, for example). */
export async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Forgets a saved value. Returns false if the phone refused. */
export async function removeKey(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
