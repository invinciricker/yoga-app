/**
 * The pages as the screens need them: all of them ("Your pages", the export), and those the rules
 * see (each journal's current start: src/journal/cycles.ts). The filtering happens here, once, so
 * no screen hands the rules a page of an earlier habit by mistake.
 */
import { useMemo } from 'react';

import { inCycles } from './cycles';
import { useJournal } from './store';

export function useJournalPages() {
  const all = useJournal((s) => s.entries);
  const cycles = useJournal((s) => s.cycles);
  const begun = useJournal((s) => s.begun);
  const current = useMemo(() => inCycles(all, cycles), [all, cycles]);
  return { all, current, cycles, begun };
}
