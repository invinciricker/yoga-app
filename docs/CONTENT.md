# Content: the formats

Written by Claude chat, 16 Nov 2026. This page is the reference. To add something, follow the short guide `docs/ADDING-CONTENT.md`. The exact rules, as code, are in `shared/content-schema.ts`; if this page and that file disagree, the file wins.

## Where things live

```
content/
  site.yaml                       the app's name, Maria's first name, the contact email, the publisher
  studio/studio.md                Maria's page: who she is, why yoga, class times, place, contact
  series/<slug>/series.md         a series (a set of lessons in order)
  lessons/<slug>/lesson.md        a lesson
  journal/<slug>/entry.md         a tip or a note
  guided-journals/<slug>/journal.yaml   a guided journal (Gratitude…): its pages and their questions
  breath/<slug>/breath.yaml       a breathing exercise (Phase 7): its steps, how to do it, why it works
```

- A **slug** is the folder's name: lowercase letters, digits and single dashes (`evening-wind-down`). It is the lesson's permanent address. It never changes after publication: reactions, saved lessons and progress on people's phones are filed under it.
- Each file starts with **frontmatter** (the lines between the two `---`), then the text in Markdown.
- **Photos** sit in the same folder as the file that uses them (`cover.jpg`). JPEG, PNG or WebP, 2400 pixels at most on the long side, under 1 MB. The build makes the smaller sizes. Every photo needs a one-line description (`coverAlt`) for people who cannot see it.
- No photo? Leave `cover` out. The app draws a cover from light (an "aura"). You can choose it with `aura: dusk | forest | candle | ember | moss`, or let the build pick.
- **Videos are not in this repository.** A lesson points to a video (see below).

## A lesson: `content/lessons/<slug>/lesson.md`

```yaml
---
title: Evening wind-down            # 60 characters at most
summary: A slow floor sequence to release the hips and lower back before bed.   # one sentence, 140 at most
published: 2026-11-20               # the day it appears; newest first everywhere
level: gentle                       # gentle | steady | strong
minutes: 12
focus: [hips, back, sleep]          # 1 to 3 from the list below
# --- everything below is optional ---
draft: true                         # only the preview app shows it; remove the line to publish
series: seven-evenings-of-rest      # the slug of its series…
order: 1                            # …and its place in it. Both or neither.
cover: cover.jpg
coverAlt: Maria in child's pose on a green mat
aura: dusk
video:
  provider: youtube
  id: M7lc1UVf-VE                   # the 11 characters after "v=" or "youtu.be/" in the link
props: [Mat, Cushion, Blanket]      # "You'll need", 6 at most
flow:                               # "The flow": the poses in order
  - at: "3:45"                      # when it starts in the video (optional, in quotes)
    name: Thread the needle
    note: Both sides                # optional
note: What Maria wants you to notice in this lesson.   # "A note from Maria", 400 at most
featured: true                      # may be the big card on Today
notify: true                        # send a notification when first published (from Phase 5)
---

The description, in Markdown. One or two short paragraphs is best.
```

**Focus list** (the word to write → what the app shows): `whole-body` → Whole body · `hips` → Hips · `back` → Back · `shoulders` → Shoulders · `legs` → Legs · `core` → Core · `balance` → Balance · `breath` → Breath · `sleep` → Sleep · `energy` → Energy. A new one needs the architect: it is a change to the schema.

**Levels** shown as: Gentle, Steady, Strong.

## A series: `content/series/<slug>/series.md`

```yaml
---
title: Seven evenings of rest
summary: One short practice each evening for a week, to sleep better.
published: 2026-11-16
# optional: draft, cover + coverAlt, aura
---

A few lines about the series.
```

The lessons of a series are the lessons whose `series` is its slug, sorted by `order`. A series with no published lesson is not shown.

## A journal entry: `content/journal/<slug>/entry.md`

```yaml
---
kind: tip                           # tip (short advice) | note (something Maria has learned, longer)
title: Soften the jaw
summary: When a pose gets hard, check your jaw first.
published: 2026-11-13
# optional: draft, cover + coverAlt, aura, notify
quote: One sentence in Maria's own words.   # the newest entry with a quote is shown on Today; 180 at most
related: [evening-wind-down]        # up to 3 lesson slugs shown under the entry
---

The text, in Markdown.
```

