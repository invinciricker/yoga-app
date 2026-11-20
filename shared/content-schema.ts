/**
 * The content contract, in one file, used by BOTH sides:
 *   - tools/content/ (the build that turns content/ into content.json) validates what people WRITE
 *     with the "...Source" schemas;
 *   - the app validates what it DOWNLOADS with `contentFile`.
 *
 * PROTECTED FILE (see CLAUDE.md). Never change or remove a field. Adding an optional one is allowed,
 * in a separate commit starting with "protected:" and listed in the pull request.
 * Rules that keep old versions of the app working once it is on people's phones:
 *   1. Inside version 1, only ADD optional fields. Never rename, remove or change the meaning of one.
 *   2. The app must ignore fields it does not know and survive optional ones being absent.
 *   3. A breaking change means SCHEMA_VERSION = 2 published at content/v2/ while v1 keeps being built.
 * The formats are explained for humans in docs/CONTENT.md. Only dependency: zod.
 */
import { z } from 'zod';

export const SCHEMA_VERSION = 1;

// ------------------------------------------------------------------ small pieces
/** A slug is the folder name of a lesson, a series or a journal entry. It never changes once published. */
export const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const slug = z.string().regex(slugPattern, 'lowercase letters, digits and single dashes only').max(80);

/** A calendar day, "2026-11-20". YAML turns an unquoted date into a Date object, so accept both. */
export const day = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'a date like 2026-11-20'),
);

export const levels = ['gentle', 'steady', 'strong'] as const;
export const level = z.enum(levels);

/** Must match the keys of `aura` in src/theme/tokens.ts. */
export const auraNames = ['dusk', 'forest', 'candle', 'ember', 'moss', 'dawn', 'tide', 'iris', 'rose', 'saffron'] as const;
export const auraName = z.enum(auraNames);

/** What a lesson works on. A fixed list so filters stay tidy. The labels shown in the app are in docs/CONTENT.md. */
export const focusAreas = [
  'whole-body', 'hips', 'back', 'shoulders', 'legs', 'core', 'balance', 'breath', 'sleep', 'energy',
] as const;
export const focusArea = z.enum(focusAreas);

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const benefitIcons = ['moon', 'feather', 'wind', 'heart', 'sun', 'leaf'] as const;

/** A picture file sitting next to the markdown file, e.g. "cover.jpg". */
const imageFile = z.string().regex(/^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp)$/i, 'a file name like cover.jpg, in the same folder');
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'a time like 18:30');

/** Where the video is. "youtube" works from Phase 1. "file" (our own hosting, allows offline) arrives in Phase 7. */
export const video = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('youtube'),
    /** The 11 characters after "v=" or "youtu.be/" in the video's link. */
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'the 11-character YouTube video id'),
  }).strict(),
  z.object({
    provider: z.literal('file'),
    /** Path of the prepared video under the media host. Written by the Phase 7 pipeline, never by hand. */
    src: z.string().min(1),
    sizeMb: z.number().positive().optional(),
  }).strict(),
]);

const flowStep = z.object({
  /** When this step starts in the video, "3:45". Optional: a lesson without video has no times. */
  at: z.string().regex(/^\d{1,2}:[0-5]\d(:[0-5]\d)?$/, 'a time like 3:45').optional(),
  name: z.string().min(1).max(60),
  note: z.string().max(100).optional(),
}).strict();

/** Fields shared by everything that can have a cover. With a cover, the alt text is required. */
const coverFields = {
  cover: imageFile.optional(),
  coverAlt: z.string().min(1).max(140).optional(),
  /** Which generated cover to use when there is no photo. Left out: the build picks one from the slug. */
  aura: auraName.optional(),
};
const needsAlt = (v: { cover?: string; coverAlt?: string }) => !v.cover || !!v.coverAlt;
const needsAltMessage = { message: 'coverAlt is required when there is a cover (one line describing the photo)', path: ['coverAlt'] };

