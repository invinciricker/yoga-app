/**
 * Sample journal pages, for checking the screens (docs/phases/phase-5.md, section 7, and
 * docs/phases/phase-6.md, section 5). Shown in memory only, never saved (src/practice/demo.ts).
 *
 *   - the first journal by order (Gratitude): started six days ago, five pages, the latest yesterday;
 *   - Habit: set up 17 days ago (its three set-up pages that day), then two full weeks of pages
 *     (11 Yes, 3 No, the automatic feeling rising), two days missed, the latest yesterday: its next
 *     page is "Week 3 · Day 1";
 *   - Health: begun 9 days ago, a full first week with its look back, a day missed, then one page
 *     yesterday: its next page is "Week 2 · Day 2";
 *   - two free pages.
 * Each page written lights its candle in the record of the day. The words are in src/strings.ts
 * (gallery.samplePages); the numbers of the sample weeks are below.
 */
import type { GuidedJournal } from '../../shared/content-schema';

import { addDays, type DayEntry } from '@/day/record';
import { strings } from '@/strings';

import { isVisible, nextPageOf, pageAt } from './guided';
import type { Answer, AnswerValue, JournalEntry } from './types';

const words = strings.gallery.samplePages;
/** How many days ago each Gratitude page was written: six days ago, then on until yesterday, one day missed. */
const GUIDED_DAYS_AGO = [6, 5, 4, 2, 1];
const FREE_DAYS_AGO = [3, 1];

/** Habit: the set-up 17 days ago, then 14 pages (12 and 5 days ago missed). */
const HABIT_SETUP_AGO = 17;
const HABIT_DAYS_AGO = [16, 15, 14, 13, 11, 10, 9, 8, 7, 6, 4, 3, 2, 1];
const HABIT_DID = [true, false, true, true, false, true, true, true, true, true, false, true, true, true];
/** How automatic it felt, on the days it happened: rising from 1 to 4. */
const HABIT_AUTO = [1, 0, 2, 2, 0, 3, 2, 3, 3, 4, 0, 3, 4, 4];

/** Health: a first week from 9 days ago, 2 days ago missed, then yesterday. */
const HEALTH_DAYS_AGO = [9, 8, 7, 6, 5, 4, 3, 1];
const HEALTH = {
  'hl-slept': ['6 to 7', '5 to 6', '7 to 8', '7 to 8', '6 to 7', '8 to 9', '7 to 8', '7 to 8'],
  'hl-rested': [3, 2, 4, 4, 3, 5, 4, 4],
  'hl-energy': [3, 2, 4, 3, 3, 5, 4, 4],
  'hl-moved': ['A little', 'Hardly at all', '20 minutes or more', 'A little', 'Hardly at all', '20 minutes or more', '20 minutes or more', 'A little'],
  'hl-outside': [true, false, true, true, false, true, true, true],
  'hl-talked': [true, false, false, true, true, true, false, true],
} as Record<string, AnswerValue[]>;

/** What a sample page answers: its own values first, then the words of the gallery, then something plain. */
function answersOf(journal: GuidedJournal, step: NonNullable<ReturnType<typeof nextPageOf>>, own: Record<string, AnswerValue>, i: number) {
  const place = pageAt(journal, step)!;
  const answers: Record<string, Answer> = {};
  for (const prompt of place.page.prompts) {
    if (!('id' in prompt) || !isVisible(prompt, answers, step.round)) continue;
    const listed = words.answers[prompt.id];
    let value: AnswerValue | undefined = own[prompt.id] ?? (Array.isArray(listed) && typeof listed[0] === 'string' && prompt.kind === 'text' ? listed[i % listed.length] : listed);
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
  return { answers, place };
}

export function sampleJournal(
  journals: readonly GuidedJournal[],
  today: string,
): { entries: JournalEntry[]; begun: string[]; days: DayEntry[] } {
  const entries: JournalEntry[] = [];
  const days: DayEntry[] = [];
  const begun: string[] = [];
  const at = (ago: number, time: string) => `${addDays(today, -ago)}T${time}:00.000Z`;

  /** Writes the next page of a journal, `ago` days ago, at a time of the evening. */
  const write = (journal: GuidedJournal, ago: number, time: string, own: Record<string, AnswerValue> = {}, i = 0) => {
    const mine = entries.filter((e) => e.journal === journal.slug);
    const step = nextPageOf(journal, mine);
    if (!step || !pageAt(journal, step)) return false;
    const { answers, place } = answersOf(journal, step, own, i);
    const id = `sample-${journal.slug}-${mine.length + 1}`;
    entries.push({
      id,
      kind: 'guided',
      day: addDays(today, -ago),
      created: at(ago, time),
      updated: at(ago, time.replace(/:(\d)\d$/, ':$14')),
      journal: journal.slug,
      ...step,
      cycle: 1,
      answers,
      titles: { journal: journal.title, section: place.section.title, page: place.page.title },
    });
    days.push({ day: addDays(today, -ago), kind: 'write', ref: id, minutes: 4, at: at(ago, time) });
    return true;
  };

  const first = [...journals].sort((a, b) => a.order - b.order)[0];
  if (first) {
    begun.push(first.slug);
    for (const ago of GUIDED_DAYS_AGO) if (!write(first, ago, '20:10')) break;
  }

  const habit = journals.find((j) => j.slug === 'habit');
  if (habit && habit !== first) {
    begun.push(habit.slug);
    for (const time of ['19:00', '19:10', '19:20']) write(habit, HABIT_SETUP_AGO, time);
    HABIT_DAYS_AGO.forEach((ago, i) => {
      const did = HABIT_DID[i];
      write(habit, ago, '21:30', did ? { 'h-did': true, 'h-auto': HABIT_AUTO[i] } : { 'h-did': false, 'h-blocker': [i < 5 ? 'Too tired' : 'I forgot'] }, i);
    });
  }

  const health = journals.find((j) => j.slug === 'health');
  if (health && health !== first) {
    begun.push(health.slug);
    HEALTH_DAYS_AGO.forEach((ago, i) => {
      write(health, ago, '22:00', Object.fromEntries(Object.entries(HEALTH).map(([id, values]) => [id, values[i]])), i);
    });
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

  return { entries, begun, days };
}