## A guided journal: `content/guided-journals/<slug>/journal.yaml`

Added 19 Nov 2026 (Phase 5). A guided journal is content, so its pages can be added or reworded without a store update. The whole file is YAML (no `---` lines, no Markdown body). The folder's name is the journal's slug, permanent. The Gratitude journal is the full example.

```yaml
title: Gratitude                    # 40 characters at most
summary: Four weeks of noticing what is good.   # one line under the title, 140 at most
aura: rose                          # its cover (a journal's cover is always dark)
order: 1                            # its place on the Journal tab, 1 first
minutes: 3                          # what a page usually takes: "3 min a page"
# draft: true                       # only the preview app shows it
intro:                              # "About this journal", shown before page 1. text is Markdown
  - title: What it does, honestly
    text: |
      One or two short paragraphs.
sources:                            # optional: the research behind it, plain text, at the end of "About this journal"
  - "Author (2005). Title. Journal, 60(5), 410–421."
sections:
  - id: week-1                      # permanent
    title: "Week 1 · Noticing"
    # repeat: 2                     # the section's pages, this many rounds (default 1). "forever" on the LAST section only
    # together: true                # all its pages may be written on one day (a set-up)
    pages:
      - id: d01                     # permanent, unique in the journal
        title: Three good things
        # times: 3                  # the same page, this many times in a row: 1 to 30
        # skip: Not today           # a quiet button that passes the page without writing
        prompts:                    # at least one
          - kind: note
            text: A short reading card, in Markdown. Nothing to answer.
          - id: g-d01-good          # permanent, unique in the journal: answers are kept under it
            kind: list
            ask: Three good things that happened.
            count: 3
```

**The kinds of prompt.** Every one except `note` and `recall` has an `id`.

| kind | lines it takes | what the person sees |
|---|---|---|
| `note` | `text` (Markdown) | a quiet reading card |
| `text` | `ask`, optional `hint`, `lines` (1 to 12, default 3), `share` (a button's words, such as "Send it") | a field that grows with the writing; with `share`, a button that hands the text to another app |
| `list` | `ask`, `count` (1 to 10), optional `hint` | that many one-line fields, numbered |
| `choice` | `ask`, `options` (2 to 8), optional `many: true` | chips: one chosen, or several |
| `scale` | `ask`, `from` (0 or 1), `to` (5 or 10), `low`, `high` | round buttons, the two words under the ends |
| `yesno` | `ask` | "Yes" and "No" |
| `fill` | `sentence` with blanks written `___` | the sentence, with a short field for each blank |
| `recall` | `of` (a prompt id of the same journal), optional `which` (`first` or `latest`, default `latest`), `label` | an earlier answer, as a quote, with its day; nothing when there is none |
| `dots` (Phase 6) | `ask`, optional `hint`, `rows` (1 to 8): each `{ of: <prompt id>, label: <16 characters at most>, round: <optional> }` | the week as rows of dots: one dot per page of a round of its section, its size the answer (see below) |

`choice`, `scale` and `yesno` may have a `hint` too (Phase 6), drawn under the question as on a text.

Any prompt may have `showIf: { prompt: <id>, is: <answer> }` or `showIf: { prompt: <id>, answered: true }`: it shows only when that prompt, **earlier on the same page**, has that answer (or any answer). Answers of `yesno` are `true` or `false`, of `scale` a number, of `choice` one of its options.

**Ids are permanent.** People's answers are kept under them on their phones. To change a page, change its words, never its ids, and never reuse an id for another question. Each answer also keeps the words of its question as they were, so a page written before a rewording stays readable.

### What the format learned in Phase 6 (19 Nov 2026)

Everything below is optional, and an app older than Phase 6 survives it (see "Older apps"). The Habit and Health journals use all of it.

- **The same question asked again.** The same prompt id on several pages of a journal is the same question asked again: its answers form one series (a recall finds the latest or first answer whichever page it was on; the dots read them all). It must ask for the same kind of answer each time: the same `kind`; for a choice, the same `options` and `many`; for a scale, the same `from` and `to`; for a list, the same `count`; for a fill, the same number of blanks. The words of `ask` and `hint` may differ. Never the same id twice on one page.
- **Weeks**: `numbering: weeks` on a section whose round is exactly seven pages (pages times their `times`). Its pages are numbered "Week 3 · Day 5": the week is the round, the day the page's place in the round. The "Page 2 of 3" of the sections before it counts only the sections without `numbering`.
- **Show by week**: `showIf: { round: 3 }` or `showIf: { round: [1, 10] }`: the prompt shows only in those rounds of its section (counted from 1; for a page written before, the round it was written in). Only in a section that repeats. Never together with `prompt`: an older app leaves a prompt with a round out entirely, which is what a "week 3" note needs.
- **Dots**: `kind: dots`, nothing to answer, never exported. Each row reads a `yesno`, a `scale` or a `choice` of one (`of`) **of the same section**, on every page of one round of that section: the round on screen, or the row's own `round` (Week 1 next to week 10). A full dot for Yes, a small one for No; for a scale or a choice, the bigger the dot the higher the answer (a choice's first option is the smallest); an empty ring for a day without an answer. At most seven pages to a round.
- **Filled in from today's practice**: on a `choice` of one,
  ```yaml
  prefill:
    from: lessons-today          # the minutes of today's lessons marked done
    pick:                        # the highest rule reached wins
      - { atLeast: 1, option: A little }
      - { atLeast: 20, option: 20 minutes or more }
  ```
  On a page of today with no answer to it, that option shows chosen, with "From your practice today: 25 min" under it. It is kept with the page's first answer or by "Done"; tapped away, it never comes back on that page; it never replaces an answer. `atLeast` is a whole number from 1 to 600; each `option` must be one of the choice's options.
