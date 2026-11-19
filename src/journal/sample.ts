/**
 * Sample journal pages, for checking the screens (docs/phases/phase-5.md, section 7): the first
 * guided journal started six days ago with five pages written (one of them yesterday), and two free
 * pages. Each page lights its candle in the record of the day. Shown in memory only, never saved
 * (src/practice/demo.ts). The words are in src/strings.ts (gallery.samplePages).
 */
import type { GuidedJournal } from '../../shared/content-schema';

import { addDays, type DayEntry } from '@/day/record';
import { strings } from '@/strings';

import { isVisible, nextPageOf, pageAt } from './guided';
import type { Answer, AnswerValue, JournalEntry } from './types';

const words = strings.gallery.samplePages;
/** How many days ago each guided page was written: six days ago, then on until yesterday, one day missed. */
const GUIDED_DAYS_AGO = [6, 5, 4, 2, 1];
const FREE_DAYS_AGO = [3, 1];

export function sampleJournal(
  journals: readonly GuidedJournal[],
  today: string,
): { entries: JournalEntry[]; begun: string[]; days: DayEntry[] } {
  const entries: JournalEntry[] = [];
  const days: DayEntry[] = [];
  const at = (ago: number, time: string) => `${addDays(today, -ago)}T${time}:00.000Z`;

  const journal = [...journals].sort((a, b) => a.order - b.order)[0];
  if (journal) {
    for (const [i, ago] of GUIDED_DAYS_AGO.entries()) {
      const step = nextPageOf(journal, entries);
      const place = step && pageAt(journal, step);
      if (!step || !place) break;
      const answers: Record<string, Answer> = {};
      for (const prompt of place.page.prompts) {
        if (!('id' in prompt) || !isVisible(prompt, answers)) continue;
        const known = words.answers[prompt.id];
        let value: AnswerValue | undefined = known;
        if (value === undefined) {
          if (prompt.kind === 'text') value = words.text;
          else if (prompt.kind === 'list') value = Array.from({ length: prompt.count }, () => words.line);
          else if (prompt.kind === 'choice') value = prompt.many ? [prompt.options[0]] : prompt.options[0];
          else if (prompt.kind === 'scale') value = Math.round((prompt.from + prompt.to) / 2);
          else if (prompt.kind === 'yesno') value = true;
          else value = [words.line];
        }
        answers[prompt.id] = { ask: prompt.kind === 'fill' ? prompt.sentence : prompt.ask, value };
      }
      const id = `sample-guided-${i + 1}`;
      entries.push({
        id,
        kind: 'guided',
        day: addDays(today, -ago),
        created: at(ago, '20:10'),
        updated: at(ago, '20:14'),
        journal: journal.slug,
        ...step,
        answers,
        titles: { journal: journal.title, section: place.section.title, page: place.page.title },
      });
      days.push({ day: addDays(today, -ago), kind: 'write', ref: id, minutes: 4, at: at(ago, '20:14') });
    }
  }

  words.free.forEach((page, i) => {
    const ago = FREE_DAYS_AGO[i];
    const id = `sample-free-${i + 1}`;
    entries.push({
      id,
      kind: 'free',
      day: addDays(today, -ago),
      created: at(ago, '21:30'),
      updated: at(ago, '21:33'),
      text: page.text,
      ...(page.prompt ? { prompt: page.prompt } : null),
    });
    days.push({ day: addDays(today, -ago), kind: 'write', ref: id, minutes: 3, at: at(ago, '21:33') });
  });

  return { entries, begun: journal ? [journal.slug] : [], days };
}
