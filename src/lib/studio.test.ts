import type { StudioClass } from './billboard';
import { classDays, classDetails, classLength, classTime, contactActions, mapsLink } from './studio';

/** A local time in the week of Monday 16 November 2026 (17 is a Tuesday, 21 a Saturday). */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

const cls = (day: StudioClass['day'], start: string, name: string, end?: string, level?: string): StudioClass => ({
  day,
  start,
  name,
  ...(end ? { end } : {}),
  ...(level ? { level } : {}),
});

describe('classDays', () => {
  it('puts today first, even when its classes are over', () => {
    const days = classDays([cls('thu', '09:00', 'Morning'), cls('tue', '07:00', 'Early')], at(17, 21));
    expect(days.map((d) => d.day)).toEqual(['tue', 'thu']);
    expect(days[0].label).toBe('Today');
  });

  it('calls tomorrow "Tomorrow" and other days by their name', () => {
    const days = classDays([cls('wed', '18:00', 'A'), cls('fri', '18:00', 'B')], at(17, 10));
    expect(days.map((d) => d.label)).toEqual(['Tomorrow', 'Friday']);
  });

  it('skips a day without classes', () => {
    const days = classDays([cls('mon', '18:00', 'A'), cls('sat', '10:00', 'B')], at(17, 10));
    expect(days.map((d) => d.day)).toEqual(['sat', 'mon']);
  });

  it('puts two classes of one day in time order', () => {
    const late = cls('thu', '19:30', 'Late');
    const early = cls('thu', '07:15', 'Early');
    const [day] = classDays([late, early], at(17, 10));
    expect(day.classes).toEqual([early, late]);
  });

  it('wraps from Saturday to Sunday to Monday', () => {
    const days = classDays([cls('mon', '18:00', 'A'), cls('sun', '10:00', 'B'), cls('sat', '09:00', 'C')], at(21, 12));
    expect(days.map((d) => d.day)).toEqual(['sat', 'sun', 'mon']);
    expect(days.map((d) => d.label)).toEqual(['Today', 'Tomorrow', 'Monday']);
  });

  it('gives nothing when there are no classes', () => {
    expect(classDays([], at(17, 10))).toEqual([]);
  });

  it('keeps 21 classes over seven days, three a day, in order', () => {
    const week: StudioClass['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const all = week.flatMap((d) => [cls(d, '19:00', `${d} 3`), cls(d, '07:00', `${d} 1`), cls(d, '12:00', `${d} 2`)]);
    const days = classDays(all, at(17, 10));
    expect(days).toHaveLength(7);
    expect(days[0].day).toBe('tue');
    expect(days[6].day).toBe('mon');
    for (const day of days) expect(day.classes.map((c) => c.start)).toEqual(['07:00', '12:00', '19:00']);
  });

  it('puts a class with a time it cannot read last in its day', () => {
    const broken = cls('thu', 'soon', 'Broken');
    const fine = cls('thu', '09:00', 'Fine');
    expect(classDays([broken, fine], at(17, 10))[0].classes).toEqual([fine, broken]);
  });
});

describe('classLength', () => {
  it('counts the minutes between start and end', () => {
    expect(classLength('18:30', '19:45')).toBe('75 min');
    expect(classLength('09:00', '10:00')).toBe('60 min');
  });

  it('gives nothing without an end', () => {
    expect(classLength('18:30')).toBeUndefined();
  });

  it('gives nothing when the end is not after the start', () => {
    expect(classLength('18:30', '18:30')).toBeUndefined();
    expect(classLength('18:30', '17:00')).toBeUndefined();
  });

  it('gives nothing when a time cannot be read', () => {
    expect(classLength('soon', '19:00')).toBeUndefined();
  });
});

describe('classTime and classDetails', () => {
  it('writes the start, or the start and the end', () => {
    expect(classTime(cls('tue', '18:30', 'A'))).toBe('18:30');
    expect(classTime(cls('tue', '18:30', 'A', '19:45'))).toBe('18:30 – 19:45');
  });

  it('writes the level and the length, each only when known', () => {
    expect(classDetails(cls('tue', '18:30', 'A', '19:45', 'All levels'))).toBe('All levels · 75 min');
    expect(classDetails(cls('tue', '18:30', 'A', undefined, 'All levels'))).toBe('All levels');
    expect(classDetails(cls('tue', '18:30', 'A', '19:45'))).toBe('75 min');
    expect(classDetails(cls('tue', '18:30', 'A'))).toBeUndefined();
  });
});

describe('contactActions', () => {
  it('makes WhatsApp the gold button and email a ghost one', () => {
    const { main, more } = contactActions({ whatsapp: '+15555550123', email: 'maria@example.com' });
    expect(main).toEqual({ kind: 'whatsapp', url: 'https://wa.me/15555550123', shown: '+15555550123' });
    expect(more).toEqual([{ kind: 'email', url: 'mailto:maria@example.com', shown: 'maria@example.com' }]);
  });

  it('makes email the gold button when it is the only way', () => {
    const { main, more } = contactActions({ email: 'maria@example.com' });
    expect(main?.kind).toBe('email');
    expect(main?.url).toBe('mailto:maria@example.com');
    expect(more).toEqual([]);
  });

  it('gives no gold button for a phone number alone, and one ghost button to call', () => {
    const { main, more } = contactActions({ phone: '+15555550123' });
    expect(main).toBeUndefined();
    expect(more).toEqual([{ kind: 'phone', url: 'tel:+15555550123', shown: '+15555550123' }]);
  });

  it('gives nothing at all when nothing is filled in', () => {
    expect(contactActions({})).toEqual({ main: undefined, more: [] });
  });

  it('keeps the dot of an Instagram handle', () => {
    const { more } = contactActions({ instagram: 'maria.yoga' });
    expect(more).toEqual([
      { kind: 'instagram', url: 'https://instagram.com/maria.yoga', shown: 'instagram.com/maria.yoga' },
    ]);
  });

  it('puts the ghost buttons in order: call, Instagram, email, website', () => {
    const { main, more } = contactActions({
      website: 'https://example.com',
      email: 'maria@example.com',
      instagram: 'maria.yoga',
      phone: '+15555550123',
      whatsapp: '+15555550123',
    });
    expect(main?.kind).toBe('whatsapp');
    expect(more.map((a) => a.kind)).toEqual(['phone', 'instagram', 'email', 'website']);
    expect(more[3]).toEqual({ kind: 'website', url: 'https://example.com', shown: 'https://example.com' });
  });

  it('ignores a line that is empty, and an @ written before a handle', () => {
    const { main, more } = contactActions({ whatsapp: ' ', instagram: '@maria.yoga' });
    expect(main).toBeUndefined();
    expect(more[0].url).toBe('https://instagram.com/maria.yoga');
  });
});

describe('mapsLink', () => {
  it('uses the link from Google Maps when there is one', () => {
    expect(mapsLink({ name: 'Studio', address: 'Street, city', mapsUrl: 'https://maps.app.goo.gl/abc' })).toBe(
      'https://maps.app.goo.gl/abc',
    );
  });

  it('otherwise searches Google Maps for the address', () => {
    expect(mapsLink({ name: 'Studio', address: '12 Rue de la Paix, Paris & co' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=12%20Rue%20de%20la%20Paix%2C%20Paris%20%26%20co',
    );
  });
});
