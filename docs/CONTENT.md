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
7. Print a summary: counts, the list of drafts, the list of samples. With `--release`, exit with an error if any sample remains.
8. Warn when `content.json` is larger than 400 KB: it is time to ask the architect about splitting it.

`tools/content/check.ts` does steps 1 and 2 only, fast, for `npm run check`.