- **Handed to another journal**: on a `text`, `carry: { to: habit, prompt: h-want, label: Make it a habit }`. Once the field holds text, a quiet button with the `label` hands the text to the prompt `prompt`, which must be a `text` on the first page of the first section of the journal `to` (another journal of `content/guided-journals/`). The button shows only while that journal has nothing written in it since it was last started. `label`: 30 characters at most.
- **Starting again**: `again: Start a new habit` on the journal (30 characters at most). Once a page is written, the journal's page shows a row with these words; confirming starts the journal again from its first page. The pages written before stay, under "Earlier".

**How the app uses it.** One new page a day per journal (except inside a `together` section); a missed day changes nothing; the next page is the first one after the last page done, in order (sections, their repeats, then `times`), so nobody is ever sent back. A page with `skip` can be passed, and a skip does not use up the day's page. In a `forever` section the pages come in order and start again after the last.

**The check refuses**, with the file and a plain sentence: a folder name that is not a slug; two sections or two pages with the same id in one journal; two prompts with the same id on one page, or on two pages with a different kind of answer (Phase 6); a `recall` whose `of` is not a prompt id of the journal; a `showIf` that does not name a prompt earlier on its page; `forever` anywhere but the last section; a list `count`, a text `lines`, a page `times` or a number of options outside its range; a `fill` without a blank; a page without prompts; a missing `title`, `summary`, `aura`, `order`, `minutes` or `intro`; pictures, tables or HTML in the Markdown. And, since Phase 6: a `showIf` with both `round` and `prompt`, a `round` below 1, in a section that does not repeat or beyond its repeats; `numbering: weeks` where a round is not seven pages; dots in a section whose round is more than seven pages, a row that reads a prompt of another section or one that is not a yes or no, a scale or a choice of one, a row `label` over 16 characters, a row `round` in a section that does not repeat or beyond its repeats; a `prefill` whose `from` is not `lessons-today`, whose `option` is not one of the choice's, whose `atLeast` is not a whole number from 1 to 600, or on a choice with `many`; a `carry` to a journal that is not there (or to its own), to a prompt that is not a text on that journal's first page, or with a `label` over 30 characters; an `again` over 30 characters.

