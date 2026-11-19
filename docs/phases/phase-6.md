# Phase 6: "Journal, part two"

Written by Claude chat, 19 Nov 2026. For Claude Code. Read `CLAUDE.md`, `docs/V2.md` (above all "Limits that keep it calm" and the two "Decisions (19 Nov 2026)" lists), `docs/CONTENT.md` ("A guided journal"), and sections 1 to 5 of `docs/phases/phase-5.md`: they describe the engine you are extending, which is built. The content is written: `docs/phases/phase-6/habit-journal.yaml` and `docs/phases/phase-6/health-journal.yaml`. Phase 5 must be merged.

## In one paragraph

The Habit and Health journals join Gratitude on the Journal tab. **Habit**: one small habit at a time. Three set-up pages (choose it, make it tiny, tie it to a moment; plan for what gets in the way), then a twenty-second page a day, and every seventh page a look back at the week, with a row of dots and the choice to keep or change the plan. Notes arrive at the right moments (weeks 1, 3, 6, 10), and at week ten the person decides whether it runs by itself and can start a new one. **Health**: a one-minute check-in (sleep, energy, mood, moving, daylight, a real conversation), and every seventh page the week as rows of dots, "What do you notice?", and one small change, which can become the next habit in one tap. Both journals are content. The engine learns eight small things (section 1), each of which an older app survives. Nothing is scored: the dots show people their own answers, on their phone. This phase arrives **over the air**, like Phase 5.

## 0. This phase must arrive over the air

The owner's phone has the build of 17 Nov 2026, fingerprint `9b4a4041a3b0f1c5de6fe9f877b5e75227a17787`.
- Add no library. Change nothing in `app.config.ts`, `eas.json`, `.gitignore` or the scripts of `package.json`. Do not take Expo updates: Phase 7 needs a build anyway and takes them.
- Before opening the pull request, run `APP_VARIANT=preview npx expo-updates runtimeversion:resolve --platform android` on `main` and on your branch (Phase 5 used it). Both must give the hash above. Write the command and both results in the pull request.

## 1. What the journal format learns

Eight additions, all optional. For each: add it to the source format in `shared/content-schema.ts` (`guidedJournalSource`, `promptSource`) and to what the app reads (`guidedJournal`, `guidedPrompt`), in one `protected:` commit, and describe it in `docs/CONTENT.md`. **Add the format before copying the two journals**: the Phase 5 check refuses their new fields.

```ts
// On a journal
again?: string;                  // 1 to 30 characters: the words of a row that starts the journal again (1.8)

// On a section
numbering?: 'weeks';             // its pages are numbered "Week 3 · Day 5" (1.4)

// On choice, scale and yesno, as already on text and list
hint?: string;                   // 1 to 200 characters, under the question (1.2)

// showIf is now one of these two
showIf?: { prompt: string; is?: string | number | boolean; answered?: true }  // as before
       | { round: number | number[] };                                        // only in these rounds of its section (1.3)

// On a choice of one
prefill?: { from: 'lessons-today'; pick: { atLeast: number; option: string }[] };   // 1.6

// On a text
carry?: { to: string; prompt: string; label: string };   // 1.7

// A new kind of prompt (1.5)
| { kind: 'dots'; ask: string; hint?: string; rows: { of: string; label: string; round?: number }[]; showIf?: ShowIf }
```

### 1.1 The same question asked again

Phase 5 refused two prompts with the same id in one journal. Now the same id may appear on several pages of a journal: it means **the same question, asked again**, and its answers form one series. The Habit journal asks `h-did` on the daily page and again on the seventh page; it asks for the plan (`h-plan`) in the set-up and again when the plan changes. A recall finds the latest (or first) answer whichever page it was on, and the dots read them all.

The check still refuses the same id twice **on one page**, and the same id on two pages with a different kind of answer: another `kind`; for a choice, other `options` or `many`; for a scale, other `from` or `to`; for a list, another `count`; for a fill, another number of blanks. The words of `ask` and `hint` may differ. Older apps need nothing: they already read answers by page.

### 1.2 Hints on choice, scale and yes or no

Drawn exactly as on a text: under the question, in `meta`, `text.secondary`. Older apps ignore them.

### 1.3 Show by week: `showIf: { round: 3 }` or `{ round: [1, 10] }`

The prompt shows only in those rounds of its own section: for a page being written, the round of its step; for a page written before, the round it was written in. Rounds count from 1. This is how the Habit journal says the right thing in week 3 and in week 10.

