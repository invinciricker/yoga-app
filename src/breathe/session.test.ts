/**
 * The session's clock, its end and its disc (docs/phases/phase-7.md, "Watch out for" 1, 2 and 4),
 * with a fake clock: every time here is a number of milliseconds chosen by the test.
 */
import {
  clockMs,
  discSize,
  DISC_MIN,
  levelsOf,
  minutesBreathed,
  momentAt,
  nextChangeAt,
  pauseClock,
  planOf,
  resumeClock,
  SETTLE_MS,
  startClock,
  worthRecording,
  type Plan,
  type Step,
} from './session';

const s = (d: Step['do'], seconds: number): Step => ({ do: d, seconds });
const box = [s('in', 4), s('hold', 4), s('out', 4), s('hold', 4)];
const longExhale = [s('in', 4), s('out', 6)];
const sigh = [s('in', 2), s('in', 1), s('out', 6)];
const nostril = [s('in', 4), s('out', 4), s('in', 4), s('out', 4)];

/** The clock time of `ms` of breathing (settling in comes first). */
const at = (ms: number) => SETTLE_MS + ms;

/**
 * Runs a session the way the player does: one timer at a time, each set for nextChangeAt and
 * firing up to `late` ms late (a busy phone). Gives the moment the end was seen, and every step
 * start seen, as [clock time it was seen, clock time it was due].
 */
function run(plan: Plan, late: (n: number) => number) {
  let now = 0;
  let n = 0;
  const steps: [number, number][] = [];
  let lastStep = -1;
  for (;;) {
    const moment = momentAt(plan, now);
    if (moment.phase === 'end') return { endSeen: now, steps };
    if (moment.phase === 'step') {
      const id = moment.round * plan.steps.length + moment.index;
      if (id !== lastStep) steps.push([now, moment.startMs]);
      lastStep = id;
    }
    now = Math.max(now, nextChangeAt(plan, now)) + late(n++);
  }
}

describe('time (Watch out for 1)', () => {
  it('one minute of Box (rounds of 16 seconds) ends after 64 seconds, at the end of a breath', () => {
    const plan = planOf(box, 1);
    expect(plan.rounds).toBe(4);
    expect(plan.breathingMs).toBe(64_000);
    expect(momentAt(plan, at(63_999))).toMatchObject({ phase: 'step', index: 3, round: 3 });
    expect(momentAt(plan, at(64_000)).phase).toBe('end');
  });

  it('three minutes of Long exhale end at exactly 180 seconds', () => {
    const plan = planOf(longExhale, 3);
    expect(plan.breathingMs).toBe(180_000);
    expect(momentAt(plan, at(179_999)).phase).toBe('step');
    expect(momentAt(plan, at(180_000)).phase).toBe('end');
  });

  it('rounds up, never down: five minutes of the sigh (9-second rounds) are 34 rounds', () => {
    const plan = planOf(sigh, 5);
    expect(plan.rounds).toBe(34);
    expect(plan.breathingMs).toBe(306_000);
  });

  it('settles in for five seconds first, with the disc where the first breath starts', () => {
    const plan = planOf(longExhale, 3);
    expect(momentAt(plan, 0)).toMatchObject({ phase: 'settle', level: 0, leftMs: SETTLE_MS });
    expect(momentAt(plan, SETTLE_MS - 1).phase).toBe('settle');
    expect(momentAt(plan, SETTLE_MS)).toMatchObject({ phase: 'step', index: 0, count: 1, breathStarts: true });
  });

  it('a pause of a minute in the middle does not shorten the session', () => {
    const plan = planOf(longExhale, 3);
    let clock = startClock(1_000_000); // a steady timer's own numbers: the start is wherever it is
    clock = pauseClock(clock, 1_000_000 + at(90_000));
    // A minute later, still paused: the session has not moved.
    expect(clockMs(clock, 1_000_000 + at(150_000))).toBe(at(90_000));
    clock = resumeClock(clock, 1_000_000 + at(150_000));
    // Ends 180 seconds of breathing after it began, a minute later on the wall.
    expect(momentAt(plan, clockMs(clock, 1_000_000 + at(239_999))).phase).toBe('step');
    expect(momentAt(plan, clockMs(clock, 1_000_000 + at(240_000))).phase).toBe('end');
  });

  it('pausing twice or resuming twice changes nothing', () => {
    let clock = startClock(0);
    clock = pauseClock(pauseClock(clock, 1000), 5000);
    expect(clockMs(clock, 9000)).toBe(1000);
    clock = resumeClock(resumeClock(clock, 9000), 12_000);
    expect(clockMs(clock, 10_000)).toBe(2000);
  });

  it('five minutes do not drift by even a second, however late the timers fire', () => {
    const plan = planOf(longExhale, 5);
    // Every timer fires up to 40 ms late, in a fixed pattern that never averages out.
    const { endSeen, steps } = run(plan, (n) => (n * 7919) % 41);
    // The end is seen within one late timer of 5 minutes of breathing, not seconds later.
    expect(endSeen - at(300_000)).toBeGreaterThanOrEqual(0);
    expect(endSeen - at(300_000)).toBeLessThanOrEqual(40);
    // Every one of the 60 breaths in and out began on time, the last one as on time as the first.
    expect(steps).toHaveLength(60);
    for (const [seen, due] of steps) {
      expect(seen - due).toBeGreaterThanOrEqual(0);
      expect(seen - due).toBeLessThanOrEqual(40);
    }
  });

  it('counts the seconds of a step up: 1, 2, 3, 4', () => {
    const plan = planOf(box, 1);
    expect([0, 999, 1000, 2500, 3999].map((ms) => momentAt(plan, at(ms))).map((m) => (m.phase === 'step' ? m.count : 0))).toEqual([1, 1, 2, 3, 4]);
    // The next change is the next second, then the next step.
    expect(nextChangeAt(plan, at(2500))).toBe(at(3000));
    expect(nextChangeAt(plan, at(3500))).toBe(at(4000));
    expect(nextChangeAt(plan, 0)).toBe(SETTLE_MS);
    expect(nextChangeAt(plan, at(64_000))).toBe(Infinity);
  });

  it('says how much is left, for the thin line', () => {
    const plan = planOf(longExhale, 3);
    expect(momentAt(plan, at(0))).toMatchObject({ left: 1 });
    expect(momentAt(plan, at(90_000))).toMatchObject({ left: 0.5 });
  });
});