// ------------------------------------------------------------------ what people write (frontmatter)
/** content/lessons/<slug>/lesson.md */
export const lessonSource = z.object({
  title: z.string().min(1).max(60),
  /** One sentence for cards and lists. */
  summary: z.string().min(1).max(140),
  /** The day it appears. Newest first everywhere. */
  published: day,
  /** true: only the preview app shows it. */
  draft: z.boolean().default(false),
  /** true: example text written by Claude, to delete before the store release. */
  sample: z.boolean().default(false),
  level,
  minutes: z.number().int().min(1).max(180),
  focus: z.array(focusArea).min(1).max(3),
  /** Slug of the series this lesson belongs to, and its place in it (1, 2, 3…). Both or neither. */
  series: slug.optional(),
  order: z.number().int().min(1).optional(),
  ...coverFields,
  video: video.optional(),
  /** "You'll need": mat, cushion… */
  props: z.array(z.string().min(1).max(24)).max(6).default([]),
  /** "The flow": the poses in order. */
  flow: z.array(flowStep).max(30).default([]),
  /** "A note from Maria": her own words about this lesson. */
  note: z.string().max(400).optional(),
  /** May be chosen as the big card on Today. */
  featured: z.boolean().default(false),
  /** Send a notification the first time this is published (Phase 5). */
  notify: z.boolean().default(false),
}).strict()
  .refine(needsAlt, needsAltMessage)
  .refine((v) => (v.series === undefined) === (v.order === undefined), { message: 'series and order go together', path: ['order'] });

/** content/series/<slug>/series.md */
export const seriesSource = z.object({
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(140),
  published: day,
  draft: z.boolean().default(false),
  sample: z.boolean().default(false),
  ...coverFields,
}).strict().refine(needsAlt, needsAltMessage);

/** content/journal/<slug>/entry.md. A "tip" is short advice; a "note" is something Maria has learned, written longer. */
export const journalSource = z.object({
  kind: z.enum(['tip', 'note']),
  title: z.string().min(1).max(60),
  summary: z.string().min(1).max(140),
  published: day,
  draft: z.boolean().default(false),
  sample: z.boolean().default(false),
  ...coverFields,
  /** One sentence in Maria's words. The newest entry that has one is shown on Today. */
  quote: z.string().max(180).optional(),
  /** Up to 3 lesson slugs shown under the entry. */
  related: z.array(slug).max(3).default([]),
  notify: z.boolean().default(false),
}).strict().refine(needsAlt, needsAltMessage);

/** content/studio/studio.md: Maria, her classes, why yoga. The text under the frontmatter is her introduction. */
export const studioSource = z.object({
  name: z.string().min(1).max(40),
  /** Under her name: "Hatha yoga · Your city". */
  tagline: z.string().max(80).optional(),
  portrait: imageFile.optional(),
  portraitAlt: z.string().min(1).max(140).optional(),
  benefits: z.array(z.object({
    icon: z.enum(benefitIcons),
    title: z.string().min(1).max(28),
    text: z.string().min(1).max(120),
  }).strict()).max(6).default([]),
  classes: z.array(z.object({
    day: z.enum(weekdays),
    start: clock,
    end: clock.optional(),
    name: z.string().min(1).max(40),
    level: z.string().max(24).optional(),
  }).strict()).max(21).default([]),
  location: z.object({
    name: z.string().min(1).max(60),
    address: z.string().min(1).max(120),
    /** A Google Maps link to the place. */
    mapsUrl: z.string().url().optional(),
  }).strict().optional(),
  /** "First class free, then …". */
  pricing: z.string().max(140).optional(),
  /** Each button appears only if its line is filled in. */
  contact: z.object({
    /** International format, digits only after the +: "+15555550123". */
    whatsapp: z.string().regex(/^\+[1-9]\d{6,14}$/, 'a number like +15555550123').optional(),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'a number like +15555550123').optional(),
    /** The handle without @. */
    instagram: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }).strict().default({}),
  sample: z.boolean().default(false),
}).strict().refine((v) => !v.portrait || !!v.portraitAlt, { message: 'portraitAlt is required when there is a portrait', path: ['portraitAlt'] });

/** content/site.yaml */
export const siteSource = z.object({
  appName: z.string().min(1).max(30),
  /** Used in "New from Maria", "A note from Maria"… */
  teacherFirstName: z.string().min(1).max(20),
  /** Shown on the privacy page: where people write to ask about their data. */
  contactEmail: z.string().email().optional(),
  /** Added 17 Nov 2026 (Phase 3). Shown on the privacy page: the name Google Play shows as the developer. */
  publisher: z.string().min(1).max(60).optional(),
}).strict();

