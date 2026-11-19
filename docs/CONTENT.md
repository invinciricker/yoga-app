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

Any prompt may have `showIf: { prompt: <id>, is: <answer> }` or `showIf: { prompt: <id>, answered: true }`: it shows only when that prompt, **earlier on the same page**, has that answer (or any answer). Answers of `yesno` are `true` or `false`, of `scale` a number, of `choice` one of its options.

**Ids are permanent.** People's answers are kept under them on their phones. To change a page, change its words, never its ids, and never reuse an id. Each answer also keeps the words of its question as they were, so a page written before a rewording stays readable.

**How the app uses it.** One new page a day per journal (except inside a `together` section); a missed day changes nothing; the next page is the first one after the last page done, in order (sections, their repeats, then `times`), so nobody is ever sent back. A page with `skip` can be passed, and a skip does not use up the day's page. In a `forever` section the pages come in order and start again after the last.

**The check refuses**, with the file and a plain sentence: a folder name that is not a slug; two sections, two pages or two prompts with the same id in one journal; a `recall` whose `of` is not a prompt id of the journal; a `showIf` that does not name a prompt earlier on its page; `forever` anywhere but the last section; a list `count`, a text `lines`, a page `times` or a number of options outside its range; a `fill` without a blank; a page without prompts; a missing `title`, `summary`, `aura`, `order`, `minutes` or `intro`; pictures, tables or HTML in the Markdown.

**Older apps.** The app reads the journals apart from the rest, and leniently: a journal it cannot read is left out (the lessons still load), a prompt of a kind it does not know is skipped, and a page left with nothing says "This page needs a newer version of the app." and offers a way past it. So a later phase may add kinds of prompt without breaking the phones that have not updated.

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
7. Print a summary: counts, the list of drafts, the list of samples. With `--release`, exit with an error if any sample remains.
8. Warn when `content.json` is larger than 400 KB: it is time to ask the architect about splitting it.

`tools/content/check.ts` does steps 1 and 2 only, fast, for `npm run check`.
