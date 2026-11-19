# Phase 5: "Journal, part one"

Written by Claude chat, 19 Nov 2026. For Claude Code. Read `CLAUDE.md`, `docs/V2.md` (above all "One day, four small things", "Limits that keep it calm" and the Journal lines of "The new areas, in short"), and in `docs/DESIGN.md` "The parts", "Motion" and "Words". The content of the Gratitude journal is written: `docs/phases/phase-5/gratitude-journal.yaml`. There is no drawn mockup for the Journal: the words below are the target, built from the parts and the spirit of the screens that exist. Phase 4 must be merged.

## In one paragraph

The Journal tab opens. People can write free pages, and follow the Gratitude journal: 28 pages over four weeks, one new page a day, then an open pool of pages to keep going. Everything written stays on the phone: never sent, never counted, never read by anyone else, and it can be exported or deleted. Writing lights the day's candle like a lesson does, Today offers the day's page, and after a lesson the closing screen offers "Write a line about it?". Underneath, one engine reads journals as content, so Phase 6 adds the Habit and Health journals mostly as two new files. This phase arrives **over the air**: it is the real test that updates reach the phone.

## 0. This phase must arrive over the air

The owner's phone has the build of 17 Nov 2026, whose fingerprint is `9b4a4041a3b0f1c5de6fe9f877b5e75227a17787`.
- Add no library, and change nothing in `app.config.ts`, `eas.json` or the scripts of `package.json`. Do not take Expo updates: leave them for Phase 7, which needs a new build anyway.
- Before opening the pull request, compute the fingerprint the way `eas update` does in `.github/workflows/preview-update.yml` (`APP_VARIANT=preview`, Android; check Expo's fingerprint docs for the command), on `main` and on your branch. The two must be equal, and on `main` it should give the hash above; if your environment gives `main` another number, say so and rely on the comparison. Write the command and both results in the pull request. (Phase 4 compared without `APP_VARIANT=preview` and got `c19562c9…`: the comparison held, but the number was not the build's.)
- The things that could tempt you to add a library do not need one: export uses React Native's own `Share`; the keyboard is handled with React Native's own tools.

## 1. The guided journal format

A guided journal is content, so pages can be added or reworded without a store update. Add this to `shared/content-schema.ts` in a `protected:` commit (everything optional at the top level, so files built before still pass), and describe it in `docs/CONTENT.md`.

**The source**, `content/guided-journals/<slug>/journal.yaml`. The folder's name is the journal's slug, permanent.

```ts
type GuidedJournalSource = {
  title: string;            // "Gratitude"
  summary: string;          // one line under the title
  aura: AuraName;           // its cover (a journal's cover is always dark)
  order: number;            // its place on the Journal tab, 1 first
  minutes: number;          // what a page usually takes: "3 min a page"
  draft?: boolean;          // true: the preview app only
  intro: { title: string; text: string }[];  // "About this journal": shown before page 1. text is Markdown
  sources?: string[];       // the research behind it, plain text, at the end of "About this journal"
  sections: {
    id: string;             // permanent
    title: string;          // "Week 1 · Noticing"
    repeat?: number | 'forever'; // default 1. 'forever' is allowed on the last section only
    together?: boolean;     // its pages may all be written on one day (a set-up). Default false
    pages: {
      id: string;           // permanent, unique in the journal
      title: string;
      times?: number;       // the same page, this many times in a row: 1 to 30, default 1
      skip?: string;        // words of a quiet button that passes the page without writing ("Not today")
      prompts: Prompt[];    // at least one
    }[];
  }[];
};

type Prompt = { showIf?: { prompt: string; is?: string | number | boolean; answered?: true } } & (
  | { kind: 'note'; text: string }                     // a short reading card (Markdown), nothing to answer
  | { kind: 'text'; id: string; ask: string; hint?: string; lines?: number; share?: string }
  | { kind: 'list'; id: string; ask: string; count: number; hint?: string }        // 1 to 10 short lines
  | { kind: 'choice'; id: string; ask: string; options: string[]; many?: boolean } // 2 to 8 options
  | { kind: 'scale'; id: string; ask: string; from: 0 | 1; to: 5 | 10; low: string; high: string }
  | { kind: 'yesno'; id: string; ask: string }
  | { kind: 'fill'; id: string; sentence: string }       // blanks written ___ (two or more underscores)
  | { kind: 'recall'; of: string; which?: 'first' | 'latest'; label?: string } // shows an earlier answer
);
```

Prompt ids are permanent and unique within a journal: people's answers are kept under them. `showIf` names a prompt **earlier on the same page**: the prompt shows only when that one has the answer `is`, or any answer (`answered: true`).

