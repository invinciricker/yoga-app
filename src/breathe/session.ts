/**
 * A breathing session, as pure arithmetic (docs/phases/phase-7.md, section 4). The player asks
 * these functions what to show; it never counts time itself. Tested in session.test.ts with a fake
 * clock ("Watch out for" 1 and 2).
 *
 *   ONE CLOCK.   A session has one clock: the time it has been running, paused time left out.
 *                Where the pacer is (the step, the count, the size of the disc, the end) is worked
 *                out from that clock every time, never by adding up timers, so nothing drifts: a
 *                timer that fires late only shows the same answer a little late.
 *   WHOLE ROUNDS. The minutes chosen are rounded UP to whole rounds: the session ends at the end of
 *                the round in which the time runs out, never in the middle of a breath (one minute
 *                of Box, rounds of 16 seconds, lasts 64 seconds).
 *   SETTLING IN. The clock first runs about five seconds of "Settle in", then the first step.
 *   THE DISC.    Its size follows the air in the lungs, from 45 % of its largest size (empty) to
 *                100 % (full). Each run of steps "in" fills the lungs, each step its share by its
 *                seconds (the sigh: two thirds, then the last third); each run of steps "out" empties
 *                them; a hold keeps the size. Within a step the size eases in and out.
 */
import type { BreathStep } from '../../shared/content-schema';

/** The steps a session needs (the content's steps fit). */
export type Step = Pick<BreathStep, 'do' | 'seconds'>;

/** "Settle in": this long before the first step. */
export const SETTLE_MS = 5000;
/** The disc at empty lungs, as a part of its largest size. */
export const DISC_MIN = 0.45;
/** At least this much breathing is written in the record of the day (and Stop leads to the closing screen). */
export const RECORD_FROM_MS = 60_000;
/** The lengths a person may choose, in minutes (docs/V2.md, limit 2: three lengths). */
export const LENGTHS = [1, 3, 5] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 3;

/** How full the lungs are at the start and at the end of a step, from 0 (empty) to 1 (full). */
export type Level = { from: number; to: number };

export type Plan = {
  steps: readonly Step[];
  /** When each step starts within a round, in ms. */
  starts: number[];
  roundMs: number;
  rounds: number;
  /** The breathing itself, settling in left out: whole rounds. */
  breathingMs: number;
  /** The whole session on the clock: settling in, then the breathing. */
  totalMs: number;
  levels: Level[];
};

/**
 * How full the lungs are at the start and the end of each step of a round that repeats. A run of
 * steps "in" (holds between them do not break it) goes from where the lungs are to full, each step
 * moving its share of what is left by its seconds; a run of steps "out" goes to empty the same way;
 * a hold keeps the level. Worked out over two rounds, so the first round starts where the round
 * before it would have ended.
 */
export function levelsOf(steps: readonly Step[]): Level[] {
  const n = steps.length;
  const out: Level[] = new Array<Level>(n);
  let level = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const step = steps[i];
      if (step.do === 'hold') {
        out[i] = { from: level, to: level };
        continue;
      }
      // The seconds of this step and of the rest of its run, holds skipped.
      let left = 0;
      for (let k = 0; k < n; k++) {
        const next = steps[(i + k) % n];
        if (next.do === 'hold') continue;
        if (next.do !== step.do) break;
        left += next.seconds;
      }
      const target = step.do === 'in' ? 1 : 0;
      const to = left > 0 ? level + (target - level) * (step.seconds / left) : target;
      out[i] = { from: level, to };
      level = to;
    }
  }
  return out;
}

/** The plan of a session: `minutes` rounded up to whole rounds of these steps. */
export function planOf(steps: readonly Step[], minutes: number): Plan {
  const starts: number[] = [];
  let roundMs = 0;
  for (const step of steps) {
    starts.push(roundMs);
    roundMs += step.seconds * 1000;
  }
  const rounds = Math.max(1, Math.ceil((minutes * 60_000) / roundMs));
  const breathingMs = rounds * roundMs;
  return { steps, starts, roundMs, rounds, breathingMs, totalMs: SETTLE_MS + breathingMs, levels: levelsOf(steps) };
}

/** Eases a part of a step (0 to 1) in and out: slow at both ends, never at a constant speed. */
export function eased(part: number): number {
  const p = Math.min(1, Math.max(0, part));
  return 0.5 - 0.5 * Math.cos(Math.PI * p);
}