// ------------------------------------------------------------------ guided journals (added 19 Nov 2026, Phase 5)
/**
 * content/guided-journals/<slug>/journal.yaml: a guided journal (Gratitude, later Habit and Health).
 * A journal is a list of sections; a section is a list of pages; a page is a list of prompts.
 * The person's answers are kept on their phone under the prompt ids, so every id is PERMANENT:
 * once published, never rename or reuse a section, page or prompt id. Change the words instead.
 * Explained for humans in docs/CONTENT.md ("A guided journal"); the rules between ids (no two the
 * same, a recall that points to a real prompt…) are checked by tools/content/journals.ts.
 */
export const promptKinds = ['note', 'text', 'list', 'choice', 'scale', 'yesno', 'fill', 'recall', 'dots'] as const;

/** A blank in a fill-in sentence: two underscores or more ("I am glad that ___"). */
export const blankPattern = /_{2,}/;
/** The pieces of a fill-in sentence between its blanks: "a ___ b ___" → ["a ", " b ", ""]. */
export const sentencePieces = (sentence: string): string[] => sentence.split(/_{2,}/);

/** A section, page or prompt id: lowercase letters, digits and single dashes, like g-d01-good. */
const journalId = z.string().regex(slugPattern, 'an id like g-d01-good: lowercase letters, digits and single dashes').max(60);
const ask = z.string().min(1).max(300);

/** A round of a section, counted from 1 (Phase 6). */
const roundNumber = z.number().int().min(1);

/**
 * Shows a prompt only when an earlier prompt of the same page has the answer `is`, or any answer
 * (`prompt`); or, added 19 Nov 2026 (Phase 6), only in some rounds of its section (`round: 3`,
 * `round: [1, 10]`). Never both: an older app cannot read a showIf without `prompt` and leaves the
 * whole prompt out, which is what a "week 3" note needs. Written as one group of lines so that each
 * mistake gets its own plain sentence.
 */
const showIfSource = z.object({
  prompt: journalId.optional(),
  is: z.union([z.string(), z.number(), z.boolean()]).optional(),
  answered: z.literal(true).optional(),
  round: z.union([roundNumber, z.array(roundNumber).min(1)]).optional(),
}).strict()
  .refine((v) => v.prompt === undefined || v.round === undefined, {
    message: '"showIf" names a prompt or a round, never both: an older app would show this prompt in every round',
  })
  .refine((v) => v.prompt !== undefined || v.round !== undefined, {
    message: '"showIf" needs "prompt" (an earlier question of the page) or "round"',
  })
  .refine((v) => v.round === undefined || (v.is === undefined && v.answered === undefined), {
    message: '"is" and "answered" go with "prompt", not with "round"',
  });
const hint = z.string().min(1).max(200).optional();