**Built** into `content.json` and `preview.json` as `guidedJournals` (optional; old versions of the app ignore it): the same, with `slug`, the defaults filled in, and every `intro` text and `note` text turned into blocks by the content build's Markdown code. Drafts only in `preview.json`, as for lessons.

**The content check refuses**, each time with the file and a plain sentence: a slug that is not a slug; two sections, two pages or two prompts with the same id in one journal; a `recall` whose `of` is not a prompt id of the same journal; a `showIf` that does not name a prompt earlier on its page; `forever` anywhere but the last section; a list `count`, a text `lines`, a page `times` or a number of options outside its range; a `fill` without a blank; a page without prompts; a missing `title`, `summary`, `order` or `intro`.

**Old versions keep working.** The app reads `guidedJournals` apart from the rest, and leniently. A journal it cannot read is left out, and the rest of the content still loads. A prompt of a kind it does not know is skipped. A page left with nothing to show says "This page needs a newer version of the app." and offers a way past it. Phase 6 will add prompt kinds: this rule is what lets the Phase 5 app survive that. A test proves it with a journal holding a made-up kind.

Then **copy `docs/phases/phase-5/gratitude-journal.yaml` to `content/guided-journals/gratitude/journal.yaml`, unchanged.** This is the one exception to "`content/` is never touched during a phase". If the check refuses something in it, fix the smallest thing and say what in the pull request.

## 2. How each kind of prompt looks

All in the phone's theme, the area colour `write` (rose) for overlines and small icons. Between two prompts, generous space. The question in `title`, a hint under it in `meta`, `text.secondary`.
- **note**: a quiet card (`bg.raised`, hairline border) with the text in `body`, `text.secondary`.
- **text**: a field that starts at `lines` rows (default 3) and grows with the writing; the writing in `bodyLarge`. With `share`, a quiet button with those words and a send icon appears under the field once it holds text: it opens the system share sheet with that text.
- **list**: `count` one-line fields, numbered in `meta`.
- **choice**: chips, one chosen or several (`many`); a second tap clears a chip.
- **scale**: round buttons from `from` to `to`, the chosen one filled gold, `low` and `high` under the two ends in `meta`. From 0 to 10 there are eleven: two rows (0 to 5, 6 to 10), each button at least 48.
- **yesno**: two chips, "Yes" and "No".
- **fill**: the sentence, with a short field for each blank, wrapping like text.
- **recall**: a quote: the `label` in `meta` ("On your first page you wrote"), the earlier answer (a list as lines, a scale as "7 out of 10", a choice as its words, yes or no as "Yes" or "No"), and the day it was written. `which` is `latest` unless said; the page being written never counts. Nothing earlier: nothing shows.

Every field has its question as its accessibility label. Everything survives the phone's text at 1.3.

## 3. The rules of a guided journal

