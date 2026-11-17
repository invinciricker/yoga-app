# Phase 4: "My practice"

Written by Claude chat, 17 Nov 2026 (evening). For Claude Code. Read `CLAUDE.md` (with "How much freedom you have"), `docs/V2.md` ("One day, four small things" and "Limits that keep it calm" above all), and in `docs/DESIGN.md` "Today", "Practice", "Lesson", "After practice", "Series" and "My practice". The drawn targets are the "Today", "Practice", "Lesson" and "After practice" screens of `docs/design/mockups.jpg`. Phase 3 must be merged. Everything in this phase stays on the phone: no network, no Supabase.

## In one paragraph

People can now mark a lesson done, say in one tap how it felt, save lessons for later, and watch their week fill with candles. This is what brings someone back tomorrow. It is also the first piece of the shared record of the day that Breathe, Meditate and Journal will write into later: a candle is lit when anything is done that day. And this phase reaches the phone **as an over-the-air update, without a new build**: that is the proof that updates work.

## 0. This phase must arrive over the air

- Add no native library, change nothing in `app.config.ts`, and add or change no script in `package.json` (the scripts are part of the build's fingerprint: `docs/TECH.md`). If something truly needs a new build, say it at the top of the pull request.
- Do not take Expo updates in this phase, even if some exist: leave them for the next phase that needs a new build, and say so under "Choices made".

## 1. The record of the day (`src/day/`)

One list, kept under `ywm:days:v1` and read with the other saved things before the splash goes (so Today's week never pops in):

```ts
/** One thing done on one local day. On the phone only, never sent. */
export type DayKind = 'move' | 'breathe' | 'sit' | 'write';
export type DayEntry = {
  day: string;     // the phone's calendar day, 'YYYY-MM-DD' (dayOf in src/content/selectors.ts)
  kind: DayKind;   // only 'move' exists in this phase
  ref: string;     // what it was: for 'move', the lesson's slug
  minutes: number; // whole minutes, at least 1
  at: string;      // when it was recorded (ISO time)
};
```

A small store (zustand, as `src/content/store.ts` does) with `entries`, `add(entry)` and `clear()`. Pure functions next to it, **tests written first** (`today` is always the day as text, from `dayOf(new Date())`):
- `streak(entries, today)` → the number of days in a row that have at least one entry, ending today, **or ending yesterday** when nothing is recorded yet today (the candle burns until midnight). 0 otherwise.
- `longestStreak(entries)`.
- `week(entries, today)` → the seven days Monday to Sunday of the current week: `{ day, letter, lit, isToday, isFuture }`.
- `totals(entries)` → `{ days, minutes, lessons }`: distinct days, all minutes added up, `move` entries counted.
- `nextStep(justDone, entries, today, built)` → the one hand-off a closing screen may offer, or nothing. The order is move → breathe → sit → write; it offers the first kind after the one just done that is built (`built` comes from `areas` in `src/config.ts`) and not yet done today; nothing after write. In this phase nothing else is built, so it always answers nothing; its tests use other `built` maps. The words, for later: breathe "Three minutes of breath?", sit "Sit for five?", write "Write a line about it?".
- The same lesson done twice in one day lights one candle, and counts twice in `lessons` and in `minutes`.
- Days are compared as `'YYYY-MM-DD'` text, never through UTC (`docs/ARCHITECTURE.md`, "Conventions").

## 2. Saved lessons and answers (`src/practice/`)

Kept under `ywm:practice:v1`, read before the splash goes:

```ts
export type Difficulty = 'gentle' | 'right' | 'much';
export type Feeling = 'calmer' | 'energised' | 'stronger' | 'tired';
export type Reaction = { difficulty: Difficulty; feeling?: Feeling; at: string; sent: boolean };
export type Practice = {
  saved: string[];                     // lesson slugs, the most recently saved first
  reactions: Record<string, Reaction>; // by lesson slug; a new answer replaces the old one
};
```

These words are the same as in the database (`supabase/migrations/20261116000000_init.sql`), because Phase 9 sends the reactions as they are; `sent` stays `false` until then.

Pure functions, tests first: `isDone(entries, slug)`, `lastDone(entries, slug)` → the latest day, and `seriesProgress(entries, lessonSlugs)` → `{ done, total, next }`, where `next` is the first lesson of the series, in order, not yet done. It replaces the stub of the same name in `src/content/selectors.ts`, which always answers 0. Slugs that are no longer in the content stay in storage: they keep lighting candles and counting in the totals, and every list simply skips them.

## 3. Finishing a lesson

- **The lesson page.** The bar at the bottom now holds "Begin practice" (gold) with "Mark as done" (quiet) under it; without a video, "Mark as done" alone, as a ghost button. A lesson already done shows a quiet line above the bar ("Done today", "Done yesterday" or "Done on 16 November") and its button reads "Done again".
- **When the video reaches its end**, the closing screen opens by itself (`VideoPlayer` gains an `onEnd`; the web twin may do without).
- **The closing screen** (a full-screen modal over the lesson, such as `/lesson/<slug>/done`; how is yours). Exactly the "After practice" mockup, always dark (`ThemeScope`, as every closing screen in `docs/V2.md`), its overline and small icons in `area.move`:
  - The entry in the record of the day is written **when this screen opens**, once per opening, so leaving it in any way still counts. Nothing is written for a lesson that does not exist. A success vibration when it opens (add `success()` next to `tick()` in `src/lib/haptics.ts`).
  - Overline with a flame: the streak, counting today ("1 day", "4 days in a row").
  - "Well done." in `display`. Under it, in italic: "Twelve quiet minutes, just for you." The minutes are written as a word from one to twelve ("One quiet minute, just for you."), as a number above twelve.
  - "How did that feel?" and the three answers as large choices: "Too gentle" / "I could have done more"; "Just right" / "A good match for today"; "Too much" / "I had to stop or skip parts". Choosing one stores it at once, gives a light tick, marks it chosen (gold hairline and a check), and reveals "And now you feel… (optional)" with four chips: Calmer, Energised, Stronger, Tired. One chip at most; a second tap clears it. Changing the answer replaces it.
  - Under them, small: "Your answer stays on your phone." (Phase 9 changes this line when the answers start reaching Maria.)
  - The one hand-off from `nextStep`, as a quiet button, only when there is one (in this phase there never is).
  - "Done" (gold) closes back to the lesson. Closing without an answer is fine and stores no answer.

## 4. Saving

- A glass bookmark at the top right of the lesson's cover and of Today's big card: it saves or unsaves, filled `accent.gold` when saved, with a light tick. Labels: "Save lesson" / "Remove from saved".
- Lesson rows show the gold bookmark when saved and the sage tick when done (the tick wins when both).
- **Practice**: `docs/V2.md` says no search and no filter on a list of fewer than 8 items, and today's Practice shows both with three lessons. From now on the search field and the filter row appear only when there are 8 lessons or more; the same goes for the chips on Notes (`/notes`), counted in notes. In Practice's row, "Saved" comes second (after All), and shows only when something is saved. Its empty state says: "Tap the bookmark on a lesson to keep it here." With fewer than 8 lessons, saved lessons are found in You → Saved.

## 5. Where the practice shows

- **Today: the week.** The week card of the mockup, between the greeting and the big card: a flame and the streak on the left ("4 days in a row"), "This week" on the right, then the seven days with their letters. A lit day is a small gold candle with its glow; an empty day a hairline ring; today has a ring around it, lit or not; days still to come are quieter. When nothing has ever been done: "Light your first candle". When something has been done before but the streak is 0: "Light today's candle". Make it one part, `WeekCard`, used here and in You, and shown in the gallery.
- **Today: the big card** follows one rule (`docs/V2.md`: one suggestion per area, never a list). It is, in this order: the next lesson of a series that is started, not finished, and was practised in the last 7 days; else the featured lesson; else the newest. When it continues a series, its overline says so ("Seven evenings of rest · 3 of 7"). When it is done today it shows the sage tick and "Done today", and stays where it is. A pure function decides, with tests (`todayMove(content, entries, now)`, in `src/day/`). There is no separate "Continue" block on Today.
- **Series.** A started series shows a thin progress line and "2 of 7 done" on its card and on its page; the page also ticks the done lessons and offers a ghost "Continue" button under the description, which opens the next lesson. A finished series says "All 7 done." instead.
- **You.** Between the title and the settings: the three numbers in a row (`h1` numerals over a `meta` word): days, minutes, longest run. Under them the `WeekCard`. Then two `SettingsRow`s: "Saved" (with the count) → `/me/saved`, and "History" → `/me/history`. Before anything has been done, all of that is replaced by one quiet line: "Your practice will gather here, a candle a day." The settings follow as in Phase 3, then, last, a `SettingsRow` "Delete my data" in `support.danger`.
- **Saved** (`app/me/saved.tsx`): the saved lessons as rows, the most recently saved first. Empty: the sentence above.
- **History** (`app/me/history.tsx`): what was done, grouped by day, newest first ("Today", "Yesterday", then "16 November"), each line the lesson's row with its minutes.
- **Delete my data** (`app/me/delete.tsx`, a page of its own, not a system pop-up): "This erases your candles, the lessons you finished and saved, and your answers, from this phone. Your settings stay." A destructive button "Delete" and a quiet "Keep". Deleting clears `ywm:days:v1` and `ywm:practice:v1` (nothing else), gives a light tick and returns to Home; every screen shows the empty state at once, without a restart.

## 6. Sample progress, for checking

In the preview app and on the web only: `?demo=streak` in the address, and a switch "Show sample progress" in the design gallery, fill both stores **in memory only, never saved**, until the app closes: four days in a row ending today, two lessons of the series done, one lesson saved, one answer. The shots use it; so will I.

## Check before the pull request

`npm run check`, with the new tests. Pictures at 390 × 844 in `docs/screens/phase-4/`, each in both themes and in two states (a fresh install, and `?demo=streak`): `/`, `/practice`, a lesson, its closing screen (dark only), a series, `/me`, `/me/saved`, `/me/history`, `/me/delete`. Look at each one next to the mockups.

## Watch out for

The cases most likely to go wrong for a real person. Each deserves a test.
1. Midnight: a lesson finished at 23:58 whose closing screen opens at 00:01 counts for the new day. `streak` across the end of a month and across a change of summer time.
2. The same lesson done twice in a day: one candle, two lessons, both sets of minutes.
3. A lesson removed from the content after it was done or saved: its candles stay, the totals keep it, lists skip it, nothing breaks.
4. The phone refusing to save (storage full): the screen carries on and the session keeps what was done.
5. The closing screen opened, left, and opened again (or the web page reloaded): one entry per opening, never one per drawing.

## Not in this phase

Sending anything anywhere (Phase 9). Reminders and notifications (Phase 10). Badges, levels, points, or anything else game-like: the candles are the only reward, on purpose. Anything in Breathe, Meditate or Journal.

## In the pull request

"Does this need a new build?": **no**, it arrives over the air (say yes loudly if that turned out to be impossible). "To test on your phone": after merging, wait until "Preview update" has a green tick on GitHub (Actions tab). Close the app fully, open it, close it, open it again. You → About: the version line now reads "Update of" today's date and time; if it still says "The code that came with this build", stop and tell me. Then: open a lesson, "Mark as done", answer, Done; Today shows one candle; save a lesson and find it under You → Saved; open History; Delete my data, and everything is back to empty.