export const promptSource = z.discriminatedUnion('kind', [
  /** A short reading card (Markdown), nothing to answer. */
  z.object({ kind: z.literal('note'), text: z.string().min(1).max(1500), showIf: showIfSource.optional() }).strict(),
  /** A field that grows with the writing. `share`: the words of a button that sends the text elsewhere. */
  z.object({
    kind: z.literal('text'), id: journalId, ask, hint: z.string().min(1).max(200).optional(),
    lines: z.number().int().min(1).max(12).optional(), share: z.string().min(1).max(30).optional(),
    /**
     * Added 19 Nov 2026 (Phase 6): once the field holds text, a quiet button with `label` hands the
     * text to the prompt `prompt` on the first page of the journal `to`, when that journal is free.
     */
    carry: z.object({ to: slug, prompt: journalId, label: z.string().min(1).max(30) }).strict().optional(),
    showIf: showIfSource.optional(),
  }).strict(),
  /** `count` short lines. */
  z.object({
    kind: z.literal('list'), id: journalId, ask, count: z.number().int().min(1).max(10),
    hint: z.string().min(1).max(200).optional(), showIf: showIfSource.optional(),
  }).strict(),
  /** One option, or several with `many`. `hint` and `prefill` added 19 Nov 2026 (Phase 6). */
  z.object({
    kind: z.literal('choice'), id: journalId, ask, hint, options: z.array(z.string().min(1).max(60)).min(2).max(8),
    many: z.boolean().optional(),
    /**
     * A choice of one filled in from what the person did today, until they answer it themselves:
     * `lessons-today` is the minutes of today's lessons marked done; the highest `atLeast` reached
     * picks its `option`.
     */
    prefill: z.object({
      from: z.literal('lessons-today'),
      pick: z.array(z.object({ atLeast: z.number().int().min(1).max(600), option: z.string().min(1) }).strict()).min(1).max(8),
    }).strict().optional(),
    showIf: showIfSource.optional(),
  }).strict(),
  /** Round buttons from `from` to `to`, with words under the two ends. `hint` added in Phase 6. */
  z.object({
    kind: z.literal('scale'), id: journalId, ask, hint, from: z.union([z.literal(0), z.literal(1)]),
    to: z.union([z.literal(5), z.literal(10)]), low: z.string().min(1).max(30), high: z.string().min(1).max(30),
    showIf: showIfSource.optional(),
  }).strict(),
  z.object({ kind: z.literal('yesno'), id: journalId, ask, hint, showIf: showIfSource.optional() }).strict(),
  /** A sentence with blanks written ___ (two or more underscores). */
  z.object({
    kind: z.literal('fill'), id: journalId,
    sentence: z.string().min(1).max(300).regex(blankPattern, 'a sentence with at least one blank, written ___ (two or more underscores)'),
    showIf: showIfSource.optional(),
  }).strict(),
  /** Shows an earlier answer (`of`: a prompt id of the same journal). */
  z.object({
    kind: z.literal('recall'), of: journalId, which: z.enum(['first', 'latest']).optional(),
    label: z.string().min(1).max(80).optional(), showIf: showIfSource.optional(),
  }).strict(),
  /**
   * Added 19 Nov 2026 (Phase 6). The week as rows of dots: one row per entry of `rows`, one dot per
   * step of a round of its section (the round on screen, or the row's own `round`), each the answer
   * to `of` (a yes or no, a scale or a choice of one of the same section). Nothing to answer.
   */
  z.object({
    kind: z.literal('dots'), ask, hint,
    rows: z.array(z.object({ of: journalId, label: z.string().min(1).max(16), round: roundNumber.optional() }).strict()).min(1).max(8),
    showIf: showIfSource.optional(),
  }).strict(),
]);

const pageSource = z.object({
  id: journalId,
  title: z.string().min(1).max(60),
  /** The same page, this many times in a row. */
  times: z.number().int().min(1).max(30).optional(),
  /** The words of a quiet button that passes the page without writing ("Not today"). */
  skip: z.string().min(1).max(30).optional(),
  prompts: z.array(promptSource).min(1),
}).strict();

const sectionSource = z.object({
  id: journalId,
  title: z.string().min(1).max(60),
  /** Default 1. "forever" is allowed on the last section only (the pool that keeps going). */
  repeat: z.union([z.number().int().min(1).max(52), z.literal('forever')]).optional(),
  /** Its pages may all be written on one day (a set-up). Default false. */
  together: z.boolean().optional(),
  /** Added 19 Nov 2026 (Phase 6): its pages are numbered "Week 3 · Day 5". Only where a round is seven steps. */
  numbering: z.literal('weeks').optional(),
  pages: z.array(pageSource).min(1),
}).strict();

export const guidedJournalSource = z.object({
  title: z.string().min(1).max(40),
  /** One line under the title. */
  summary: z.string().min(1).max(140),
  /** Its cover. A journal's cover is always dark (auras are night pictures). */
  aura: auraName,
  /** Its place on the Journal tab, 1 first. */
  order: z.number().int().min(1),
  /** What a page usually takes: "3 min a page". */
  minutes: z.number().int().min(1).max(60),
  draft: z.boolean().default(false),
  /** "About this journal", shown before page 1. Each text is Markdown. */
  intro: z.array(z.object({ title: z.string().min(1).max(60), text: z.string().min(1).max(3000) }).strict()).min(1),
  /** The research behind it, plain text, at the end of "About this journal". */
  sources: z.array(z.string().min(1).max(400)).optional(),
  /** Added 19 Nov 2026 (Phase 6): the words of a row on the journal's page that starts it again ("Start a new habit"). */
  again: z.string().min(1).max(30).optional(),
  sections: z.array(sectionSource).min(1),
}).strict();

/**
 * content/breath/<slug>/breath.yaml: a breathing exercise (added 20 Nov 2026, Phase 7). The whole
 * file is YAML. The folder's name is the exercise's slug, PERMANENT once published: the record of
 * the day keeps it on people's phones. Explained for humans in docs/CONTENT.md ("A breathing
 * exercise"); how many may be published at once is checked by tools/content/breath.ts.
 *
 * The rules of the breath (docs/V2.md: "nowhere in the app: fast breathing, a breath hold longer
 * than 8 seconds") are the same for the check and for the app: `breathRoundProblems` below.
 */
