/**
 * The breathing player (/breath-play/long-exhale?minutes=3; docs/phases/phase-7.md, section 4).
 * Always dark, the whole screen, no tab bar. What it shows is BreathStage (src/ui/); what it does is
 * here, and the arithmetic of time is src/breathe/session.ts:
 *
 *   ONE CLOCK. The session's clock (a steady timer, paused time left out) is the only truth. One
 *     timer at a time is set for the next change (nextChangeAt); when it fires, the player asks
 *     momentAt where the session is. A timer that fires late shows the same thing a little late,
 *     and nothing ever drifts. The minutes are rounded up to whole rounds.
 *   AT EACH STEP. The disc is sent to the step's end size, eased, over exactly the time left in the
 *     step (on the UI thread); a light tick in the hand, a firmer one at the start of a breath in
 *     (Vibration); the higher tone at a step in, the lower at a step out (Sound). Nothing on a hold.
 *   SETTLE IN about five seconds first, with a bell (Sound). At the END: the bell, a success tick,
 *     then, after a breath of rest, the closing screen in its place.
 *   PAUSE: a tap anywhere, the pause button, Android's back button, or leaving the app (a call, the
 *     home button, the screen going off). The disc rests; "Paused", with "Go on" and "Stop". Stop
 *     after a full minute opens the closing screen; before, it goes back to the exercise's page and
 *     nothing is written. The screen is kept awake while the session runs, and only then.
 *   REDUCE MOTION: the disc stays still; only the word and the count change, with short fades.
 *
 * Preview app and web only: &show=<ms> opens the session frozen at that moment of its clock, to
 * check how it looks (a tap pauses it, "Go on" runs it from there).
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Platform } from 'react-native';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import type { BreathExercise } from '../../shared/content-schema';

import {
  clockMs,
  DEFAULT_LENGTH,
  discSize,
  LENGTHS,
  minutesBreathed,
  momentAt,
  nextChangeAt,
  pauseClock,
  planOf,
  resumeClock,
  startClock,
  worthRecording,
  type Clock,
  type Length,
  type Moment,
} from '@/breathe/session';
import { useBreathe } from '@/breathe/settings';
import { useBreathSounds } from '@/breathe/useSounds';
import { roundInShort, stepWay, stepWord } from '@/breathe/words';
import { slugsForStaticPages } from '@/content/load';
import { useContent } from '@/content/store';
import { firm, success, tick } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/motion';
import { routes } from '@/lib/nav';
import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { useDarkTop } from '@/theme/statusBar';
import { ThemeScope } from '@/theme/ThemeProvider';
import { BreathStage, LoadingPage, NotHere, size, type StageState } from '@/ui';

/** Web preview only: the pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('breath');
}

/** Keeps the screen on while a session runs (and only then). */
const AWAKE_TAG = 'breathe';
/** After the last breath out and the bell, a moment of rest before the closing screen. */
const END_REST_MS = 1200;
/** A timer is set this much after the change it waits for, so it lands just past it. */
const TIMER_SLACK_MS = 4;

/** A steady timer: never jumps when the phone's clock is set. */
const now = () => performance.now();

export default function BreathPlayScreen() {
  return (
    <ThemeScope scheme="dark">
      <BreathPlay />
    </ThemeScope>
  );
}

function BreathPlay() {
  const params = useLocalSearchParams<{ slug: string; minutes?: string; show?: string }>();
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  useDarkTop(true);

  const exercise = content.breath?.find((e) => e.slug === params.slug);
  if (!exercise) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.breathe.gone} actionLabel={strings.breathe.toBreathe} onAction={() => router.replace(routes.breathe)} />;
  }

  const asked = Number(params.minutes);
  const minutes: Length = (LENGTHS as readonly number[]).includes(asked) ? (asked as Length) : DEFAULT_LENGTH;
  // &show=<ms>: a frozen moment, to check the look (preview app and web only).
  const shown = Number(params.show);
  const show = (isPreview || Platform.OS === 'web') && params.show !== undefined && Number.isFinite(shown) && shown >= 0 ? shown : undefined;
  return <Session key={`${exercise.slug}-${minutes}-${show ?? ''}`} exercise={exercise} minutes={minutes} show={show} />;
}