**Older apps.** The app reads the journals apart from the rest, and leniently: a journal it cannot read is left out (the lessons still load), a prompt of a kind it does not know is skipped, and a page left with nothing says "This page needs a newer version of the app." and offers a way past it. So a later phase may add kinds of prompt without breaking the phones that have not updated. A Phase 5 app meeting the Phase 6 journals leaves out every `dots` and every prompt with `showIf: { round }`, ignores hints, weeks, `prefill`, `carry` and `again`, and keeps everything else (proved by `tools/content/olderApp.test.ts`). An app that meets a `prefill` with a `from` it does not know, or a `numbering` it does not know, shows a plain choice and plain numbers.

## A breathing exercise: `content/breath/<slug>/breath.yaml`

Added 20 Nov 2026 (Phase 7). The whole file is YAML, like a guided journal. The folder's name is the exercise's slug, **permanent once published**: the record of the day keeps it on people's phones. The five exercises written by the architect are the full examples.

```yaml
title: Long exhale                  # 40 characters at most
summary: In for four, out for six.  # the line on cards and rows, 80 at most
goodFor: Settling, in the evening   # 40 at most
order: 1                            # its place on the Breathe tab, 1 first
suggest: [evening]                  # optional: offered first at that time of day: morning | afternoon | evening
# draft: true                       # only the preview app shows it
steps:                              # ONE round of the exercise, repeated for the length chosen: 2 to 8 steps
  - { do: in, seconds: 4, via: nose }
  - { do: out, seconds: 6 }
  # do: in | hold | out
  # seconds: a whole number from 1 to 12; a hold 8 at most
  # via: nose | mouth (optional)
  # side: left | right (optional, only through the nose)
  # label: replaces the word "In", "Hold" or "Out" on screen, 16 characters at most ("Top up")
how: |                              # how to do it, Markdown, 1200 at most
  Sit or lie down comfortably…
why:                                # "Why this works", one tap away
  level: promising                  # strong | promising | early | traditional
  text: |                           # Markdown, 1500 at most: what the research found, plainly, including when it is weak
    Slowing the breath…
  sources:                          # 1 to 6, plain text, 400 at most each
    - "Author (2022). Title. Journal, 138, 104711."
```

**Breaths.** Two steps `in` in a row are one breath in, taken in two parts (the sigh: "in", then "top up"): the circle grows through both. A breath is one run of steps `in`, then whatever follows until the next breath in.

**The app shows the level** in plain words: *Strong evidence* ("Many good studies agree."), *Promising evidence* ("Some good studies. More are needed."), *Early evidence* ("Only a little research so far."), *A traditional practice* ("From a tradition, with little research of its own.").

**The check refuses**, one plain sentence each: a folder name that is not a slug; a step that is not a whole number of seconds from 1 to 12; a hold over 8 seconds; fewer than 2 or more than 8 steps; a round with no `in` or no `out`; more than ten breaths a minute (a breath lasting under 6 seconds: "No fast breathing", `docs/V2.md`); a `side` through the mouth; a `label` over 16 characters; an unknown `do`, `via`, `side`, `level` or time of day; a missing `title`, `summary`, `goodFor`, `order`, `steps`, `how` or `why`; pictures, tables or HTML in the Markdown; and **more than 6 exercises without `draft`** (`docs/V2.md`, limit 2).

**Older apps.** `breath` is optional in `content.json`, and an app built before Phase 7 ignores it (its reader drops keys it does not know). A Phase 7 app reads the exercises leniently: an exercise whose steps it cannot read entirely (a `do` it does not know) is left out whole, because a pacer must never skip a step; a `via`, `side` or `level` it does not know is left out of the words, not the exercise; unknown lines are ignored. The app checks the rules of the breath again: nothing fast ever reaches the pacer.

## Maria's page: `content/studio/studio.md`

Everything is optional except `name`; a block with nothing in it is not shown.