export const breathActions = ['in', 'hold', 'out'] as const;
export const partsOfDay = ['morning', 'afternoon', 'evening'] as const;
export const evidenceLevels = ['strong', 'promising', 'early', 'traditional'] as const;
/** A step lasts a whole number of seconds from 1 to this. */
export const MAX_STEP_SECONDS = 12;
/** A hold lasts this at most. */
export const MAX_HOLD_SECONDS = 8;
/** One breath (in, perhaps held, out) lasts this at least: ten breaths a minute at most. */
export const MIN_BREATH_SECONDS = 6;
/** Exercises published at once (docs/V2.md, "Limits that keep it calm", 2). Drafts do not count. */
export const MAX_PUBLISHED_BREATH = 6;

/** The few lines of a step the safety rules read. */
type StepShape = { do: string; seconds: number };

/**
 * How many breaths one round of an exercise holds: each run of steps "in" begins one (the sigh's
 * "in" then "top up" is one breath, taken in two parts). The round repeats, so a round that ends
 * on "in" and starts on "in" counts that run once.
 */
export function breathsInRound(steps: readonly StepShape[]): number {
  return steps.filter((step, i) => step.do === 'in' && steps[(i - 1 + steps.length) % steps.length].do !== 'in').length;
}

/**
 * What breaks the rules of the breath, one plain sentence each (empty when nothing does): a step
 * outside 1 to 12 whole seconds, a hold over 8, a round without a breath in or out, and more than
 * ten breaths a minute (each breath of a round lasting under 6 seconds on average).
 */
export function breathRoundProblems(steps: readonly StepShape[]): string[] {
  const out: string[] = [];
  steps.forEach((step, i) => {
    const which = `Step ${i + 1} (${step.do})`;
    if (!Number.isInteger(step.seconds) || step.seconds < 1 || step.seconds > MAX_STEP_SECONDS) {
      out.push(`${which} lasts ${step.seconds} seconds: a step is a whole number of seconds from 1 to ${MAX_STEP_SECONDS}.`);
    } else if (step.do === 'hold' && step.seconds > MAX_HOLD_SECONDS) {
      out.push(`${which} holds the breath for ${step.seconds} seconds: a hold is ${MAX_HOLD_SECONDS} seconds at most.`);
    }
  });
  const has = (action: string) => steps.some((step) => step.do === action);
  if (!has('in')) out.push('The round has no step "in": every round needs a breath in.');
  if (!has('out')) out.push('The round has no step "out": every round needs a breath out.');
  const breaths = breathsInRound(steps);
  const seconds = steps.reduce((sum, step) => sum + step.seconds, 0);
  if (breaths > 0 && seconds < MIN_BREATH_SECONDS * breaths) {
    const perMinute = Math.round(((60 * breaths) / seconds) * 10) / 10;
    out.push(
      `One round is ${seconds} seconds for ${breaths === 1 ? 'one breath' : `${breaths} breaths`}: that is ${perMinute} breaths a minute, and the app never asks for more than ${60 / MIN_BREATH_SECONDS}. No fast breathing: make the steps longer.`,
    );
  }
  return out;
}

const breathStepSource = z.object({
  do: z.enum(breathActions),
  /** A whole number from 1 to 12; a hold 8 at most (breathRoundProblems). */
  seconds: z.number(),
  via: z.enum(['nose', 'mouth']).optional(),
  /** Only through the nose: alternate nostril breathing. */
  side: z.enum(['left', 'right']).optional(),
  /** Replaces the word "In", "Hold" or "Out" ("Top up"). */
  label: z.string().min(1).max(16).optional(),
}).strict()
  .refine((step) => step.side === undefined || step.via !== 'mouth', {
    message: 'a "side" is only for breathing through the nose: remove "side", or change "via" to nose',
  });