- **Starting.** A journal starts when its "Begin" is pressed at the end of "About this journal". That opens page 1.
- **One new page a day.** Once a page of a journal has been written on a day, its next page waits for the next day, except inside a `together` section. Free pages have no limit.
- **Progress is by page, not by date.** A missed day, a missed week: nothing changes and nothing is said about it. The next page waits where it was.
- **Nobody is sent back.** The next page is the first one after the last page done, in the journal's order (sections, then their repeats, then `times`). If the content changes later (a page added, moved or removed in a part already passed), the person keeps going forward. A written page stays readable even when its page no longer exists, because each answer keeps the words of its question.
- **Written** means: at least one answer, or a `note`-only page closed with "Done". The first answer typed makes the page written for that day, whether or not "Done" is pressed.
- **Skipping.** A page with `skip` shows a quiet button with its words. It passes the page, writes nothing, lights no candle, and opens the next page at once (a skip does not use up the day's page).
- **Past pages** can be reread and changed at any time. Changing them moves nothing.
- **The pool.** In a `forever` section, pages come in order and start again from the first after the last.

Pure functions, tests first (names are suggestions; keep their meaning): `nextStep` is taken, so call the journal's own `nextPageOf(journal, entries)`; `pageNumber(journal, step)` → "Page 6 of 28", where 28 counts every page before the `forever` section, or the section's title and a count inside it ("Keep going · 4"); `isVisible(prompt, answers)`; `recallOf(journal, entries, promptId, which, excludingEntry)`; `journalToday(journals, entries, today)` → what Today and the Journal tab suggest (section 5).

## 4. What people write, and where it is kept

On the phone only, under keys that all start with `ywm:journal:v1:` (one key per page written, plus any index you need). Nothing of it is ever sent, logged or counted outside the phone (`docs/V2.md`, limit 7).

```ts
/** One page someone wrote: a free page, or a page of a guided journal. */
type JournalEntry = {
  id: string;           // made when the page is first written; never reused
  kind: 'free' | 'guided';
  day: string;          // 'YYYY-MM-DD': the day it was FIRST written; it keeps it when edited later
  created: string;      // ISO time
  updated: string;      // ISO time
  // A free page
  text?: string;
  prompt?: string;      // the id of the "Give me a prompt" line, if one was chosen
  // A guided page
  journal?: string;     // the journal's slug
  section?: string;
  page?: string;
  round?: number;       // which repeat of its section, from 1
  time?: number;        // which of its page's `times`, from 1
  skipped?: boolean;
  answers?: Record<string, { ask: string; value: string | string[] | number | boolean }>;
  // by prompt id, WITH the question's words as they were when answered
};
```

- **Saving**: as the person types (a short pause), when they leave the page, and when the app goes to the background. Closing or killing the app mid-sentence loses at most the last second.
- **The record of the day**: when a page is first written on a day, add one `write` entry to `src/day/` for it: `ref` is the entry's id, `minutes` the time from opening the page to its last change that day, rounded up, 1 to 30, kept up to date while writing. One entry per page per day. It lights the candle; nothing of the writing goes into the record. A skip writes nothing.
- **Export**: in You, a `SettingsRow` "Export my journal", under History. It opens a page that says, in one sentence, "This hands your journal to the app you choose, such as your email or notes. From there, that app's own rules apply." and a gold "Export". The text: every page, oldest first; a free page as its day, its prompt line if any, its text; a guided page as the journal's title, the page's title, its day, then each question and its answer. React Native's `Share`. Android refuses very large shares: above 100,000 characters, share it in parts, oldest first, each starting "Part 1 of 3".
- **Delete my data** also erases every `ywm:journal:v1:` key. Its sentence becomes: "This erases your candles, the lessons you finished and saved, your answers, and everything in your journal, from this phone. Your settings stay."

## 5. The screens

**The Journal tab** (`app/(tabs)/journal.tsx`). In the phone's theme. `areas.journal` becomes `true`: the tab shows in the public app.
- The title "Journal", and under it, in `meta` with a small lock icon: "Private. It stays on this phone."
- **Today's page**, the one suggestion: a card with the journal's aura (always dark), the overline "Today's page", the page's title in `h2`, a line "Gratitude · Page 6 of 28 · 3 min", and a gold "Write". When nothing is started: overline "Begin", the first journal's title ("The Gratitude journal"), its summary, and a gold "Begin" that opens "About this journal". When today's page is written in every started journal: the card says "Today's page is written." with the sage tick, and a quiet "Read it".
- **The shelf**: one row per guided journal, by `order`: a small aura disc, its title, and a line ("Page 6 of 28", "Not started yet", or "Keep going · 4 pages"). Then the row "Free pages" ("14 pages", or "A blank page, whenever you like") with a small "New page" button on its right. Nothing else on the tab.

**A journal's page** (such as `/journal/gratitude`; the routes are yours, but remember Phase 4's lesson about a page and a folder of the same name on the web). Its cover (aura, title, summary, "3 min a page"), a `ProgressLine` with "Page 6 of 28" (in the pool: "28 pages, and 4 more"), the gold "Write today's page" (or "Begin", or the written state), a row "About this journal", then "Your pages", newest first: the page's title, its section, its day; a skipped page reads "Skipped", quietly.

**About this journal**: the intro cards one under the other (title in `h3`, text with `RichText`), then "The research behind it" with the sources in `meta`. Opened before starting, it ends with the gold "Begin".

**Writing a guided page**: in the phone's theme, like a sheet of paper in the light one. At the top: the back button; the overline "Gratitude · Week 1 · Noticing"; the page's title in `h1`; in `meta`, the long date ("Thursday 20 November") and "Page 3 of 28". Then the prompts. At the bottom, the gold "Done": it saves, gives a light tick and goes back. A `skip` button sits under it when the page has one. The field being typed in always stays above the keyboard. A past page opens on the same screen, its answers in place and editable, the overline saying the day it was written.

**Free pages**: the list (the gold "New page" at the top, then the pages newest first: the long date, and the first two lines of text; empty: "A blank page, whenever you like."). A free page: the long date as its overline, the chosen prompt in italic above the text, then one large field in `bodyLarge` that fills the screen. While the page is still empty, a quiet "Give me a prompt": each tap shows the next line of the pool, and the one showing when writing starts is kept. At the very bottom, a quiet "Delete this page", confirmed in place ("Delete" in `danger` and "Keep"), never with a system pop-up. The pool, in `src/strings.ts`, ids permanent:
- `clear-head`: "Clear my head. Write without stopping for three minutes. Spelling does not matter: nobody will read this but you."
- `tomorrow`: "Tomorrow's list. Before sleep, what is on your mind for tomorrow? Put it here so it can wait until morning."
- `best-future`: "My best possible future. Imagine that, a few years from now, things have gone as well as they reasonably could. Describe an ordinary day."
- `kind-letter`: "A kind letter to myself. Write to yourself about something you find hard, the way a good friend would."
- `after-practice`: "After practice. You have just practised. What did you notice, in your body or in your mind?"