```yaml
---
name: Maria Surname
tagline: Hatha yoga · Your city
portrait: portrait.jpg
portraitAlt: Maria sitting cross-legged by a window
benefits:                           # "Why yoga", 6 at most
  - icon: moon                      # moon | feather | wind | heart | sun | leaf
    title: Sleep more deeply        # 28 at most
    text: Slow breathing before bed tells the body the day is over.   # 120 at most
classes:                            # her in-person classes
  - day: tue                        # mon tue wed thu fri sat sun
    start: "18:30"                  # 24-hour clock, in quotes
    end: "19:45"                    # optional
    name: Evening flow
    level: All levels               # optional
location:
  name: The studio's name
  address: Street, city
  mapsUrl: https://maps.app.goo.gl/xxxx    # the "Share" link from Google Maps
pricing: First class free, then 10 per class.
contact:                            # each button appears only if its line is filled in
  whatsapp: "+15555550123"         # international format, in quotes, no spaces
  phone: "+15555550123"
  instagram: maria.yoga             # without @
  email: maria@example.com
  website: https://example.com
---

Maria's introduction, in her own words.
```

## The app's own words: `content/site.yaml`

```yaml
appName: Yoga with Maria        # 30 characters at most
teacherFirstName: Maria         # 20 at most: "New from Maria", "Message Maria"…
# --- optional, but both are needed before the store release (the release build refuses without them) ---
contactEmail: someone@example.com   # on the privacy page: where people write about their data
publisher: Maria Surname        # 60 at most: the name Google Play shows as the developer, also on the privacy page
```

The privacy page (in the app and at `privacy.html` on the website) fills `{contactEmail}` and `{publisher}` from here; a line that is not there yet shows as "(not set yet)".

## Markdown that works in the text

Paragraphs, `## Heading` and `### Smaller heading`, **bold**, *italic*, [links](https://example.com), bulleted and numbered lists, `> a line set apart`, and pictures (`![description](photo.jpg)`, the photo in the same folder). Anything else (tables, HTML, code) is refused by the check, with the file and the line.

## Drafts, samples and publishing

- `draft: true` keeps an item out of the public app. The **preview app** (the one the owner installs from Expo) shows drafts with a small "Draft" label. Remove the line to publish.
- `sample: true` marks example text written by Claude. Samples behave like any other content, and the check prints a list of them. **The store release is blocked while one remains** (Phase 6).
- Content merged into `main` is live for everyone a few minutes later (GitHub Pages keeps files for about ten minutes; the app also keeps its own copy and refreshes it at launch).
- To take something down: set `draft: true`, or delete its folder. Nothing on people's phones breaks: the app ignores progress filed under a slug it no longer finds.

## What the app receives (for Claude Code)

The build (`tools/content/build.ts`, Phase 1) writes `content/v1/content.json` and `content/v1/preview.json`, both shaped as `contentFile` in `shared/content-schema.ts`, and `content/v1/media/`. Specification:

1. Read every folder; refuse (with file, field and a plain sentence) anything that fails its `...Source` schema, a folder whose name is not a slug, a `series` or `related` that points to nothing, two lessons with the same `order` in a series, a picture that is missing, over 1 MB or wider than 2400, and Markdown outside the list above.
2. Turn the Markdown body into `block`s with `remark-parse` (walk the tree; do not go through HTML).
3. For each picture: read with `sharp`, drop the metadata (phone photos carry the GPS position: it must not be published), write WebP at 480, 960 and 1440 wide (skip a width larger than the original; quality 78), name each `media/<first 12 characters of the sha-256 of the original>-<width>.webp`, compute the `blurhash` (4 × 3 components).
4. Resolve `aura` when absent: `auraNames[hash(slug) % 5]`, with the same hash function as the app's `auraForSlug`.
5. Sort lessons and journal entries by `published` (newest first), then by title. A series lists its lesson slugs by `order`.
6. `content.json` leaves out everything with `draft: true` (and a series left with no lesson). `preview.json` keeps drafts, with `draft: true` on them.
   Guided journals (Phase 5) go under the key `guidedJournals`, sorted by `order` then slug, with their defaults filled in and every `intro` and `note` text turned into blocks; drafts in `preview.json` only.
   Breathing exercises (Phase 7) go under the key `breath`, sorted by `order` then slug, with `how` and `why.text` turned into blocks; drafts in `preview.json` only.
7. Print a summary: counts, the list of drafts, the list of samples. With `--release`, exit with an error if any sample remains.
8. Warn when `content.json` is larger than 400 KB: it is time to ask the architect about splitting it.

`tools/content/check.ts` does steps 1 and 2 only, fast, for `npm run check`.