export const breathSource = z.object({
  title: z.string().min(1).max(40),
  /** The line on cards and rows ("In for four, out for six."). */
  summary: z.string().min(1).max(80),
  /** "Settling, in the evening". */
  goodFor: z.string().min(1).max(40),
  /** Its place on the Breathe tab, 1 first. */
  order: z.number().int().min(1),
  /** Offered first at that time of day, on the tab and on Today. */
  suggest: z.array(z.enum(partsOfDay)).min(1).max(3).optional(),
  draft: z.boolean().default(false),
  /** One round of the exercise, repeated for the length chosen. */
  steps: z.array(breathStepSource).min(2).max(8),
  /** How to do it: Markdown. */
  how: z.string().min(1).max(1200),
  /** "Why this works", one tap away: how strong the evidence is, in plain words, and the sources. */
  why: z.object({
    level: z.enum(evidenceLevels),
    text: z.string().min(1).max(1500),
    sources: z.array(z.string().min(1).max(400)).min(1).max(6),
  }).strict(),
}).strict()
  .superRefine((exercise, ctx) => {
    for (const message of breathRoundProblems(exercise.steps)) ctx.addIssue({ code: 'custom', message, path: ['steps'] });
  });

// ------------------------------------------------------------------ what the app downloads (content.json)
/** A picture prepared by the build: several widths of the same image, biggest last. Paths are relative to content.json. */
export const image = z.object({
  variants: z.array(z.object({ w: z.number().int().positive(), path: z.string().min(1) })).min(1),
  /** Size of the original, to reserve the right space before it loads. */
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  /** Tiny blurred preview shown while the picture loads (expo-image "placeholder"). */
  blurhash: z.string().min(6),
  alt: z.string(),
});

/** Markdown is turned into these simple blocks at build time, so the app draws text with its own components. */
export const span = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  href: z.string().url().optional(),
});
export const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), level: z.union([z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ type: z.literal('paragraph'), spans: z.array(span) }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.array(span)) }),
  z.object({ type: z.literal('quote'), spans: z.array(span) }),
  z.object({ type: z.literal('image'), image }),
]);

export const lesson = z.object({
  slug,
  title: z.string(),
  summary: z.string(),
  published: day,
  draft: z.boolean().default(false),
  level,
  minutes: z.number(),
  focus: z.array(z.string()),
  series: slug.optional(),
  order: z.number().optional(),
  cover: image.optional(),
  /** Always present: the one written in the file, or the one the build picked from the slug. */
  aura: auraName.catch('dusk'),
  video: video.optional(),
  props: z.array(z.string()).default([]),
  flow: z.array(z.object({ at: z.string().optional(), name: z.string(), note: z.string().optional() })).default([]),
  note: z.string().optional(),
  featured: z.boolean().default(false),
  body: z.array(block).default([]),
});

export const series = z.object({
  slug,
  title: z.string(),
  summary: z.string(),
  published: day,
  draft: z.boolean().default(false),
  cover: image.optional(),
  aura: auraName.catch('forest'),
  /** Lesson slugs, in order. */
  lessons: z.array(slug),
  body: z.array(block).default([]),
});

export const journalEntry = z.object({
  slug,
  kind: z.enum(['tip', 'note']),
  title: z.string(),
  summary: z.string(),
  published: day,
  draft: z.boolean().default(false),
  cover: image.optional(),
  aura: auraName.catch('candle'),
  quote: z.string().optional(),
  related: z.array(slug).default([]),
  body: z.array(block).default([]),
});

export const studio = z.object({
  name: z.string(),
  tagline: z.string().optional(),
  portrait: image.optional(),
  benefits: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string() })).default([]),
  classes: z.array(z.object({
    day: z.enum(weekdays), start: z.string(), end: z.string().optional(), name: z.string(), level: z.string().optional(),
  })).default([]),
  location: z.object({ name: z.string(), address: z.string(), mapsUrl: z.string().optional() }).optional(),
  pricing: z.string().optional(),
  contact: z.object({
    whatsapp: z.string().optional(), phone: z.string().optional(), instagram: z.string().optional(),
    email: z.string().optional(), website: z.string().optional(),
  }).default({}),
  body: z.array(block).default([]),
});

/**
 * A guided journal as the app receives it (added 19 Nov 2026, Phase 5): the source with its slug,
 * the defaults filled in, and every `intro` text and `note` text turned into blocks.
 * Read LENIENTLY (`readableJournals` below), because Phase 6 and later add prompt kinds and fields
 * that an older app must survive: unknown fields are ignored, a prompt it cannot read is left out
 * of its page (a page left with nothing says so in the app), and a journal it cannot read is left
 * out without stopping the rest of the content.
 */
