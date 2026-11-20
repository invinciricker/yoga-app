/**
 * The pacer's three sounds (assets/sounds/, made by `npm run sounds`): a tone at every step in, a
 * lower one at every step out, a bell at the start and the end (docs/phases/phase-7.md, section 7).
 *
 * They MIX with the person's own music (nothing of theirs is paused or lowered), follow the media
 * volume, and never play once the player is left: the players are made when the player screen opens
 * and released when it closes, and `stopAll` silences them at a pause or when the app leaves the
 * screen. The one exception is the bell at the END of a session (`ringOut`): it rings on over the
 * closing screen, like a real bell, and is released once it has faded (4 seconds).
 * Nothing is recorded: the app has no microphone permission (app.config.ts).
 * On the web, a browser may refuse to play until the page has been touched: then nothing sounds,
 * and nothing breaks.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';

export type SoundName = 'in' | 'out' | 'bell';

/** The files, bundled inside the app. */
// require(): Metro bundles the file and gives a number that stands for it.
const files: Record<SoundName, number> = {
  in: require('../../assets/sounds/in.wav'),
  out: require('../../assets/sounds/out.wav'),
  bell: require('../../assets/sounds/bell.wav'),
};
const names = Object.keys(files) as SoundName[];
/** How long the bell sounds (assets/sounds/bell.wav), with a little to spare. */
const BELL_MS = 4500;

export type BreathSounds = {
  play: (name: SoundName) => void;
  stopAll: () => void;
  /** The bell of the end: played now, and left to ring on after the player closes. */
  ringOut: () => void;
};

export function useBreathSounds(): BreathSounds {
  const players = useRef<Partial<Record<SoundName, AudioPlayer>>>({});
  const ringing = useRef(false);

  useEffect(() => {
    // Sound effects: alongside other apps' audio, never in the background.
    setAudioModeAsync({ interruptionMode: 'mixWithOthers', shouldPlayInBackground: false, playsInSilentMode: true }).catch(() => {
      // A phone or browser that refuses: the pacer works without sound.
    });
    const made: Partial<Record<SoundName, AudioPlayer>> = {};
    for (const name of names) {
      try {
        made[name] = createAudioPlayer(files[name]);
      } catch {
        // This sound cannot be prepared here: the others still play.
      }
    }
    players.current = made;
    const release = (player: AudioPlayer) => {
      try {
        player.pause();
        player.remove();
      } catch {
        // Already gone.
      }
    };
    return () => {
      for (const name of names) {
        const player = made[name];
        if (!player) continue;
        // The bell of the end rings on, then goes; everything else stops at once.
        if (name === 'bell' && ringing.current) setTimeout(() => release(player), BELL_MS);
        else release(player);
      }
      players.current = {};
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    const player = players.current[name];
    if (!player) return;
    try {
      // From the start each time: a tone may still be fading from the step before.
      void player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // A sound that will not play never stops the pacer.
    }
  }, []);

  const stopAll = useCallback(() => {
    for (const player of Object.values(players.current)) {
      try {
        player.pause();
      } catch {
        // Nothing to stop.
      }
    }
  }, []);

  const ringOut = useCallback(() => {
    ringing.current = true;
    play('bell');
  }, [play]);

  // The same object on every drawing, so the player's timer is not set again each time.
  return useMemo(() => ({ play, stopAll, ringOut }), [play, stopAll, ringOut]);
}