/** Where a session is at one moment of its clock. */
export type Moment =
  | { phase: 'settle'; level: number; leftMs: number }
  | {
      phase: 'step';
      /** Which round, from 0. */
      round: number;
      /** Which step of the round, from 0. */
      index: number;
      step: Step;
      /** The first step "in" of a breath (the sigh's top up is not). */
      breathStarts: boolean;
      /** The seconds of the step, counting up: 1, 2, 3, 4. */
      count: number;
      /** When the step started and ends, on the clock. */
      startMs: number;
      endMs: number;
      /** How full the lungs are, eased: 0 empty, 1 full. */
      level: number;
      /** How much of the breathing is left: 1 at the start, 0 at the end. */
      left: number;
    }
  | { phase: 'end'; level: number };

/** Does step `index` start a breath: a step "in" after anything but another step "in" (holds skipped)? */
export function startsBreath(steps: readonly Step[], index: number): boolean {
  if (steps[index].do !== 'in') return false;
  const n = steps.length;
  for (let k = 1; k < n; k++) {
    const before = steps[(index - k + n) % n];
    if (before.do !== 'hold') return before.do !== 'in';
  }
  return true;
}

/** Where the session is when its clock shows `clockMs`. */
export function momentAt(plan: Plan, clockMs: number): Moment {
  if (clockMs < SETTLE_MS) return { phase: 'settle', level: plan.levels[0].from, leftMs: SETTLE_MS - clockMs };
  const breathed = clockMs - SETTLE_MS;
  if (breathed >= plan.breathingMs) return { phase: 'end', level: plan.levels[plan.levels.length - 1].to };

  const round = Math.floor(breathed / plan.roundMs);
  const inRound = breathed - round * plan.roundMs;
  let index = plan.starts.length - 1;
  while (index > 0 && plan.starts[index] > inRound) index--;
  const step = plan.steps[index];
  const stepMs = step.seconds * 1000;
  const into = inRound - plan.starts[index];
  const { from, to } = plan.levels[index];
  const startMs = SETTLE_MS + round * plan.roundMs + plan.starts[index];
  return {
    phase: 'step',
    round,
    index,
    step,
    breathStarts: startsBreath(plan.steps, index),
    count: Math.min(step.seconds, Math.floor(into / 1000) + 1),
    startMs,
    endMs: startMs + stepMs,
    level: from + (to - from) * eased(into / stepMs),
    left: 1 - breathed / plan.breathingMs,
  };
}

/**
 * The next moment of the clock at which what is shown changes: the end of settling in, the next
 * second of the count, the next step, or the end. Infinity once ended. The player sets one timer
 * for it; when that timer fires, it asks momentAt again.
 */
export function nextChangeAt(plan: Plan, clockMs: number): number {
  const now = momentAt(plan, clockMs);
  if (now.phase === 'settle') return SETTLE_MS;
  if (now.phase === 'end') return Infinity;
  return Math.min(now.startMs + now.count * 1000, now.endMs);
}

/** The disc's size for a level of the lungs, as a part of its largest size: 0.45 to 1. */
export function discSize(level: number): number {
  return DISC_MIN + (1 - DISC_MIN) * Math.min(1, Math.max(0, level));
}

/**
 * The whole minutes breathed when the clock shows `clockMs` (settling in left out). A session
 * that reached its end counts all its minutes (3 for three minutes; 1 for one minute of Box, which
 * lasts 64 seconds).
 */
export function minutesBreathed(plan: Plan, clockMs: number): number {
  const breathed = Math.min(plan.breathingMs, Math.max(0, clockMs - SETTLE_MS));
  return Math.floor(breathed / 60_000);
}

/** Is there enough to write in the record of the day: the end, or a full minute? */
export function worthRecording(plan: Plan, clockMs: number): boolean {
  return clockMs - SETTLE_MS >= RECORD_FROM_MS;
}

// ------------------------------------------------------------------ the clock

/**
 * The session's one clock. `since` is the moment (of a steady timer, such as performance.now) it
 * last started running, or null while paused; `before` is the time it ran before that.
 */
export type Clock = { before: number; since: number | null };

export const startClock = (now: number): Clock => ({ before: 0, since: now });
export const clockMs = (clock: Clock, now: number): number => clock.before + (clock.since === null ? 0 : Math.max(0, now - clock.since));
export const isRunning = (clock: Clock): boolean => clock.since !== null;
export const pauseClock = (clock: Clock, now: number): Clock => (clock.since === null ? clock : { before: clockMs(clock, now), since: null });
export const resumeClock = (clock: Clock, now: number): Clock => (clock.since !== null ? clock : { before: clock.before, since: now });
