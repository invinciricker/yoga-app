# Phase 3: "My practice"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md` and, in `docs/DESIGN.md`, "After practice", "Today", "Series" and "My practice". Phase 2 must be merged. Everything in this phase stays on the phone: no network, no Supabase.

## In one paragraph

People can now mark a lesson as done, answer "How did that feel?" in one tap, save lessons for later, and see their week as a row of candles that light up. This is what brings someone back tomorrow. The answer to "How did that feel?" is stored on the phone in this phase; Phase 4 sends it to Maria.

## 1. The logic (`src/practice/`), pure and tested first

One store (`zustand`, saved under `ywm:practice:v1`), shaped like this and nothing more:

```ts
type Practice = {
  done: { slug: string; day: string; at: string; minutes: number }[]; // one entry each time a lesson is finished; day = local 'YYYY-MM-DD'
  saved: string[];                                                    // lesson slugs, newest first
  reactions: Record<string, { difficulty: 'gentle' | 'right' | 'much'; feeling?: 'calmer' | 'energised' | 'stronger' | 'tired'; at: string; sent: boolean }>; // by lesson slug; the latest answer replaces the old one
};
```

Pure functions, each with tests (write the tests first):
- `localDay(date)` → `'YYYY-MM-DD'` in the phone's time zone. Test around midnight and across a daylight-saving change.
- `streak(done, today)` → the number of days in a row ending today, **or ending yesterday** if nothing is done yet today (the candle is still burning until midnight). 0 otherwise.
- `longestStreak(done)`, `week(done, today)` → the seven days Monday to Sunday of the current week, each `lit`, `today` or `empty` (as in the mockup), `totals(done)` → lessons done (count of entries), minutes, distinct days.
- `isDone(done, slug)`, `seriesProgress(done, lessonSlugs)` → `{ doneCount, total, next }` where `next` is the first lesson of the series not yet done.
- The same lesson done twice in a day counts once for the streak and twice for the totals.
- Slugs that no longer exist in the content are kept in storage and ignored by the screens.

## 2. Finishing a lesson

- **Lesson page**: the fixed bar now has "Mark as done" under "Begin practice" (or alone, as a `ghost` button, when there is no video). A lesson already done shows a quiet line above the bar, "Done on 16 November", and the button reads "Done again".
- When the video reaches its end, the app offers the same step by itself: the After practice screen opens.
- **After practice** (`app/lesson/[slug]/done.tsx`, a full-screen modal): exactly the mockup. The entry in `done` is written when this screen opens, so leaving it in any way still counts. The overline shows the new streak ("1 day", "4 days in a row"); the italic line uses the lesson's minutes written as a word up to twelve ("Twelve quiet minutes, just for you."), as a number above. Choosing one of the three answers stores the reaction at once, gives a light haptic, and reveals the feeling chips; a chip can be chosen, changed, or left alone. "Done" closes back to the lesson. No answer is fine.
- A success haptic when the screen opens.

## 3. Saving

- The glass bookmark on the lesson cover and on the Today hero toggles `saved` (filled gold when saved, light haptic, label "Save lesson" / "Remove from saved").
- Practice gains the "Saved" chip, second in the row. With nothing saved it shows an empty state that explains the bookmark in one sentence.
- Lesson rows show the gold bookmark when saved and the sage tick when done (the tick wins when both).

## 4. Where the progress shows

- **Today**: the week card from the mockup, between the greeting and the hero. With no lesson ever done, it reads "Light your first candle" in place of the streak, and all seven are empty except today's ring. A new block between the hero and "New from Maria", only when a series is started and not finished: overline "Continue", the series title, "Lesson 3 of 7", and the next lesson as a row.
- **Series cards and the Series page**: the progress bar and "2 of 7 done", ticks on done lessons, and the ghost "Continue" button.
- **My practice**: the three numbers (lessons done, minutes, longest streak), the week card, "Saved" and "History" rows leading to two list pages (`app/me/saved.tsx`, `app/me/history.tsx`; history is grouped by day, newest first, "Today", "Yesterday", then dates). In Settings, a new row **"Delete my data"**: explains in two sentences what will be erased (progress, saved lessons, answers; on this phone only for now), asks once more with a destructive button, then clears `ywm:practice:v1` and returns to Today.

## Check before the pull request

`npm run check`. Shots of `/`, `/practice`, `/lesson/evening-wind-down`, `/lesson/evening-wind-down/done`, `/series/seven-evenings-of-rest`, `/me`, `/me/history`, each in two states: a fresh install, and a store pre-filled with four days in a row (add a `?demo=streak` switch that works **in the preview variant only** and fills the store with sample progress; the owner will use it too).

## Not in this phase

Sending anything anywhere. Reminders and notifications. Badges, levels, points or any other game: the candles are the only reward, on purpose.

## In the pull request

"To test on your phone": open a lesson, tap "Mark as done", answer, tap Done; look at Today (one candle lit); save a lesson and find it under Practice → Saved; open My practice; then Delete my data and check that everything is back to zero. No new build needed unless you added a native library (you should not have).