describe('the disc (Watch out for 2)', () => {
  const levelAt = (plan: Plan, ms: number) => momentAt(plan, at(ms)).level;

  it('the sigh’s two steps in make one rising breath: two thirds, then the last third', () => {
    expect(levelsOf(sigh)).toEqual([
      { from: 0, to: 2 / 3 },
      { from: 2 / 3, to: 1 },
      { from: 1, to: 0 },
    ]);
    const plan = planOf(sigh, 1);
    // Rising all through both steps in, never falling back between them.
    const rising = [0, 500, 1000, 1500, 2000, 2500, 2999].map((ms) => levelAt(plan, ms));
    for (let i = 1; i < rising.length; i++) expect(rising[i]).toBeGreaterThan(rising[i - 1]);
    expect(levelAt(plan, 2000)).toBeCloseTo(2 / 3, 10);
    expect(levelAt(plan, 3000)).toBeCloseTo(1, 10);
    // The top up is a step in, but not the start of a breath (no firm tick there).
    expect(momentAt(plan, at(0))).toMatchObject({ breathStarts: true });
    expect(momentAt(plan, at(2000))).toMatchObject({ breathStarts: false });
  });

  it('a hold keeps the size, full or empty', () => {
    const plan = planOf(box, 1);
    expect(levelAt(plan, 4000)).toBe(1);
    expect(levelAt(plan, 6000)).toBe(1);
    expect(levelAt(plan, 7999)).toBe(1);
    expect(levelAt(plan, 12_000)).toBe(0);
    expect(levelAt(plan, 15_999)).toBe(0);
  });

  it('eases in and out: slow at both ends of a step, fastest in the middle', () => {
    const plan = planOf(longExhale, 1);
    const first = levelAt(plan, 400) - levelAt(plan, 0);
    const middle = levelAt(plan, 2200) - levelAt(plan, 1800);
    const last = levelAt(plan, 4000 - 1) - levelAt(plan, 3600 - 1);
    expect(middle).toBeGreaterThan(2 * first);
    expect(middle).toBeGreaterThan(2 * last);
  });

  it('is right after a pause: the same size as before it', () => {
    const plan = planOf(longExhale, 3);
    let clock = startClock(0);
    const before = momentAt(plan, clockMs(clock, at(2_300))).level;
    clock = pauseClock(clock, at(2_300));
    clock = resumeClock(clock, at(62_300));
    expect(momentAt(plan, clockMs(clock, at(62_300))).level).toBe(before);
  });

  it('alternate nostril fills and empties twice a round', () => {
    expect(levelsOf(nostril)).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 0 },
      { from: 0, to: 1 },
      { from: 1, to: 0 },
    ]);
    const plan = planOf(nostril, 1);
    expect(momentAt(plan, at(8000))).toMatchObject({ breathStarts: true, index: 2 });
  });

  it('a round that starts with a breath out starts full, and holds between steps in do not split a breath', () => {
    expect(levelsOf([s('out', 6), s('in', 4)])).toEqual([
      { from: 1, to: 0 },
      { from: 0, to: 1 },
    ]);
    expect(levelsOf([s('in', 3), s('hold', 2), s('in', 3), s('out', 6)])).toEqual([
      { from: 0, to: 0.5 },
      { from: 0.5, to: 0.5 },
      { from: 0.5, to: 1 },
      { from: 1, to: 0 },
    ]);
  });

  it('goes from 45 % of its size (empty) to 100 % (full)', () => {
    expect(discSize(0)).toBe(DISC_MIN);
    expect(discSize(1)).toBe(1);
    expect(discSize(-1)).toBe(DISC_MIN);
    expect(discSize(0.5)).toBeCloseTo(0.725, 10);
  });
});

describe('what is written in the record (Watch out for 4)', () => {
  const plan = planOf(longExhale, 3);

  it('stopped at 59 seconds: nothing', () => {
    expect(worthRecording(plan, at(59_000))).toBe(false);
  });

  it('stopped at 61 seconds: one minute', () => {
    expect(worthRecording(plan, at(61_000))).toBe(true);
    expect(minutesBreathed(plan, at(61_000))).toBe(1);
  });

  it('a finished three-minute session: 3; one minute of Box (64 seconds): 1', () => {
    expect(minutesBreathed(plan, plan.totalMs)).toBe(3);
    expect(minutesBreathed(plan, plan.totalMs + 99_000)).toBe(3);
    const oneBox = planOf(box, 1);
    expect(minutesBreathed(oneBox, oneBox.totalMs)).toBe(1);
    expect(worthRecording(oneBox, oneBox.totalMs)).toBe(true);
  });

  it('settling in never counts', () => {
    expect(minutesBreathed(plan, SETTLE_MS - 1)).toBe(0);
    expect(worthRecording(plan, 60_000)).toBe(false);
  });
});