The check refuses: a `showIf` with both `round` and `prompt`; `round` in a section that does not repeat; a round below 1. An older app cannot read a `showIf` without `prompt`, so it **leaves the whole prompt out**. That is wanted (a week-3 note must never show every week), so never give such a prompt a `prompt` condition as well. A prompt that depends on one of them (`showIf: { prompt: h-ten }`) then never shows in an older app either, because nothing answers it.

`isVisible` takes the round as well (keep its meaning for the rest).

### 1.4 Weeks: `numbering: weeks`

Only on a section whose round is exactly **seven** steps (pages times their `times`); the check refuses it elsewhere. Its places are numbered **"Week 3 · Day 5"**: the week is the round, the day the step's place in the round. Wherever Phase 5 writes "Page 6 of 28" or "Keep going · 4": the writing page's meta, the shelf row, the Journal tab's card ("Habit · Week 3 · Day 5 · 1 min"), Today's card (running on in lower case: "Habit · week 3 · day 5 · 1 min"), the journal's own page. On the journal's page, the progress line has those words and its bar shows the days done in that week (4 of 7 when day 5 comes next). The numbered total ("of 3") counts only the sections before the pool that have no `numbering`. Older apps show their pool words ("Day by day · 12"), which is fine.

### 1.5 `dots`: the week as rows of dots

**What it shows.** One row per entry of `rows` (1 to 8). A row has one cell per step of one round of the dots' own section, in order: the round of the page on screen, or the row's own `round`. A cell holds the answer to the row's prompt (`of`) on the page written at that step, in the same cycle as the page on screen (1.8). For the page on screen, its answers as they are on screen right now, pre-filled ones included (1.6). No page at that step, a skipped page, or the question left empty: no answer.

