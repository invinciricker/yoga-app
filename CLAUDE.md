# Yoga with Maria

## What it is
An Android app (working title "Yoga with Maria") where Maria, a yoga teacher, shares lessons, videos, tips and things she has learned, and where anyone can follow them for free. It also presents Maria and her in-person classes, so it works as her shop window. After a lesson, people tell her in one tap how it felt. It goes on the Google Play Store first; an iPhone version may follow, so nothing may be Android-only without a reason.

Five tabs in a floating bar at the bottom. The reasons and the rules are in `docs/V2.md`: read it after this file; it wins over older pages.
1. **Home**: a billboard for Maria and her class, then Today: a greeting and one suggestion for each area.
2. **Practice**: every lesson and series, with search and filters, and Maria's notes.
3. **Breathe**: breathing exercises with a pacer.
4. **Meditate**: a timer and guided sittings.
5. **Journal**: the person's own private writing: free pages and three guided journals (gratitude, habit, health).

I'm a beginner and this is my first Android app. Explain things in plain English, keep it short, and tell me exactly what to click.

## Who does what
- **Claude chat** (my claude.ai Project "yoga app with Maria") is the architect. It took the decisions and wrote the briefs, the design, the tokens, the content formats and the database. I may not be able to reach it for every question, so the briefs are meant to be complete.
- **Claude Code** is the builder: you. You build what the brief of the phase asks for. The brief says **what** and **why**; **how** is yours (see "How much freedom you have"). You own all the app code (`app/`, `src/`, `tools/`, `site/`, `.github/`, the config files), `docs/TECH.md`, `docs/screens/` and "State" below.
- **I** decide, test on my phone, and merge. Nothing reaches `main` except through a pull request that I merge.
- **Protected files**: `docs/` (except `docs/TECH.md` and `docs/screens/`), `src/theme/tokens.ts`, `shared/content-schema.ts`, `supabase/migrations/20261116000000_init.sql`, and this file except "State". They hold decisions, so:
  - never change or remove a decision in them;
  - you may **add** when the work truly needs it (a new token, a new optional field in the schema, a new migration file next to the first one), in a separate commit whose message starts with `protected:`, and you list it at the top of the pull request under "Changes to protected files" with the reason;
  - you may **correct a plain factual mistake** in them (a command that does not work, a broken link, a wrong file name or version, a button a website has renamed, an old phase number), the same way: a `protected:` commit, listed in the pull request;
  - if a *decision* in one of them looks wrong, do not change it: work around it in the simplest way and say so in the pull request.
- **`content/`** is edited only when the job is adding or changing content, following `docs/ADDING-CONTENT.md`. Never during a phase.
- When the brief is silent or contradicts itself, take the simplest option that fits the mockups and `docs/V2.md`, and list it under "Choices made" instead of stopping: I may not be there to answer. **Stop and ask only** for something that costs money, needs a password or key I have not given, deletes data, or changes the app's package name.
- How the work flows and every decision so far: `docs/PLAN.md`.

## How much freedom you have
Since 17 Nov 2026 (evening). The briefs used to say "build exactly this". That kept you from things that were plainly good, like taking Expo's latest fixes. So, within the rules of this file and of `docs/V2.md`:
- **Keep Expo up to date within its SDK.** At the start of every phase, run `npx expo install --check`. If newer releases of our SDK exist (58 for now), install them with `npx expo install --fix` as the phase's first commit (`deps: …`), run `npx expo-doctor` and the checks, and write the new versions in `docs/TECH.md`. This changes the build's fingerprint, so the pull request then says **"Does this need a new build? Yes"**. If the phase would otherwise need no new build, you may leave the update for the next phase that needs one, unless it fixes something that affects us: say which you did under "Choices made". The brief may decide for you (Phase 4 does).
- **A new SDK** (59 and later) is never part of a phase: it can break things and needs a new build and a careful test. Say in the pull request that it exists; I will start a session just for it.
- **Libraries.** You may add one when it makes the work clearly simpler, sturdier or better looking. Prefer, in this order: what the project already has; the Expo SDK, installed with `npx expo install`; a well-known, maintained library. Say why under "Choices made". Never a library that costs money, needs a key or an account I have not given, sends anything off the phone, or follows people (analytics, ads, crash reports that upload). A native library means a new build: say so.
- **Your own code.** You may rename, move, split or tidy what you own when it makes the phase cleaner. Keep the folder layout of `docs/ARCHITECTURE.md` unless you have a reason, and give it.
- **Bugs you find** in earlier work: fix them, each in its own commit (`fix: …`), and list them under "Also fixed".
- **Small design calls.** Where the brief and the mockups are silent (a spacing, a transition, an empty state, a sentence in `src/strings.ts`), decide in the spirit of `docs/DESIGN.md` and `docs/V2.md`, and list what you decided. Bigger changes to the look (a new kind of screen, a new colour, a different layout for a drawn screen) belong to the architect: propose them in the pull request instead of building them.
- **Reading.** Start with the brief and the documents it names. Read anything else in the repository that you need to do the job well. Just do not build ahead of the phase.