const showIfPrompt = z.object({
  prompt: z.string(),
  is: z.union([z.string(), z.number(), z.boolean()]).optional(),
  answered: z.boolean().optional(),
});
/** Added 19 Nov 2026 (Phase 6): only in these rounds of its section. An older app leaves such a prompt out. */
const showIfRound = z.object({ round: z.union([z.number().int(), z.array(z.number().int())]) });
const showIf = z.union([showIfPrompt, showIfRound]);
const promptId = z.string().min(1);
/** Phase 6 additions an app reads when it can, and ignores when a later version writes them differently. */
const lenient = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);
export const guidedPrompt = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('note'), text: z.array(block), showIf: showIf.optional() }),
  z.object({
    kind: z.literal('text'), id: promptId, ask: z.string(), hint: z.string().optional(),
    lines: z.number().int().min(1).max(30).default(3), share: z.string().optional(),
    carry: lenient(z.object({ to: z.string(), prompt: z.string(), label: z.string() })),
    showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('list'), id: promptId, ask: z.string(), count: z.number().int().min(1).max(10),
    hint: z.string().optional(), showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('choice'), id: promptId, ask: z.string(), hint: z.string().optional(), options: z.array(z.string()).min(1).max(12),
    many: z.boolean().default(false),
    /** Read only when `from` is one this version knows ("lessons-today"); later phases may add others. */
    prefill: lenient(z.object({ from: z.string(), pick: z.array(z.object({ atLeast: z.number(), option: z.string() })) })),
    showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('scale'), id: promptId, ask: z.string(), hint: z.string().optional(), from: z.number().int(), to: z.number().int(),
    low: z.string(), high: z.string(), showIf: showIf.optional(),
  }).refine((s) => s.to > s.from && s.to - s.from <= 10),
  z.object({ kind: z.literal('yesno'), id: promptId, ask: z.string(), hint: z.string().optional(), showIf: showIf.optional() }),
  z.object({ kind: z.literal('fill'), id: promptId, sentence: z.string().regex(blankPattern), showIf: showIf.optional() }),
  z.object({
    kind: z.literal('recall'), of: z.string(), which: z.enum(['first', 'latest']).default('latest'),
    label: z.string().optional(), showIf: showIf.optional(),
  }),
  /** Added 19 Nov 2026 (Phase 6): the week as rows of dots. Nothing to answer, never exported. */
  z.object({
    kind: z.literal('dots'), ask: z.string(), hint: z.string().optional(),
    rows: z.array(z.object({ of: z.string(), label: z.string(), round: z.number().int().min(1).optional() })).min(1),
    showIf: showIf.optional(),
  }),
]);
export const guidedPage = z.object({
  id: z.string().min(1),
  title: z.string(),
  times: z.number().int().min(1).default(1),
  skip: z.string().optional(),
  /** May be empty in the app: every prompt of the page was of a kind this version cannot draw. */
  prompts: z.array(guidedPrompt),
});
export const guidedSection = z.object({
  id: z.string().min(1),
  title: z.string(),
  repeat: z.union([z.number().int().min(1), z.literal('forever')]).default(1),
  together: z.boolean().default(false),
  /** Added 19 Nov 2026 (Phase 6): "Week 3 · Day 5". A kind of numbering this version does not know is plain numbering. */
  numbering: lenient(z.literal('weeks')),
  pages: z.array(guidedPage).min(1),
});
export const guidedJournal = z.object({
  slug,
  title: z.string(),
  summary: z.string(),
  aura: auraName.catch('rose'),
  order: z.number(),
  minutes: z.number(),
  draft: z.boolean().default(false),
  intro: z.array(z.object({ title: z.string(), text: z.array(block) })),
  sources: z.array(z.string()).default([]),
  /** Added 19 Nov 2026 (Phase 6): the words of the row that starts the journal again. */
  again: z.string().optional(),
  sections: z.array(guidedSection).min(1),
});

/** The journals of a downloaded file that this version can read; see guidedJournal above. Never throws. */
export function readableJournals(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((journal: unknown) => {
    const checked = guidedJournal.safeParse(withReadablePrompts(journal));
    return checked.success ? [checked.data] : [];
  });
}

/** The same journal with every prompt this version cannot read left out of its page. */
function withReadablePrompts(journal: unknown): unknown {
  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (!isObject(journal) || !Array.isArray(journal.sections)) return journal;
  return {
    ...journal,
    sections: journal.sections.map((section: unknown) =>
      isObject(section) && Array.isArray(section.pages)
        ? {
            ...section,
            pages: section.pages.map((page: unknown) =>
              isObject(page) && Array.isArray(page.prompts)
                ? { ...page, prompts: page.prompts.filter((prompt: unknown) => guidedPrompt.safeParse(prompt).success) }
                : page,
            ),
          }
        : section,
    ),
  };
}

