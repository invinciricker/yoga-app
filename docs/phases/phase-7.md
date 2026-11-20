# Phase 7: "Breathe"

Written by Claude chat, 20 Nov 2026. For Claude Code. Read `CLAUDE.md`, `docs/V2.md` (above all "Limits that keep it calm" and "The room dims"), the motion rules in `docs/DESIGN.md`, `docs/CONTENT.md`, and the five exercises in `docs/phases/phase-7/breath/`. Phase 6 must be merged.

## In one paragraph

The Breathe tab opens. Five slow-breathing exercises (four for everyone, "Alternate nostril" as a draft until Maria approves it), each with its own page: how to do it, a length of 1, 3 or 5 minutes, and "Why this works" one tap away. One player for all of them: always dark, the `tide` aura whose disc swells on the breath in and settles on the breath out, one word, a count, a light tick in the hand at each change so it works with eyes closed, and soft tones if the person wants them. A session of a minute or more lights the day's candle. Today gets its Breathe card, chosen by the time of day, and the lesson's closing screen offers "Three minutes of breath?". This phase **needs a new build** (sound), so it starts with Expo's updates.

## 0. A new build, done properly

1. First commit: `npx expo install --check`. If newer releases of SDK 58 exist, `npx expo install --fix` (`deps: …`), `npx expo-doctor`, the checks, and the versions in `docs/TECH.md`. If SDK 59 exists, say so in the pull request and do not take it.
2. `npx expo install expo-audio`. Add its config plugin to `app.config.ts` **with the microphone off**: `['expo-audio', { microphonePermission: false, recordAudioAndroid: false }]`. Its plugin adds Android's `RECORD_AUDIO` permission unless told not to, and this app never records. No background playback. Prove it: build the Android project in a throwaway copy (`npx expo prebuild --platform android --no-install`, never committed) and check that its merged manifest has no `RECORD_AUDIO`. Say what you found in the pull request. Read the current expo-audio page for SDK 58 for the exact option names before writing them.
3. `expo-haptics` and `expo-keep-awake` are already in the project. Add no other native library.
4. `version` in `app.config.ts` becomes `0.2.0`, so You → About tells the owner which build he has.

## 1. Breathing exercises are content

One file per exercise, `content/breath/<slug>/breath.yaml`; the folder name is its slug, permanent once published (the record of the day keeps it). They become `breath` in `content.json`, by `order`: optional, so files built before still pass, and read leniently like `guidedJournals`, so an exercise this version cannot read is left out without stopping the rest. Add the format to `shared/content-schema.ts` and `docs/CONTENT.md` in a `protected:` commit, and the check and build in `tools/content/` (a `breath.ts` next to `journals.ts`).

```ts
{
  title: string;      // 1 to 40
  summary: string;    // 1 to 80: the line on cards and rows ("In for four, out for six.")
  goodFor: string;    // 1 to 40 ("Settling, in the evening")
  order: number;
  suggest?: ('morning' | 'afternoon' | 'evening')[];   // offered at that time of day (section 2)
  draft?: boolean;
  steps: {            // 2 to 8, one round of the exercise, repeated
    do: 'in' | 'hold' | 'out';
    seconds: number;  // a whole number from 1 to 12; a hold 8 at most
    via?: 'nose' | 'mouth';
    side?: 'left' | 'right';   // only through the nose
    label?: string;   // 1 to 16: replaces the word ("Top up")
  }[];
  how: string;        // Markdown, 1 to 1200 → blocks, as in a journal's intro
  why: {
    level: 'strong' | 'promising' | 'early' | 'traditional';
    text: string;     // Markdown, 1 to 1500 → blocks
    sources: string[]; // 1 to 6, each 400 at most
  };
}
```

**The check refuses**, one plain sentence each: a round shorter than 6 seconds (more than ten breaths a minute: "No fast breathing", V2); a step that is not a whole number of seconds from 1 to 12; a hold over 8 seconds; fewer than 2 or more than 8 steps; a round with no `in` or no `out`; a `side` through the mouth; a `label` over 16 characters; an unknown `level` or time of day; more than **6** exercises without `draft` (V2, limit 2).

