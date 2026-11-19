/**
 * What every writing screen shares (a guided page, a free page), so they all save the same way.
 *
 *   - The page is created by its first change ("the first answer typed makes the page written for
 *     that day"); its `day` is that day and never changes.
 *   - Each change goes to the journal store (on the phone within a second) and to the record of
 *     the day: one "write" entry per page per day, `ref` the page's id, its minutes the time from
 *     opening the page to its last change, rounded up, 1 to 30. Nothing of the writing goes there.
 *   - The day of that entry is fixed by the first change of this opening: a page begun at 23:55
 *     and finished at 00:10 lights one candle, on the first day.
 *   - Leaving: whatever is waiting is written at once. A page created during this opening and left
 *     with nothing in it (a letter typed, then rubbed out) is forgotten, with its candle entry.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { dayOf } from '@/content/selectors';
import { useDays } from '@/day/store';

import { writingMinutes } from './dates';
import { useJournal } from './store';
import { hasWriting, type JournalEntry } from './types';

export type Writing = {
  /** The page as it is now, or undefined while nothing is written. */
  entry: JournalEntry | undefined;
  /** Keeps a change. Give the whole page; its `updated` time is set here. */
  save: (next: JournalEntry) => void;
  /** Keeps a page with nothing to answer (a page of notes closed with "Done") as written. */
  keepAsWritten: (entry: JournalEntry) => void;
  /** Forgets the page and its candle entries (Delete this page). */
  forget: () => void;
};

export function useWriting(id: string): Writing {
  const entry = useJournal((s) => s.entries.find((e) => e.id === id));
  const [openedAt] = useState(() => Date.now());
  const sessionDay = useRef<string | undefined>(undefined);
  const createdHere = useRef(false);
  const kept = useRef(false);

  // The minutes last written to the record: it is written again only when they change (at most
  // once a minute), not on every keystroke.
  const lastMinutes = useRef(0);

  const light = useCallback(
    (ref: string, now: Date) => {
      sessionDay.current ??= dayOf(now);
      const minutes = writingMinutes(openedAt, now.getTime());
      const recorded = useDays.getState().entries.some((e) => e.kind === 'write' && e.ref === ref && e.day === sessionDay.current);
      if (recorded && minutes === lastMinutes.current) return;
      lastMinutes.current = minutes;
      useDays.getState().upsert({ day: sessionDay.current, kind: 'write', ref, minutes, at: now.toISOString() });
    },
    [openedAt],
  );

  const save = useCallback(
    (next: JournalEntry) => {
      const now = new Date();
      if (!useJournal.getState().entries.some((e) => e.id === next.id)) createdHere.current = true;
      useJournal.getState().put({ ...next, updated: now.toISOString() });
      if (!next.skipped) light(next.id, now);
    },
    [light],
  );

  const keepAsWritten = useCallback(
    (written: JournalEntry) => {
      kept.current = true;
      save(written);
    },
    [save],
  );

  const forget = useCallback(() => {
    kept.current = false;
    useJournal.getState().remove(id);
    useDays.getState().removeRef(id);
  }, [id]);

  // Leaving the page: an empty page made here is forgotten; everything else is written at once.
  useEffect(
    () => () => {
      const current = useJournal.getState().entries.find((e) => e.id === id);
      if (current && createdHere.current && !kept.current && !current.skipped && !hasWriting(current)) {
        useJournal.getState().remove(id);
        useDays.getState().removeRef(id);
      }
      void useJournal.getState().flush();
    },
    [id],
  );

  return { entry, save, keepAsWritten, forget };
}
