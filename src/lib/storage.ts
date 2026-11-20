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
  /**
   * The Journal (src/journal/), never sent anywhere. Every key starts with this; "Delete my data"
   * erases them all. One key per page written (journalPage + its id), the journals begun, and the
   * current start of each journal started again.
   */
  journal: 'ywm:journal:v1:',
  journalPage: 'ywm:journal:v1:page:',
  journalBegun: 'ywm:journal:v1:begun',
  /** The current start of each journal started again, { "habit": 2 } (Phase 6, "Start a new habit"). */
  journalCycles: 'ywm:journal:v1:cycles',
  /** Breathe's settings, the same for every exercise: { minutes, sound, vibration } (Phase 7). Kept by "Delete my data". */
  breathe: 'ywm:breathe:v1',
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

/** Every saved value whose key starts with `prefix`, read in one go. Gives [] if the phone refuses. */
export async function readAllStartingWith(prefix: string): Promise<{ key: string; value: unknown }[]> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
    if (keys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.flatMap(([key, text]) => {
      if (text === null) return [];
      try {
        return [{ key, value: JSON.parse(text) as unknown }];
      } catch {
        return []; // one broken value never hides the others
      }
    });
  } catch {
    return [];
  }
}

/** Forgets every saved value whose key starts with `prefix`. Returns false if the phone refused. */
export async function removeAllStartingWith(prefix: string): Promise<boolean> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
    return true;
  } catch {
    return false;
  }
}
