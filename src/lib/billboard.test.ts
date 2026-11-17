import { longDate, nextClass, showBillboard, type StudioClass } from './billboard';

/** A local time in the week of Monday 16 November 2026 (17 is a Tuesday). */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

const evening: StudioClass = { day: 'tue', start: '18:30', name: 'Evening flow' };
const morning: StudioClass = { day: 'thu', start: '09:00', name: 'Morning stretch' };
const monday: StudioClass = { day: 'mon', start: '19:00', name: 'Slow flow' };

describe('nextClass', () => {
  it('finds a class later today', () => {
    const next = nextClass([morning, evening], at(17, 10));
    expect(next?.item).toBe(evening);
    expect(next?.at).toEqual(at(17, 18, 30));
  });

  it('skips a class of today that has already started', () => {
    const next = nextClass([evening, morning], at(17, 19));
    expect(next?.item).toBe(morning);
    expect(next?.at).toEqual(at(19, 9));
  });

  it('still counts a class that starts this very minute', () => {
    expect(nextClass([evening], at(17, 18, 30))?.at).toEqual(at(17, 18, 30));
  });

  it('wraps round the week to the same day next week', () => {
    const next = nextClass([evening], at(17, 20));
    expect(next?.item).toBe(evening);
    expect(next?.at).toEqual(at(24, 18, 30));
  });

  it('wraps round the week from Saturday to Monday', () => {
    const next = nextClass([monday], at(21, 12));
    expect(next?.at).toEqual(at(23, 19));
    expect(next?.at.getDay()).toBe(1);
  });

  it('takes the earliest of two classes on the same day', () => {
    const late: StudioClass = { day: 'tue', start: '20:00', name: 'Late' };
    expect(nextClass([late, evening], at(17, 8))?.item).toBe(evening);
  });

  it('gives nothing when there are no classes', () => {
    expect(nextClass([], at(17, 10))).toBeUndefined();
  });

  it('ignores a class with a time it cannot read', () => {
    const broken = { day: 'tue', start: 'soon', name: 'Broken' } as StudioClass;
    expect(nextClass([broken], at(17, 10))).toBeUndefined();
    expect(nextClass([broken, morning], at(17, 10))?.item).toBe(morning);
  });
});

describe('longDate', () => {
  it('writes the weekday, the day and the month', () => {
    expect(longDate(at(17, 9))).toBe('Tuesday 17 November');
    expect(longDate(new Date(2027, 0, 1, 0, 5))).toBe('Friday 1 January');
  });
});

describe('showBillboard', () => {
  it('shows it the first time ever', () => {
    expect(showBillboard(undefined, '2026-11-17')).toBe(true);
  });

  it('shows it on a new day', () => {
    expect(showBillboard('2026-11-16', '2026-11-17')).toBe(true);
  });

  it('does not show it again the same day', () => {
    expect(showBillboard('2026-11-17', '2026-11-17')).toBe(false);
  });
});