**Today** (Home): directly under the big card, one `AreaCard` in the area `write` from `journalToday`: overline "Write", the page's title, and "Gratitude · page 6 of 28 · 3 min"; it opens the page. Nothing started: "Start the Gratitude journal" and its summary; it opens "About this journal". Written today: the sage tick and "Written today"; it opens the page to read. `journalToday` picks, among started journals whose next page is open today, the one written least recently.

**After a lesson**: with the Journal built, `nextStep('move', …)` now answers `write` when nothing was written today. Its quiet button "Write a line about it?" opens a new free page with `after-practice` already chosen.

## 6. The privacy page

In `docs/legal/privacy-policy.md` (a `protected:` commit with these words from the architect), then `npm run legal`:
- In "What stays on your phone", the first sentence becomes: "What you do in the app stays on your phone: the lessons you finished and your candles, your saved lessons, your answers to "How did that feel?", everything you write in the Journal, and your settings."
- After that section, add:

  > ## Your journal
  >
  > What you write in the Journal is kept only on this phone. It is never sent anywhere, and nobody, Maria included, can read it. The app does not count or analyse what you write. If you choose **You → Export my journal**, the app hands the text to the app you pick, such as your email or your notes: from there, that app's own rules apply.

- Set `updated:` to the day of your commit.

## 7. Two small things

- **The Android build run's Summary page** (`.github/workflows/android-build.yml`) starts with one plain sentence before the link: "This does not change the app on your phone. Open the link below on your phone and install the app from it, over the old one." The owner ran two builds and expected his phone to update by itself.
- **Sample progress** (`?demo=streak` and the gallery's switch) now also fills the journal, in memory only: the Gratitude journal started six days ago with five pages written (one of them yesterday), and two free pages.

## Check before the pull request

`npm run check`, with the new tests. Pictures at 390 × 844 in `docs/screens/phase-5/`, in both themes, fresh and with `?demo=streak`: `/journal`; the Gratitude journal's page; About this journal; three guided pages (page 1 with its scale and list, page 13 with its yes or no and "Send it", page 28 with its recalls); the free pages list; a free page with a prompt; `/` with the Write card; `/me`; the export page; and the closing screen of a lesson with "Write a line about it?" (dark only). Look at each one.

## Watch out for

The cases most likely to go wrong for a real person. Each deserves a test.
1. **Losing words.** The app closed, killed or sent to the background mid-sentence; the keyboard covering the field; one answer of 10,000 characters. A draft must survive a restart.
2. **Midnight.** A page begun at 23:55 and finished at 00:10 belongs to the first day, and the next page opens on the new one. A missed week changes nothing.
3. **Content changing under someone.** A page added, removed or moved in a week they have passed, or the journal turned into a draft: nobody is sent back, and every written page stays readable with its own questions.
4. **An older app meeting newer content.** A prompt kind it does not know, a field it does not know, a whole journal it cannot read: the rest still loads (test with a made-up kind).
5. **A big journal.** Export of 500 pages comes out in parts and nothing is cut silently; "Delete my data" while a page is open leaves no ghost behind.

## Not in this phase

The Habit and Health journals (Phase 6). Any backup, sync or cloud: the journal stays on the phone. A lock for the app, search in the journal, word counts, streaks of writing, reminders (Phase 10). Formatting the writing (bold, lists): plain text only.

## In the pull request

"Does this need a new build?": **No. Do not run "Android build" after merging**: a build made after an update already contains it, so the test below would prove nothing. Give the fingerprint check (section 0).

"To test on your phone":
1. After merging, open the **Actions** tab on GitHub and wait until "Preview update" has a green tick.
2. Close the app fully (swipe it away from the recent apps), open it, wait ten seconds, close it fully again, open it again.
3. **You → About**: the second grey line must now read "Update of" today's date and time. If it still says "The code that came with this build", stop and tell me.
4. **Journal** → Begin → read the three cards → Begin → write page 1 → Done. **Home**: the week has a candle; the Write card says "Written today".
5. **Journal → Free pages** → New page → Give me a prompt → write a line → Done.
6. Open a lesson → Mark as done → "Write a line about it?" → write a line.
7. **You → Export my journal** → Export → choose your email or notes: the text is there. Then **You → Delete my data**: the journal is empty again.
