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
- **Claude Code** is the builder: you. You build exactly what the brief of the phase says and you own all the app code (`app/`, `src/`, `tools/`, `site/`, `.github/`, the config files), `docs/TECH.md`, `docs/screens/` and "State" below.
- **I** decide, test on my phone, and merge. Nothing reaches `main` except through a pull request that I merge.
- **Protected files**: `docs/` (except `docs/TECH.md` and `docs/screens/`), `src/theme/tokens.ts`, `shared/content-schema.ts`, `supabase/migrations/20261116000000_init.sql`, and this file except "State". They hold decisions, so:
  - never change or remove what is in them;
  - you may **add** when the work truly needs it (a new token, a new optional field in the schema, a new migration file next to the first one), in a separate commit whose message starts with `protected:`, and you list it at the top of the pull request under "Changes to protected files" with the reason;
  - if one of them is wrong, do not fix it silently: work around it in the simplest way and say so in the pull request.
- **`content/`** is edited only when the job is adding or changing content, following `docs/ADDING-CONTENT.md`. Never during a phase.
- When the brief is silent or contradicts itself, take the simplest option that matches the mockups and list it under "Choices made" instead of stopping: I may not be there to answer. **Stop and ask only** for something that costs money, needs a password or key I have not given, deletes data, or changes the app's package name.
- How the work flows and every decision so far: `docs/PLAN.md`.

## Which phase
My message names the phase. If it does not, build the first phase that "State" does not list as done. Read that phase's brief whole (`docs/phases/phase-N.md`) and the documents it names. Do not read the other briefs: they cost tokens and they will tempt you to build ahead. The briefs in `docs/phases/old/` are never built.

## Rules for the whole app
- **Stack**: Expo (React Native) with TypeScript in strict mode and Expo Router. The reasons and the folder layout are in `docs/ARCHITECTURE.md`. Use the newest stable Expo SDK when the project is created and write the versions in `docs/TECH.md`. Expo changes fast: when unsure of an API, read the current docs (https://docs.expo.dev/llms.txt lists them) instead of guessing from memory.
- **No new library** unless the brief names it. If one is really needed, prefer a package from the Expo SDK, install it with `npx expo install`, and say why under "Choices made".
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
4. The description starts with **"In short"** (3 to 5 plain sentences, no file names), then **"To test on your phone"** (a short checklist of taps), then **"Does this need a new build?"** (yes or no, with the one thing I must do), then **"Choices made"** and **"Changes to protected files"** if any. Everything technical goes inside a `<details>` block under them.
5. Then wait for my go before the next phase.

## Phases
0. The shell. Done.
1. Content and reading. Done.
2. The new look and the new map: light and dark, colour by area, five tabs, the billboard and Today.
3. Maria and the welcome: Maria's page, the first-launch welcome, You (settings, about, privacy).
4. My practice: marking a lesson done, "how did that feel", candles, saved lessons.
5. Journal, part one: free pages, the guided engine, the Gratitude journal.
6. Journal, part two: the Habit and Health journals; Today offers a page.
7. Breathe: exercises and the pacer.
8. Meditate: the timer and guided sittings.
9. Feedback reaches Maria: the reactions go online, Maria's sign-in and her totals.
10. Notifications: one daily nudge, and a nudge when Maria posts.
11. The Play Store. May start any time after Phase 4.

Only the next phase has a brief; the architect writes each one when the owner asks. Later (`docs/phases/later.md`): our own video and audio hosting with offline downloads, Maria posting from her phone, iPhone.

## State
(Updated by Claude Code at the end of each phase. 25 lines at most. Start with the list of phases done.)

**Phases done: 0 (the shell), 1 (content and reading), 2 (the new look and the new map).** Next: Phase 3 (its brief is not written yet: ask the architect).

**Phase 0 (16 Nov) and 1 (17 Nov).** Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router (`docs/TECH.md`). Two variants (`app.config.ts`), `eas.json`, fonts, the parts in `src/ui/`, the four workflows, the content build (`tools/content/`), `src/content/` (load, store, selectors), the lesson, series and note pages, `VideoPlayer` (YouTube, with a web twin).
- Expo owner `invincirick`; package name still the placeholder `com.yogawithmaria.app` (one constant). Expo created the signing key by itself.
- Content address: `https://invinciricker.github.io/yoga-app/content/v1/` (`preview.json` / `content.json`), published by `pages.yml` on every merge into `main`. Still sample content (7 files `sample: true`).

**17 Nov 2026, Phase 2.** The plan of 17 Nov recorded (`docs/V2.md`, old briefs in `docs/phases/old/`).
- Theme: `palette.dark` / `palette.light`; `ThemeProvider`, `ThemeScope`, `useTheme`, `makeStyles` (`src/theme/ThemeProvider.tsx`); setting `ywm:appearance:v1` (System, Light, Dark in You); `?scheme=` in preview and web; status bar follows dark tops (`src/theme/statusBar.tsx`). Every part and screen converted; nothing outside `src/theme/` imports a colour (a test checks).
- Map: five tabs (Home, Practice, Breathe, Meditate, Journal). `areas` in `src/config.ts` is all `false`: those three tabs are hidden in production and show a placeholder in preview. Notes at `/notes` (data still `content.journal`), the newest three at the bottom of Practice. `/maria` is a stand-in (`QuietPlace`); `/me` is You (Appearance, gallery link).
- Home: the billboard (once a day, `ywm:billboard-day:v1`), then Today. `nextClass`, `longDate`, `showBillboard` in `src/lib/billboard.ts`.
- New parts: `AreaCard` (gallery only), `RoomPlaceholder`; `JournalCard` became `NoteCard`; `Button kind="glass"`; `Overline tone="area" | "cover"`.
- Checks: `npm run check` green (118 tests, content check, 31 database checks). `expo-doctor` 19/20 (three Expo patch releases since Phase 1, not upgraded). Pictures in both themes in `docs/screens/phase-2/`.
- **Needs a new Android build** (`userInterfaceStyle` changed). Not yet proven on a real phone: nothing of Phases 1 and 2 (video, pull to refresh, snapping, status bar icons, the theme following the phone).
- Left on purpose: the week card and "Mark as done" (Phase 4), Maria's real page and the welcome (Phase 3), anything to do in Breathe, Meditate or Journal.