## Which phase
My message names the phase. If it does not, build the first phase that "State" does not list as done. Read that phase's brief whole (`docs/phases/phase-N.md`) and the documents it names. Do not read the briefs of later phases: they will tempt you to build ahead. The briefs in `docs/phases/old/` are never built.

## Rules for the whole app
- **Stack**: Expo (React Native) with TypeScript in strict mode and Expo Router. The reasons and the folder layout are in `docs/ARCHITECTURE.md`. Keep Expo current within its SDK ("How much freedom you have") and write the versions in `docs/TECH.md`. Expo changes fast: when unsure of an API, read the current docs (https://docs.expo.dev/llms.txt lists them) instead of guessing from memory.
- **Libraries**: see "How much freedom you have".
- **Look**: every colour, size, radius and timing comes from `src/theme/tokens.ts`. No hex colour and no magic number in a screen. Build screens from the parts in `src/ui/`. The target is `docs/design/mockups.html` (picture: `docs/design/mockups.jpg`); the rules are in `docs/DESIGN.md`. Where `docs/V2.md` differs from the mockups (themes, colour by area, the tabs, Home), `docs/V2.md` wins.
- **Words**: everything the user reads is in English and lives in `src/strings.ts`, never inside a component. Short, warm, calm. No exclamation marks.
- **Content is data**: lessons, tips, photos and Maria's page come from `content.json`, built from `content/` and downloaded by the app (`docs/CONTENT.md`). Adding content never needs a code change or a new version in the store.
- **Old versions keep working**: once the app is in the store, people keep old versions for months. The app ignores fields it does not know and survives optional ones being absent. Never make the app need something new in `content.json` or in the database without keeping the old path working.
- **It works without the network** after the first launch: reading comes from the saved copy. Only video needs a connection (until Phase 7).
- **Privacy**: no accounts, no analytics, no ads, no trackers. The only things that leave the phone are the one-tap reaction and the notification token, both without a name. The repository is public: never commit a key, a password, a `.env` file or a personal detail. The Supabase address and publishable key are public by design and may be committed. The person's journal never leaves the phone.
- **Android first, web as a mirror**: the web export exists so that you and I can look at screens in a browser. It must build and open. A part that only exists on phones gets a `.web.tsx` twin that shows a quiet placeholder. Never hold up Android work for a web-only detail.
- **Accessible**: touch targets of 48 or more, a label on every icon button, text that survives the phone's "larger text" setting, and "reduce motion" respected.
- **Main is the rehearsal room, the store is the stage**: merging into `main` updates the preview app on my phone and the web preview, never the public app. A store release is a separate, deliberate step (`docs/PLAY-STORE.md`). One exception to keep in mind: `content/` on `main` IS live for everyone.
- Useful comments in the code, and folders and files a beginner can follow.

## Before you open the pull request
1. `npm run check` is green (types, lint, tests, content check, database rules).
2. The web export builds. Open the screens you touched at 390 × 844 with Chrome (`CHROME_PATH`), save the pictures in `docs/screens/phase-N/`, and **look at them** next to `docs/design/mockups.jpg`. Fix what does not match before asking me to look.
3. Update "State" (25 lines at most) and `docs/TECH.md`.
4. The description starts with **"In short"** (3 to 5 plain sentences, no file names), then **"To test on your phone"** (a short checklist of taps), then **"Does this need a new build?"** (yes or no, with the one thing I must do), then **"Choices made"**, **"Also fixed"** and **"Changes to protected files"** if any. Everything technical goes inside a `<details>` block under them.
5. Then wait for my go before the next phase.

## Phases
0. The shell. Done.
1. Content and reading. Done.
2. The new look and the new map: light and dark, colour by area, five tabs, the billboard and Today. Done.
3. Maria and the welcome: Maria's page, the first-launch welcome, You (settings, about, privacy). Done.
4. My practice: marking a lesson done, "how did that feel", candles, saved lessons. Done.
5. Journal, part one: free pages, the guided engine, the Gratitude journal; Today offers a page. Done.
6. Journal, part two: the Habit and Health journals, and what the journal format learns for them. Brief ready.
7. Breathe: exercises and the pacer.
8. Meditate: the timer and guided sittings.
9. Feedback reaches Maria: the reactions go online, Maria's sign-in and her totals.
10. Notifications: one daily nudge, and a nudge when Maria posts.
11. The Play Store. May start any time after Phase 4.

A phase has a brief only once the architect has written it, one or two phases ahead, when the owner asks. Later (`docs/phases/later.md`): our own video and audio hosting with offline downloads, Maria posting from her phone, iPhone.

## State
(Updated by Claude Code at the end of each phase. 25 lines at most. Start with the list of phases done.)

**Phases done: 0 (the shell), 1 (content and reading), 2 (the new look and the new map), 3 (Maria and the welcome), 4 (my practice), 5 (Journal, part one).** Next: Phase 6 (Journal, part two), once its brief is written.

**Phases 0 to 2 (16 and 17 Nov).** Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router (`docs/TECH.md`). Two variants (`app.config.ts`), `eas.json`, four workflows, the content build (`tools/content/`), `src/content/`, lesson, series and note pages, `VideoPlayer` (YouTube, web twin). Expo owner `invincirick`; package name still the placeholder `com.yogawithmaria.app` (one constant). Content at `https://invinciricker.github.io/yoga-app/content/v1/`, published by `pages.yml` on every merge into `main`; still sample content (7 files `sample: true`). Theme: `palette.dark`/`light`, `ThemeProvider`, `ThemeScope`, `useTheme`, `makeStyles` (a test forbids colour imports). Five tabs; `areas` in `src/config.ts`: only `journal` is `true`. Home = the billboard (once a day) then Today.

**17 Nov 2026, Phase 3.** Expo patches (`expo` 58.0.26). `/maria`, `/welcome`, You (`/me`), `src/legal/` (`npm run legal`), `publisher` in `site`. Production: `updates.enabled: false`. The build on the owner's phone (fingerprint `9b4a4041…`) dates from then.

**17 Nov 2026, Phase 4** (over the air). `src/day/`: the record of the day (`ywm:days:v1`), `streak`, `week`, `totals`, `nextStep`, `todayMove`. `src/practice/`: saved lessons and answers (`ywm:practice:v1`). The lesson's bar, the bookmark, the closing screen `/lesson-done/<slug>`, `WeekCard`, You's numbers, Saved, History, Delete my data. Sample progress: `?demo=streak` or the gallery's switch (memory only).

**19 Nov 2026, Phase 5** (over the air: no library, no change to `app.config.ts` or the scripts; fingerprint `9b4a4041…` on `main` and on the branch). Built on the architect's branch `claude/architect-phase-5` (PR 7).
- Content: `guidedJournals` in the schema (optional, read leniently: unknown prompt kinds skipped, an unreadable journal left out), `content/guided-journals/gratitude/journal.yaml` (copied unchanged), check and build in `tools/content/journals.ts`, format in `docs/CONTENT.md`.
- `src/journal/`: `guided.ts` (`nextPageOf`, `isOpenToday`, `pageNumber`, `isVisible`, `recallOf`, `journalToday`, `progressOf`), `types.ts` (`JournalEntry`), `exportText.ts` (parts above 100,000 characters), `store.ts` (`ywm:journal:v1:page:<id>`, `ywm:journal:v1:begun`; saved within 700 ms and on leaving or backgrounding), `useWriting.ts` (first answer makes the page; one `write` day entry per page per day), `sample.ts`.
- Screens: the Journal tab, `/guided/<slug>`, `/guided-about/<slug>`, `/write?journal=` (`&entry=`; `&page=` in preview and web only), `/free-pages`, `/free-page`, `/me/export`; Today's Write card; "Write a line about it?" after a lesson. Parts: `WritingField`, `Prompt`, `ShelfRow`; `Screen keyboard`.
- Privacy page: the Journal paragraph. Android build's Summary says a build never changes the phone by itself. Pictures in `docs/screens/phase-5/`. `npm run check` green (359 tests).
- Not yet proven on a real phone: everything since Phase 1, the keyboard on a writing page, the share sheet, and the over-the-air update itself (this phase is its first real test). Maria's real details still to come as content.