**How it looks.** The `ask` in `title`, the `hint` under it in `meta`. Then the rows, one under the other, each at least 32 high: the `label` on the left in `meta`, `text.secondary`, in a column as wide as the longest label of this prompt; then the cells, evenly spaced; then, for a yes or no row only, its count on the right in `meta` ("5 of 7": the Yes answers, of the round's steps).
- A cell is a circle centred in a square of at least 24.
- **No answer**: a hairline ring in `border.strong`.
- **Yes**: a full dot in the area colour `write`. **No**: a small dot, about a third of the square, in `text.muted`.
- **A scale, or a choice of one**: a dot in the area colour whose size grows with the answer, in equal steps, from about 35 % of the square for the lowest answer to the whole square for the highest. A choice's options are steps in their order, the first smallest.
- The cell of the page on screen is marked quietly (a short line under it, for example), so the person sees where today sits.
- Only the area colour and the text colours; both themes; nothing moves beyond the screen's usual arrival, and reduce motion is respected. At the phone's text size 1.3 the labels wrap; the cells never leave the screen.
- A screen reader reads each row as one sentence: "Energy: 3 of 5, 4 of 5, no answer, 2 of 5, 5 of 5, 4 of 5, 4 of 5." or "Did it: yes, yes, no, yes, no answer, yes, yes. 5 of 7."

The dots answer nothing and are not exported. A page of only notes, recalls and dots has nothing to answer (`nothingToAnswer`).

**The check refuses**: dots in a section whose round has more than seven steps; a row whose `of` is not a prompt of the same section, or is not a yes or no, a scale or a choice of one; a `label` over 16 characters; a row `round` in a section that does not repeat, or beyond its `repeat`. Older apps leave the dots out.

A pure function, tests first (the name is a suggestion): `dotsOf(journal, entries, at, rows, onScreen)` → for each row, its values or `undefined`, one per step.

### 1.6 `prefill`: a choice filled in from today's lessons

```yaml
prefill:
  from: lessons-today         # the minutes of today's lessons marked done (the record of the day, "move")
  pick:                       # the highest rule reached wins
    - { atLeast: 1, option: A little }
    - { atLeast: 20, option: 20 minutes or more }
```

When a page **written today, or being written today,** shows the choice with no answer, and today's lessons add up to at least one `atLeast`, that option shows chosen, with a line under the chips in `meta`: "From your practice today: 25 min" (the line shows that day whenever the chosen option is the suggested one). It is a suggestion until the page is kept: it is saved with the page's first answer, or by "Done". If the person taps it away, or picks another option, it is never suggested again on that page. It never replaces an answer, and a page read on a later day shows none. On its own it does not make a page written: the person still has to answer something or press Done.

The check refuses: a `from` other than `lessons-today`; an `option` that is not one of the choice's options; an `atLeast` that is not a whole number from 1 to 600; a `prefill` on a choice with `many`. Older apps show a plain choice. This is the first case of the V2 rule "what is done in one area is known in the others without asking"; Phases 7 and 8 may add other `from`.

### 1.7 `carry`: an answer handed to another journal

```yaml
carry: { to: habit, prompt: h-want, label: Make it a habit }
```

Under the text field, once it holds text, a quiet button with the `label` and a small arrow, like `share`. It shows only when the journal named by `to` is **free**: nothing written (skips do not count) in its current cycle (1.8), which includes a journal never started. It never shows while a habit is under way: one habit at a time.

Pressing it keeps the text in memory for that journal's prompt, then opens the journal's "About this journal" if it was never begun (its "Begin" then opens page 1), or its page 1 otherwise. When page 1 opens and that prompt is empty, the text is written into it as if typed, and forgotten. The person can change it. If they leave before page 1, the text is dropped when the app closes; nothing else happens.

The check refuses (it needs every journal, so check after reading them all): a `to` that is not another journal in `content/guided-journals/`; a `prompt` that is not a `text` prompt on the first page of that journal's first section; a `label` over 30 characters. In the app, a `to` missing from the content (taken down, or a draft in the public app) hides the button. Older apps ignore `carry`.

### 1.8 `again`: starting a journal again

```yaml
again: Start a new habit
```

On the journal's own page, a row with these words sits under "About this journal", once a page has been written (not skipped) in the journal's current cycle. Pressing it opens a confirmation in place, never a system pop-up: one sentence, "Start again from the first page? Everything you wrote stays here.", then "Start again" (ghost) and "Not now" (quiet). Confirming starts the journal again: its next page is its first page, and Today, the shelf, the page numbers, "one new page a day", recalls and dots look only at the pages written since. Pages written before stay in "Your pages" (section 2), stay readable and editable, and keep their own recalls and dots: each reads the start it was written in. Export includes everything, as before.

**Kept on the phone**: every guided page gets `cycle` (a whole number from 1; absent means 1), set when the page is first written. The current cycle of each journal started again lives under `ywm:journal:v1:cycles` (for example `{ "habit": 2 }`), so "Delete my data" erases it with the rest. Filter by cycle in one place, before the rules of `src/journal/guided.ts` see the pages, rather than in every function. Sample progress keeps its own cycles in memory, like its pages. Older apps ignore `cycle` (only someone going back to an older app would see the furthest page instead; harmless).

## 2. Small changes to the screens

- **The Journal tab** now holds three journals and the free pages: nothing else changes (V2, limit 2).
- **A journal's page, "Your pages"**: the 21 newest, then a quiet "Show all 73 pages" that shows the rest in place. Pages written before the latest "start again" come after the others, under a small quiet heading "Earlier".
- **The writing page**: hints (1.2), round conditions (1.3), week numbers (1.4), dots (1.5), the pre-filled line (1.6) and the carry button (1.7). In the preview app and on the web only, `&round=<n>` next to `&page=<id>` opens a page as if in that round, to check how week 3 and week 10 look.
- **Words** go in `src/strings.ts`: "Week 3 · Day 5", "5 of 7", "From your practice today: 25 min", "Show all 73 pages", "Earlier", the sentence and the two buttons of 1.8. The rest comes from the content.

## 3. Copy the two journals

**Copy `docs/phases/phase-6/habit-journal.yaml` to `content/guided-journals/habit/journal.yaml` and `docs/phases/phase-6/health-journal.yaml` to `content/guided-journals/health/journal.yaml`, unchanged.** As in Phase 5, this is the one exception to "`content/` is never touched during a phase". If the check refuses something in them, fix the smallest thing and say what in the pull request. Read both files whole before building: their comments say which ids repeat on purpose.

What they hold, so you can picture them:
- **Habit** (aura `dawn`, order 2): a set-up section of three `together` pages, then the section "Day by day", `repeat: forever`, `numbering: weeks`: the page "Did it happen?" (`times: 6`) and "Looking back on the week". The week's page repeats the day's questions, shows the week's dots, a note for weeks 1, 3, 6 and 10, at week 10 a comparison with week 1 and "Does it run by itself now?", then "What helped?" and "Keep my plan / Change my plan".
- **Health** (aura `moss`, order 3): one section, "Day by day", `repeat: forever`, `numbering: weeks`: "How was today?" (`times: 6`) and "Looking back on the week", with six rows of dots, "What do you notice?", "One small change for next week" (carried to Habit as "Make it a habit") and, at the end, "A notebook, not a diagnosis. If you have felt low for two weeks or more, talk to a doctor."

## 4. The privacy page

In `docs/legal/privacy-policy.md` (a `protected:` commit with these words from the architect), then `npm run legal`. In "Your journal", the sentence "The app does not count or analyse what you write." becomes:

> The weekly look-backs in the Habit and Health journals are worked out on this phone, for you alone: nothing you write is counted or analysed anywhere else. The Health journal never asks about weight, calories or body measurements.

Set `updated:` to the day of your commit.

## 5. Sample progress and the gallery

- **Sample progress** (`?demo=streak` and the gallery's switch), in memory only, now also holds: **Habit** set up 17 days ago, then 14 pages (two full weeks, 11 Yes and 3 No, with automatic-feeling answers rising), the latest yesterday, so its next page is "Week 3 · Day 1"; **Health** begun 9 days ago, with 8 pages (a full first week with its look back, one missed day, then one page), the latest yesterday, so its next page is "Week 2 · Day 2"; and one lesson of 25 minutes marked done today, so the pre-filled line shows. Gratitude and the free pages stay as they are.
- **The gallery**: one `dots` prompt with a yes or no row, a scale row and a choice row, and one pre-filled choice with its line.

## Check before the pull request

`npm run check`, with the new tests. Pictures at 390 × 844 in `docs/screens/phase-6/`, both themes unless said: `/journal` with `?demo=streak`; the Habit journal's page with `?demo=streak` (the "Start a new habit" row) and its confirmation (dark only); About this journal for both (dark only); the three set-up pages; "Did it happen?" after Yes and after No; the Habit week page with `?demo=streak` in rounds 1, 3 and 10; "How was today?" with the pre-filled line; the Health week page with `?demo=streak`, with text typed in "One small change" so "Make it a habit" shows; the gallery's new parts; `/` with the Write card. Look at each one, at the phone's text size 1.3 too for the dots.

## Watch out for

The cases most likely to go wrong for a real person. Each deserves a test.
1. **A week that is not quite a week.** Missed days, a skipped page, a question left empty, a page begun before midnight and finished after, the page on screen, a week page reread a month later: the dots show only what was written, in the right cells, and a count never goes above 7.
2. **Starting again.** On the same day as a week page; twice; then reading a page of the first habit (its dots and its recall read that habit, not the new one); "one new page a day" after a start again (the three set-up pages are open at once); Delete my data; sample progress shown, then hidden.
3. **Pre-filled answers.** No lesson, 10 minutes, 25 minutes; a lesson marked done while the page is open; the person taps the suggestion away (it stays away); a page from yesterday (no suggestion); a page with an answer (never replaced).
4. **Carry.** Habit never started, started again with nothing written, under way (no button), missing from the content (no button); "About this journal" left without "Begin".
5. **An older app meeting this content.** For a while after merging, the Phase 5 app on the owner's phone reads the new journals before its update arrives. Take Phase 5's `guidedPrompt` and `guidedJournal` from git (`git show 54020ad:shared/content-schema.ts`) into a test fixture and prove that, with both new files, they keep both journals readable, leave out every `dots` and every `showIf: { round }` prompt, and keep everything else.

## Not in this phase

Reminders (Phase 10, one nudge for the whole practice). Anything longer than a week on screen (a month, a year, a chart). Averages, scores, a "best week", a streak of writing. Weight, calories, body measurements, cycle tracking, a diagnosis. Connecting to Health Connect, Google Fit or a watch. Sharing health answers with anyone. Search, a lock for the app. A habit's own reminder.

## In the pull request

"Does this need a new build?": **No. Do not run "Android build" after merging.** Give the fingerprint check (section 0).

"To test on your phone":
1. After merging, open the **Actions** tab on GitHub and wait until "Preview update" has a green tick.
2. Close the app fully (swipe it away from the recent apps), open it, wait ten seconds, close it fully again, open it again.
3. **You → About**: the second grey line reads "Update of" today's date. If it does not, stop and tell me.
4. **Journal**: Gratitude, Habit and Health are on the shelf. **Habit** → Begin → read the three cards → Begin → write the three set-up pages one after the other. The first daily page opens tomorrow.
5. **Health** → Begin → Begin → write today's check-in. If you marked a lesson done today, "How much did you move today?" is already chosen.
6. **To see a week's dots now**: You → Design gallery → Show sample progress → Journal → Health → under "Your pages", "Looking back on the week". Then turn sample progress off again.
7. Give the owner two web preview links (with `?demo=streak`) that open the Habit week page in round 10 and the Health week page, to look at on the phone's browser.
