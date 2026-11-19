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
export const promptKinds = ['note', 'text', 'list', 'choice', 'scale', 'yesno', 'fill', 'recall'] as const;

/** A blank in a fill-in sentence: two underscores or more ("I am glad that ___"). */
export const blankPattern = /_{2,}/;
/** The pieces of a fill-in sentence between its blanks: "a ___ b ___" → ["a ", " b ", ""]. */
export const sentencePieces = (sentence: string): string[] => sentence.split(/_{2,}/);

/** A section, page or prompt id: lowercase letters, digits and single dashes, like g-d01-good. */
const journalId = z.string().regex(slugPattern, 'an id like g-d01-good: lowercase letters, digits and single dashes').max(60);
const ask = z.string().min(1).max(300);

/** Shows a prompt only when an earlier prompt of the same page has the answer `is`, or any answer. */
const showIfSource = z.object({
  prompt: journalId,
  is: z.union([z.string(), z.number(), z.boolean()]).optional(),
  answered: z.literal(true).optional(),
}).strict();

export const promptSource = z.discriminatedUnion('kind', [
  /** A short reading card (Markdown), nothing to answer. */
  z.object({ kind: z.literal('note'), text: z.string().min(1).max(1500), showIf: showIfSource.optional() }).strict(),
  /** A field that grows with the writing. `share`: the words of a button that sends the text elsewhere. */
  z.object({
    kind: z.literal('text'), id: journalId, ask, hint: z.string().min(1).max(200).optional(),
    lines: z.number().int().min(1).max(12).optional(), share: z.string().min(1).max(30).optional(),
    showIf: showIfSource.optional(),
  }).strict(),
  /** `count` short lines. */
  z.object({
    kind: z.literal('list'), id: journalId, ask, count: z.number().int().min(1).max(10),
    hint: z.string().min(1).max(200).optional(), showIf: showIfSource.optional(),
  }).strict(),
  /** One option, or several with `many`. */
  z.object({
    kind: z.literal('choice'), id: journalId, ask, options: z.array(z.string().min(1).max(60)).min(2).max(8),
    many: z.boolean().optional(), showIf: showIfSource.optional(),
  }).strict(),
  /** Round buttons from `from` to `to`, with words under the two ends. */
  z.object({
    kind: z.literal('scale'), id: journalId, ask, from: z.union([z.literal(0), z.literal(1)]),
    to: z.union([z.literal(5), z.literal(10)]), low: z.string().min(1).max(30), high: z.string().min(1).max(30),
    showIf: showIfSource.optional(),
  }).strict(),
  z.object({ kind: z.literal('yesno'), id: journalId, ask, showIf: showIfSource.optional() }).strict(),
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
  sections: z.array(sectionSource).min(1),
}).strict();

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
const showIf = z.object({
  prompt: z.string(),
  is: z.union([z.string(), z.number(), z.boolean()]).optional(),
  answered: z.boolean().optional(),
});
const promptId = z.string().min(1);
export const guidedPrompt = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('note'), text: z.array(block), showIf: showIf.optional() }),
  z.object({
    kind: z.literal('text'), id: promptId, ask: z.string(), hint: z.string().optional(),
    lines: z.number().int().min(1).max(30).default(3), share: z.string().optional(), showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('list'), id: promptId, ask: z.string(), count: z.number().int().min(1).max(10),
    hint: z.string().optional(), showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('choice'), id: promptId, ask: z.string(), options: z.array(z.string()).min(1).max(12),
    many: z.boolean().default(false), showIf: showIf.optional(),
  }),
  z.object({
    kind: z.literal('scale'), id: promptId, ask: z.string(), from: z.number().int(), to: z.number().int(),
    low: z.string(), high: z.string(), showIf: showIf.optional(),
  }).refine((s) => s.to > s.from && s.to - s.from <= 10),
  z.object({ kind: z.literal('yesno'), id: promptId, ask: z.string(), showIf: showIf.optional() }),
  z.object({ kind: z.literal('fill'), id: promptId, sentence: z.string().regex(blankPattern), showIf: showIf.optional() }),
  z.object({
    kind: z.literal('recall'), of: z.string(), which: z.enum(['first', 'latest']).default('latest'),
    label: z.string().optional(), showIf: showIf.optional(),
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
export type GuidedPage = z.infer<typeof guidedPage>;
export type GuidedSection = z.infer<typeof guidedSection>;
export type GuidedJournal = z.infer<typeof guidedJournal>;
export type ContentFile = z.infer<typeof contentFile>;
