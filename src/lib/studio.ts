/**
 * Maria's page (app/maria.tsx): her classes by day, their times and lengths, how to reach her,
 * and the way to her studio on a map. Pure functions: give them values, get answers.
 * Tested in studio.test.ts. The next class itself comes from nextClass() in billboard.ts.
 */
import type { Studio } from '../../shared/content-schema';

import { strings } from '@/strings';

import { clock, DAYS_IN_WEEK, weekdayKeys, type StudioClass } from './billboard';

const MINUTES_IN_HOUR = 60;
/** A start that cannot be read sorts after every real one. */
const UNREADABLE = Number.MAX_SAFE_INTEGER;

/** "18:30" → 1110, minutes since midnight; undefined when the time cannot be read. */
function minutesOf(text: string): number | undefined {
  const time = clock(text);
  return time ? time[0] * MINUTES_IN_HOUR + time[1] : undefined;
}

export type ClassDay = {
  day: StudioClass['day'];
  /** "Today", "Tomorrow", else the weekday: "Friday". */
  label: string;
  /** The classes of that day, earliest first. */
  classes: StudioClass[];
};

/**
 * The days that have classes, starting from today and going round the week, each with its
 * classes in time order. Today comes first even when its classes are over: it is still today.
 */
export function classDays(classes: StudioClass[], now: Date): ClassDay[] {
  const today = now.getDay();
  const days: ClassDay[] = [];
  for (let ahead = 0; ahead < DAYS_IN_WEEK; ahead++) {
    const weekday = (today + ahead) % DAYS_IN_WEEK;
    const key = weekdayKeys[weekday];
    const ofDay = classes.filter((c) => c.day === key);
    if (ofDay.length === 0) continue;
    // A stable sort: two classes at the same time keep the order they were written in.
    const sorted = [...ofDay].sort((a, b) => (minutesOf(a.start) ?? UNREADABLE) - (minutesOf(b.start) ?? UNREADABLE));
    const label = ahead === 0 ? strings.maria.today : ahead === 1 ? strings.maria.tomorrow : strings.today.weekdays[weekday];
    days.push({ day: key, label, classes: sorted });
  }
  return days;
}

/** "75 min" between "18:30" and "19:45"; nothing without an end, or when the end is not after the start. */
export function classLength(start: string, end?: string): string | undefined {
  if (!end) return undefined;
  const [from, to] = [minutesOf(start), minutesOf(end)];
  if (from === undefined || to === undefined || to <= from) return undefined;
  return strings.common.minutes(to - from);
}

/** "18:30", or "18:30 – 19:45" when the class has an end. */
export function classTime(item: StudioClass): string {
  return item.end ? strings.maria.timeRange(item.start, item.end) : item.start;
}

/** "All levels · 75 min": the level and the length, each only when known. Nothing when neither is. */
export function classDetails(item: StudioClass): string | undefined {
  const parts = [item.level?.trim(), classLength(item.start, item.end)].filter((p): p is string => !!p);
  return parts.length > 0 ? strings.maria.joined(parts) : undefined;
}

export type ContactKind = 'whatsapp' | 'email' | 'phone' | 'instagram' | 'website';

export type ContactAction = {
  kind: ContactKind;
  /** What the button opens: https://wa.me/…, mailto:…, tel:…, a web address. */
  url: string;
  /** The address as a person reads it, shown when the link will not open on this phone. */
  shown: string;
};

/** A line of the contact block, or nothing when it is absent or blank. */
const filled = (value: string | undefined): string | undefined => {
  const v = value?.trim();
  return v ? v : undefined;
};

/**
 * How to reach Maria, in order.
 *   main  the gold "Message Maria": WhatsApp when there is a number, else email, else nothing.
 *   more  the ghost buttons, only for what is filled in: call, Instagram, email (unless it is
 *         already the gold one), website.
 */
export function contactActions(contact: Studio['contact']): { main: ContactAction | undefined; more: ContactAction[] } {
  const whatsapp = filled(contact.whatsapp);
  const email = filled(contact.email);
  const phone = filled(contact.phone);
  const instagram = filled(contact.instagram)?.replace(/^@/, '');
  const website = filled(contact.website);

  const emailAction: ContactAction | undefined = email ? { kind: 'email', url: `mailto:${email}`, shown: email } : undefined;
  const main: ContactAction | undefined = whatsapp
    ? // wa.me wants the digits of the number, without the "+".
      { kind: 'whatsapp', url: `https://wa.me/${whatsapp.replace(/\D/g, '')}`, shown: whatsapp }
    : emailAction;

  const more: ContactAction[] = [];
  if (phone) more.push({ kind: 'phone', url: `tel:${phone}`, shown: phone });
  if (instagram) more.push({ kind: 'instagram', url: `https://instagram.com/${instagram}`, shown: `instagram.com/${instagram}` });
  if (emailAction && main !== emailAction) more.push(emailAction);
  if (website) more.push({ kind: 'website', url: website, shown: website });
  return { main, more };
}

/** The place on a map: Maria's own Google Maps link, else a Google Maps search for the address. */
export function mapsLink(location: NonNullable<Studio['location']>): string {
  const own = filled(location.mapsUrl);
  if (own) return own;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
}