**In the app**, an exercise whose steps it cannot read entirely (a `do` it does not know, for example) is left out whole: a pacer must never skip a step. Unknown fields are ignored. Older apps ignore `breath` (the content file's reader drops keys it does not know): prove it with the Phase 5 schema fixture of `tools/content/olderApp.test.ts` reading the new `content.json`.

**Copy the five files unchanged**: `docs/phases/phase-7/breath/<slug>.yaml` → `content/breath/<slug>/breath.yaml`. As in Phases 5 and 6, this is the one exception to "`content/` is never touched during a phase". "Alternate nostril" stays `draft: true` until Maria approves it. If the check refuses something in them, fix the smallest thing and say what in the pull request.

## 2. The Breathe tab

`areas.breathe` becomes `true`. In the phone's theme, from the top (V2, limit 1):
- **The title**, "Breathe".
- **The one suggestion**: a cover card in the `tide` aura. Overline "For this morning", "For this afternoon" or "For this evening" (`partOfDay` in `src/lib/greeting.ts`), the exercise's title and summary, and **Begin · 3 min** (gold), which opens the player for 3 minutes. Which exercise: `breatheNow(exercises, date)`, a pure function, tests first: the first exercise by `order` whose `suggest` holds the part of the day, else the first by `order`. Drafts only in the preview app, as everywhere. Once anything was breathed today (a `breathe` entry in the record of the day): the sage tick and "Done today", and the card opens the exercise's page instead.
- **The shelf**: every exercise by `order`, one row each: a small `tide` disc, the title, the round in short ("In 4 · Out 6", "In 2 · Top up 1 · Out 6"), opening its page. The draft chip on drafts.

Nothing else on the tab: no filter, no search (fewer than 8 items). If the content holds no exercise the app may show (none published, in the public app), the tab and Today's Breathe card are hidden, as for any empty area (V2, limit 4).

## 3. An exercise's page, `/breathe/<slug>`

In the phone's theme: a cover in the `tide` aura with the title, then:
- the overline "Breathe" and `goodFor`;
- the round in words, one line per step: "In · 4 seconds · through the nose";
- `how`;
- **the length**: three chips, 1 min, 3 min, 5 min. 3 at first; then the last one chosen, remembered for every exercise;
- **Begin** (gold), to the player;
- two switches: **Sound** (off at first) and **Vibration** (on at first), remembered for every exercise;
- a row **Why this works**, opening a page (or a sheet) with the level in plain words and what it means, `why.text`, and the sources. The levels: *Strong evidence*, "Many good studies agree."; *Promising evidence*, "Some good studies. More are needed."; *Early evidence*, "Only a little research so far."; *A traditional practice*, "From a tradition, with little research of its own."
- at the bottom, in `meta`: "Breathe gently and never strain. If you feel dizzy or uneasy, stop and breathe normally."

Settings are kept under `ywm:breathe:v1` and treated like the app's other settings.

## 4. The player, `/breathe/<slug>/play?minutes=3`

Always dark (`ThemeScope scheme="dark"`), the whole screen, no tab bar.
1. **Settle in**, about 5 seconds: the title, the round in short and the safety sentence. A bell if Sound is on. Then the first step.
2. **The pacer**: the `tide` aura fills the screen. Its disc and halo grow during the steps in and shrink during the steps out, and stay still during holds. The size follows the air in the lungs: from about 45 % to 100 % of its largest size, each step in adding its share of the breath (the sigh's two steps in make one breath: two thirds, then the last third), the steps out taking it back. Every change eases in and out, never at a constant speed. With reduce motion: the disc stays still; only the word and the count change, with fades of 120 ms. This is the app's second looping animation (`docs/DESIGN.md` names the candlelight as the only one): V2 asks for it, and it is the player's whole purpose.
3. **The word**, large, near the disc: "In", "Hold", "Out", or the step's `label`. Under it, smaller: "through the nose", "through the mouth", "left side", "right side". **The count**: the seconds of the step counting up, 1, 2, 3, 4, in `meta`.
4. **Ticks in the hand** (Vibration on): a light tick at the start of every step, and a firmer one at the start of every breath in, so the start of each breath can be felt with eyes closed.
5. **Sound** (on): a soft tone at the start of every step in (the higher one) and every step out (the lower one), nothing on holds; the bell at the start and at the end. It mixes with the person's own music, follows the media volume, and never plays once the player is left. A speaker button in the player turns Sound on and off (the same setting).
6. **Time**: one clock for the whole session, never a chain of timers that drifts. The time chosen is rounded up to whole rounds: the session ends at the end of the round in which the time runs out, never in the middle of a breath. A thin line along the bottom shows how much is left; no numbers counting down.
7. **Pause and stop**: a tap on the screen, or the pause button, pauses: the disc rests, the word becomes "Paused", with "Go on" and "Stop". Leaving the app (a call, the home button, the screen going off) pauses too. The screen is kept awake during a session only.
8. **The end**: the bell, a success tick, then the closing screen.

A screen reader hears the word at each change (a polite live region); every button has a label ("Pause", "Sound off").

## 5. The closing screen and the record of the day

- A session that reaches its end, or is stopped after at least one full minute, writes once to the record of the day: `{ kind: 'breathe', ref: <slug>, minutes: <whole minutes done, at least 1> }`, when the closing screen opens (like the lesson's). Stopped before a minute: nothing is written, and Stop goes back to the exercise's page.
- The closing screen, `/breathe-done/<slug>`: always dark like the lesson's, its overline and small icons in the Breathe colour. A short line of your own (calm, no exclamation mark), "3 minutes of Long exhale", the week's candles with today's lit, and at most one next step from `nextStep('breathe', …)`. In Phase 7 that can only be "Write a line about it?" (Meditate is not built yet), opening a free page with "After practice" chosen, or nothing. Then "Done". No "How did that feel?": that question is for Maria's lessons.
- The candles, You's minutes and the week card already follow the record. **History** now lists breathing sessions too, under their day: a small `tide` disc, the exercise's title, the minutes.

## 6. Today, and the hand-off from a lesson

- **Today's Breathe card** sits between the practice of the day and the Write card (V2: move, breathe, sit, write): overline "Breathe · 3 min", the title and summary of `breatheNow`. One tap opens the player for 3 minutes. Once anything was breathed today: the sage tick and "Done today", and the card opens the Breathe tab. The gallery already holds its sample.
- **The lesson's closing screen**: "Three minutes of breath?" (already in `src/strings.ts`) now opens the player of `breatheNow` for 3 minutes, in place of the closing screen, instead of the Breathe tab.

## 7. The sounds

Made by a script in the repository (`npm run sounds`, in `tools/sounds/`), never downloaded, never licensed: two tones and a bell, as small 16-bit mono WAV files in `assets/sounds/`, bundled with the app.
- **In**: a soft sine tone at 440 Hz with a faint octave above for warmth; about 60 ms to rise, then a fade of about one second. Peak at about a quarter of full volume.
- **Out**: the same, a fourth lower (about 330 Hz).
- **Bell**: a struck bowl: a low tone near 220 Hz with three or four quieter partials at bell-like, non-whole ratios (about 2.7, 5.4 and 8.9 times), each fading at its own speed, the low one slowest; about 4 seconds. Phase 8 reuses it.

A test proves the committed files are byte for byte what the script makes, so nobody edits them by hand. Write in the pull request how loud they ended up and how you checked the shapes (you cannot listen: plot them, or measure peak and length).

## 8. The privacy page

In `docs/legal/privacy-policy.md` (a `protected:` commit with these words from the architect), then `npm run legal`, and set `updated:` to the day of your commit:
- in "What stays on your phone", "the lessons you finished and your candles" becomes "the lessons and breathing exercises you finished, your candles";
- in "What the app downloads", "The lessons, pictures and notes" becomes "The lessons, breathing exercises, pictures and notes".

Nothing else changes: the sounds are inside the app, nothing is recorded, nothing is sent.

## 9. Sample progress and the gallery

- **Sample progress**: also a 3-minute "Long exhale" yesterday (History shows it) and nothing breathed today (Today offers its card).
- **The gallery**: the pacer at the top of a breath in, in a hold, at the bottom of a breath out, paused, and with reduce motion; the Breathe card, not done and done.

## Check before the pull request

`npm run check`, with the new tests. The web export builds and the player opens on the web (no ticks there; sound if the browser allows it). Pictures at 390 × 844 in `docs/screens/phase-7/`, both themes for what follows the theme, dark only for the player and the closing screen: the Breathe tab in the morning and in the evening; each exercise's page, and "Why this works" for two of them; settle in; the player in, hold and out (Box), the sigh's "Top up", paused; the closing screen with and without a next step; Today with the Breathe card, not done and done; History with a breathing session; the gallery's new parts. At the phone's text size 1.3: the player and the tab. Look at each one.

## Watch out for

The cases most likely to go wrong for a real person. Each deserves a test (a fake clock for the time).
1. **Time.** One minute of Box (rounds of 16 seconds) ends after 64 seconds, at the end of a breath; three minutes of Long exhale end at exactly 180 seconds; a pause of a minute in the middle does not shorten the session; five minutes do not drift by even a second.
2. **The disc.** The sigh's two steps in make one rising breath; a hold keeps the size; the size is right after a pause; reduce motion keeps it still.
3. **Leaving.** Going to the home screen pauses; coming back shows "Paused"; no tone plays after the player is left; the screen may sleep again after the end or a stop.
4. **The record.** Stopped at 59 seconds: nothing written. At 61 seconds: one minute. A finished 3-minute session: 3. Opening the closing screen again never writes twice. A session that ends after midnight counts on the day it ended, like a lesson.
5. **Content and older apps.** Each refusal of the check, tested one by one; an exercise with a step the app does not know is left out whole; the Phase 5 schema reads the new `content.json`.

## Not in this phase

Meditate (Phase 8 reuses the bell). Breathing faster than ten breaths a minute, holds over 8 seconds (never). Sessions that go on in the background, lock-screen controls. A breathing reminder (Phase 10). Spoken guidance, music. Measuring the breath with the microphone or the camera. Anything sent off the phone.

## In the pull request

"Does this need a new build?": **Yes.** Give the owner these steps, in these words or better:
1. Merge this pull request.
2. **Actions** → **Android build** → **Run workflow** → keep **preview** → **Run workflow**.
3. When the run has a green tick (a minute or two), open it: the link is on its Summary page. Open that link **on your phone** and refresh it until it shows **Install**. Expo's free queue can take an hour or more.
4. Install it over the old app. Your journal, candles and saved lessons stay. If Android says "App not installed", **do not uninstall the old app** (that would erase your journal): stop and tell me.
5. Open the app: **You → About** shows **Version 0.2.0**.

"To test on your phone", after that: Breathe → the suggestion → Begin → follow two breaths with your eyes closed (feel the ticks) → tap the screen (Paused) → Go on → Stop after a minute → the closing screen. Then an exercise's page: Sound on, Begin, listen. Today: the Breathe card. After a lesson: "Three minutes of breath?".