function Session({ exercise, minutes, show }: { exercise: BreathExercise; minutes: Length; show: number | undefined }) {
  const router = useRouter();
  const reduce = useReduceMotion();
  const sound = useBreathe((s) => s.sound);
  const setSettings = useBreathe((s) => s.set);
  const sounds = useBreathSounds();

  const [plan] = useState(() => planOf(exercise.steps, minutes));
  const clock = useRef<Clock>(show === undefined ? startClock(now()) : { before: show, since: null });
  const [moment, setMoment] = useState<Moment>(() => momentAt(plan, show ?? 0));
  const [running, setRunning] = useState(show === undefined);
  // A frozen moment (&show=) is drawn as it is, not as "Paused".
  const [frozen, setFrozen] = useState(show !== undefined);
  const [ended, setEnded] = useState(false);

  const scale = useSharedValue(reduce ? size.pacer.reduced : discSize(moment.level));
  const left = useSharedValue(moment.phase === 'step' ? moment.left : moment.phase === 'end' ? 0 : 1);

  // What has been done for which step, so a resume in the middle of a step never ticks twice.
  const cuedFor = useRef('');
  const discFor = useRef('');
  const lineRuns = useRef(false);
  const reduceNow = useRef(reduce);
  useEffect(() => {
    reduceNow.current = reduce;
    if (reduce) {
      cancelAnimation(scale);
      scale.set(size.pacer.reduced);
      discFor.current = '';
    }
  }, [reduce, scale]);

  /** Leaves for the closing screen (a full minute or more) or for the exercise's page (less). */
  const leave = useCallback(
    (clockAt: number) => {
      const at = new Date().toISOString();
      if (worthRecording(plan, clockAt)) router.replace(routes.breatheDone(exercise.slug, minutesBreathed(plan, clockAt), at));
      else router.replace(routes.breath(exercise.slug));
    },
    [plan, router, exercise.slug],
  );

  // ---- The one timer: set for the next change, then ask the clock where the session is.
  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rest: ReturnType<typeof setTimeout> | undefined;
    const settings = () => useBreathe.getState();

    const step = () => {
      const ms = clockMs(clock.current, now());
      const m = momentAt(plan, ms);
      setMoment(m);

      if (m.phase === 'settle') {
        if (cuedFor.current !== 'settle') {
          cuedFor.current = 'settle';
          if (settings().sound) sounds.play('bell');
        }
      } else if (m.phase === 'step') {
        const key = `${m.round}.${m.index}`;
        // The cues of a new step: ticks in the hand, a tone.
        if (cuedFor.current !== key) {
          cuedFor.current = key;
          if (settings().vibration) (m.breathStarts ? firm : tick)();
          if (settings().sound && m.step.do !== 'hold') sounds.play(m.step.do);
        }
        // The disc, to this step's end size, eased, over the time left in the step.
        if (discFor.current !== key && !reduceNow.current) {
          discFor.current = key;
          scale.set(withTiming(discSize(plan.levels[m.index].to), { duration: Math.max(0, m.endMs - ms), easing: Easing.inOut(Easing.sin) }));
        }
        // The thin line, from what is left to nothing, at an even pace.
        if (!lineRuns.current) {
          lineRuns.current = true;
          left.set(m.left);
          left.set(withTiming(0, { duration: m.left * plan.breathingMs, easing: Easing.linear }));
        }
      } else {
        // The end: the bell, a success tick, a breath of rest, the closing screen.
        setEnded(true);
        if (settings().sound) sounds.ringOut();
        if (settings().vibration) success();
        rest = setTimeout(() => leave(plan.totalMs), END_REST_MS);
        return;
      }
      timer = setTimeout(step, Math.max(0, nextChangeAt(plan, ms) - ms) + TIMER_SLACK_MS);
    };

    timer = setTimeout(step, 0);
    return () => {
      clearTimeout(timer);
      clearTimeout(rest);
    };
  }, [running, plan, sounds, scale, left, leave]);

  // ---- Pause, go on, stop.
  const pause = useCallback(() => {
    clock.current = pauseClock(clock.current, now());
    cancelAnimation(scale);
    cancelAnimation(left);
    discFor.current = '';
    lineRuns.current = false;
    sounds.stopAll();
    setRunning(false);
    setFrozen(false);
    setMoment(momentAt(plan, clockMs(clock.current, now())));
  }, [plan, scale, left, sounds]);

  const goOn = useCallback(() => {
    clock.current = resumeClock(clock.current, now());
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    clock.current = pauseClock(clock.current, now());
    sounds.stopAll();
    leave(clockMs(clock.current, now()));
  }, [leave, sounds]);

  // Leaving the app (a call, the home button, the screen going off) pauses.
  const runningNow = running && !ended;
  useEffect(() => {
    if (!runningNow) return;
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pause();
    });
    return () => listener.remove();
  }, [runningNow, pause]);

  // Android's back button: a first press pauses, a second one stops.
  useFocusEffect(
    useCallback(() => {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        if (ended) return true;
        if (running) pause();
        else stop();
        return true;
      });
      return () => listener.remove();
    }, [ended, running, pause, stop]),
  );

  // The screen stays awake while the session runs, and may sleep again at a pause or the end.
  useEffect(() => {
    if (!runningNow) return;
    activateKeepAwakeAsync(AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(AWAKE_TAG).catch(() => {});
    };
  }, [runningNow]);

  // ---- What the stage shows.
  const toggleSound = () => {
    const on = !sound;
    setSettings({ sound: on });
    if (!on) sounds.stopAll();
  };
  const stepWords = moment.phase === 'step' ? exercise.steps[moment.index] : undefined;
  const state: StageState =
    !running && !frozen && !ended
      ? { kind: 'paused' }
      : moment.phase === 'settle'
        ? { kind: 'settle', title: exercise.title, round: roundInShort(exercise.steps) }
        : moment.phase === 'step' && stepWords
          ? { kind: 'step', word: stepWord(stepWords), way: stepWay(stepWords), count: moment.count, stepKey: `${moment.round}.${moment.index}` }
          : { kind: 'end' };
  const minutesLeft = Math.ceil(((moment.phase === 'step' ? moment.left : moment.phase === 'end' ? 0 : 1) * plan.breathingMs) / 60_000);

  return (
    <BreathStage
      scale={scale}
      left={left}
      leftLabel={strings.breathe.timeLeft(minutesLeft)}
      state={state}
      sound={sound}
      onToggleSound={toggleSound}
      onPause={pause}
      onGoOn={goOn}
      onStop={stop}
    />
  );
}
