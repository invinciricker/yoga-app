/**
 * The week as rows of dots (docs/phases/phase-6.md, 1.5): what each dot holds, how big it is, and
 * how a row reads aloud. Nothing is scored: the dots only show people their own answers, one round
 * (one week) at a time.
 *
 *   - A row has one cell per step of one round of the dots' own section, in order: the round of the
 *     page on screen, or the row's own `round` (Week 1 next to Week 10).
 *   - A cell holds the answer to the row's prompt (`of`) on the page written at that step. The page
 *     on screen gives its answers as they are on screen right now, filled-in ones included.
 *   - No page at that step, a skipped page, the question left empty, or an answer that no longer
 *     fits the question (an option since renamed): no answer, an empty ring.
 *
 * The pages given are those of the start ("cycle") of the page on screen (src/journal/cycles.ts).
 * Pure functions. Tested in dots.test.ts.
 */
import type { GuidedJournal, GuidedPrompt } from '../../shared/content-schema';

import { strings } from '@/strings';

import { sameStep, stepsOfRound, type Step } from './guided';
import { entriesOf, isEmptyValue, type Answer, type AnswerValue, type JournalEntry } from './types';

type DotsPrompt = Extract<GuidedPrompt, { kind: 'dots' }>;
/** The kinds of question a row can read. */
export type DotQuestion = Extract<GuidedPrompt, { kind: 'yesno' | 'scale' | 'choice' }>;

/** One row of dots. */
export type DotsRow = {
  label: string;
  /** The question it reads, or undefined when the content no longer has it (the row is all rings). */
  question: DotQuestion | undefined;
  /** One per step of the round: the answer, or undefined. */
  values: (AnswerValue | undefined)[];
  /** Which cell is the page on screen, or -1 when this row shows another round. */
  here: number;
};

/** The page on screen: its id (if it is written yet) and its answers as they are on screen now. */
export type OnScreen = { id?: string; answers: Readonly<Record<string, Answer>> };

/** The answer as the question can draw it, or undefined. */
function fitting(question: DotQuestion | undefined, value: AnswerValue | undefined): AnswerValue | undefined {
  if (!question || value === undefined || isEmptyValue(value)) return undefined;
  if (question.kind === 'yesno') return typeof value === 'boolean' ? value : undefined;
  if (question.kind === 'scale') return typeof value === 'number' && value >= question.from && value <= question.to ? value : undefined;
  return typeof value === 'string' && !question.many && question.options.includes(value) ? value : undefined;
}

/** The question a row reads: the first prompt with that id in the section, if it can be drawn. */
function questionOf(journal: GuidedJournal, sectionId: string, id: string): DotQuestion | undefined {
  const section = journal.sections.find((s) => s.id === sectionId);
  for (const page of section?.pages ?? []) {
    for (const prompt of page.prompts) {
      if ('id' in prompt && prompt.id === id) {
        return prompt.kind === 'yesno' || prompt.kind === 'scale' || (prompt.kind === 'choice' && !prompt.many) ? prompt : undefined;
      }
    }
  }
  return undefined;
}

/**
 * For each row of a dots prompt on the page at `at`, its values, one per step of the round.
 * `entries` are the pages of the journal's start that the page on screen belongs to.
 */
export function dotsOf(
  journal: GuidedJournal,
  entries: readonly JournalEntry[],
  at: Step,
  rows: DotsPrompt['rows'],
  onScreen: OnScreen,
): DotsRow[] {
  const section = journal.sections.find((s) => s.id === at.section);
  const written = entriesOf(journal.slug, entries).filter((e) => !e.skipped && e.id !== onScreen.id && e.section === at.section);
  return rows.map((row) => {
    const round = row.round ?? at.round;
    const question = questionOf(journal, at.section, row.of);
    const steps = section ? stepsOfRound(section, round) : [];
    const values = steps.map((step) => {
      if (sameStep(at, step)) return fitting(question, onScreen.answers[row.of]?.value);
      // The page written at that step; were there two (never in practice), the one changed last with an answer.
      const answered = written
        .filter((e) => sameStep(step, e) && fitting(question, e.answers?.[row.of]?.value) !== undefined)
        .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));
      return answered[0] ? fitting(question, answered[0].answers?.[row.of]?.value) : undefined;
    });
    return { label: row.label, question, values, here: steps.findIndex((step) => sameStep(at, step)) };
  });
}

/** The smallest dot of a scale or a choice, and the small dot of a "No", as a part of the cell. */
export const DOT_SMALLEST = 0.35;
export const DOT_NO = 1 / 3;

/**
 * How big a dot is, as a part of its cell (0 for no answer: an empty ring). Yes is a full dot, No a
 * small one; a scale or a choice grows in equal steps from DOT_SMALLEST (the lowest answer, or the
 * first option) to the whole cell (the highest, or the last).
 */
export function dotSize(question: DotQuestion | undefined, value: AnswerValue | undefined): number {
  const v = fitting(question, value);
  if (v === undefined || !question) return 0;
  if (question.kind === 'yesno') return v === true ? 1 : DOT_NO;
  const [n, steps] = question.kind === 'scale' ? [(v as number) - question.from, question.to - question.from] : [question.options.indexOf(v as string), question.options.length - 1];
  return steps <= 0 ? 1 : DOT_SMALLEST + ((1 - DOT_SMALLEST) * n) / steps;
}

/** The Yes answers of a yes or no row, or undefined for another kind of row. */
export function yesCount(row: DotsRow): number | undefined {
  return row.question?.kind === 'yesno' ? row.values.filter((v) => v === true).length : undefined;
}

/** One cell in words: "yes", "no", "3 of 5", "7 to 8" (an option), "no answer". */
function cellWords(question: DotQuestion | undefined, value: AnswerValue | undefined): string {
  const words = strings.journal;
  if (value === undefined || !question) return words.dotNone;
  if (question.kind === 'yesno') return value === true ? words.dotYes : words.dotNo;
  if (question.kind === 'scale') return words.dotOf(value as number, question.to);
  return String(value);
}

/** A row read aloud as one sentence: "Energy: 3 of 5, no answer, 4 of 5." or "Did it: yes, no. 5 of 7." */
export function dotsSentence(row: DotsRow): string {
  const yes = yesCount(row);
  const cells = row.values.map((v) => cellWords(row.question, v));
  return strings.journal.dotsSentence(row.label, cells, yes === undefined ? undefined : strings.journal.yesCount(yes, row.values.length));
}