/**
 * A breathing exercise as the app receives it (added 20 Nov 2026, Phase 7): the source with its
 * slug, the defaults filled in, `how` and `why.text` turned into blocks. Read LENIENTLY
 * (`readableBreath` below): unknown fields are ignored, and an exercise whose steps this version
 * cannot read entirely (a `do` it does not know, for example) is left out WHOLE, because a pacer
 * must never skip a step. Lines that only label a step (`via`, `side`) or the evidence (`level`)
 * are dropped when a later version writes something this one does not know, never the exercise.
 * The rules of the breath are checked again here: nothing fast ever reaches the pacer.
 */
export const breathStep = z.object({
  do: z.enum(breathActions),
  seconds: z.number(),
  via: z.enum(['nose', 'mouth']).optional().catch(undefined),
  side: z.enum(['left', 'right']).optional().catch(undefined),
  label: z.string().optional().catch(undefined),
});
export const breathExercise = z.object({
  slug,
  title: z.string(),
  summary: z.string(),
  goodFor: z.string(),
  order: z.number(),
  /** Parts of the day; one this version does not know never matches. */
  suggest: z.array(z.string()).default([]).catch([]),
  draft: z.boolean().default(false),
  steps: z.array(breathStep).min(2),
  how: z.array(block),
  why: z.object({
    level: z.enum(evidenceLevels).optional().catch(undefined),
    text: z.array(block),
    sources: z.array(z.string()).default([]),
  }),
}).refine((exercise) => breathRoundProblems(exercise.steps).length === 0);

/** The exercises of a downloaded file that this version can read; see breathExercise above. Never throws. */
export function readableBreath(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((exercise: unknown) => {
    const checked = breathExercise.safeParse(exercise);
    return checked.success ? [checked.data] : [];
  });
}

/** content/v1/content.json (published items) and content/v1/preview.json (drafts included). */
export const contentFile = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  generatedAt: z.string(),
  site: z.object({
    appName: z.string(),
    teacherFirstName: z.string(),
    contactEmail: z.string().optional(),
    /** Added 17 Nov 2026 (Phase 3): optional, so files built before it still pass. */
    publisher: z.string().optional(),
  }),
  studio,
  series: z.array(series),
  lessons: z.array(lesson),
  journal: z.array(journalEntry),
  /**
   * Added 19 Nov 2026 (Phase 5): the guided journals, by `order`. Optional, so files built before
   * still pass; read leniently, so a journal this version cannot read never stops the rest.
   */
  guidedJournals: z.preprocess(readableJournals, z.array(guidedJournal)).optional(),
  /**
   * Added 20 Nov 2026 (Phase 7): the breathing exercises, by `order`. Optional, so files built before
   * still pass; read leniently, so an exercise this version cannot read never stops the rest.
   */
  breath: z.preprocess(readableBreath, z.array(breathExercise)).optional(),
});

export type Level = z.infer<typeof level>;
export type AuraName = z.infer<typeof auraName>;
export type Video = z.infer<typeof video>;
export type Image = z.infer<typeof image>;
export type Span = z.infer<typeof span>;
export type Block = z.infer<typeof block>;
export type Lesson = z.infer<typeof lesson>;
export type Series = z.infer<typeof series>;
export type JournalEntry = z.infer<typeof journalEntry>;
export type Studio = z.infer<typeof studio>;
export type PromptKind = (typeof promptKinds)[number];
export type GuidedPrompt = z.infer<typeof guidedPrompt>;
export type ShowIf = NonNullable<GuidedPrompt['showIf']>;
export type GuidedPage = z.infer<typeof guidedPage>;
export type GuidedSection = z.infer<typeof guidedSection>;
export type GuidedJournal = z.infer<typeof guidedJournal>;
export type BreathAction = (typeof breathActions)[number];
export type PartOfDayName = (typeof partsOfDay)[number];
export type EvidenceLevel = (typeof evidenceLevels)[number];
export type BreathStep = z.infer<typeof breathStep>;
export type BreathExercise = z.infer<typeof breathExercise>;
export type ContentFile = z.infer<typeof contentFile>;
