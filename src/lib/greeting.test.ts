import { greetingFor, partOfDay } from './greeting';

/** A local time on Monday 16 November 2026. */
const at = (hour: number, minute = 0) => new Date(2026, 10, 16, hour, minute);

describe('greetingFor', () => {
  it('says good morning until 11:59', () => {
    expect(partOfDay(at(0))).toBe('morning');
    expect(greetingFor(at(11, 59))).toMatchObject({ hello: 'Good morning.', line: 'Begin gently.' });
  });

  it('turns to afternoon at 12:00 and stays until 16:59', () => {
    expect(greetingFor(at(12, 0))).toMatchObject({ hello: 'Good afternoon.', line: 'A pause in the day.' });
    expect(partOfDay(at(16, 59))).toBe('afternoon');
  });

  it('turns to evening at 17:00 and stays until midnight', () => {
    expect(greetingFor(at(17, 0))).toMatchObject({ hello: 'Good evening.', line: 'Let the day settle.' });
    expect(partOfDay(at(23, 59))).toBe('evening');
  });

  it('labels the big card after the part of the day', () => {
    expect(greetingFor(at(8)).practice).toBe('This morning’s practice');
    expect(greetingFor(at(13)).practice).toBe('Today’s practice');
    expect(greetingFor(at(20)).practice).toBe('Tonight’s practice');
  });

  it('names the weekday and the part of the day above the greeting', () => {
    expect(greetingFor(at(19)).overline).toBe('Monday evening');
    expect(greetingFor(new Date(2026, 10, 22, 9)).overline).toBe('Sunday morning');
  });
});
