# Yoga with Maria

## What it is
An Android app (working title "Yoga with Maria") where Maria, a yoga teacher, shares lessons, videos, tips and things she has learned, and where anyone can follow them for free. It also presents Maria and her in-person classes, so it works as her shop window. After a lesson, people tell her in one tap how it felt. It goes on the Google Play Store first; an iPhone version may follow, so nothing may be Android-only without a reason.

Four tabs in a floating bar at the bottom:
1. **Today**: a greeting, the week's candles (streak), tonight's practice, what's new, one of Maria's sayings.
2. **Practice**: every lesson and series, with search and filters.
3. **Journal**: Maria's tips and notes.
4. **Studio**: Maria, why yoga, her class times and place, how to contact her.

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
My message names the phase. If it does not, build the first phase that "State" does not list as done. Read that phase's brief whole (`docs/phases/phase-N.md`) and the documents it names. Do not read the other briefs: they cost tokens and they will tempt you to build ahead.

## Rules for the whole app
- **Stack**: Expo (React Native) with TypeScript in strict mode and Expo Router. The reasons and the folder layout are in `docs/ARCHITECTURE.md`. Use the newest stable Expo SDK when the project is created and write the versions in `docs/TECH.md`. Expo changes fast: when unsure of an API, read the current docs (https://docs.expo.dev/llms.txt lists them) instead of guessing from memory.
- **No new library** unless the brief names it. If one is really needed, prefer a package from the Expo SDK, install it with `npx expo install`, and say why under "Choices made".
- **Look**: every colour, size, radius and timing comes from `src/theme/tokens.ts`. No hex colour and no magic number in a screen. Build screens from the parts in `src/ui/`. The target is `docs/design/mockups.html` (picture: `docs/design/mockups.jpg`); the rules are in `docs/DESIGN.md`.
- **Words**: everything the user reads is in English and lives in `src/strings.ts`, never inside a component. Short, warm, calm. No exclamation marks.
- **Content is data**: lessons, tips, photos and Maria's page come from `content.json`, built from `content/` and downloaded by the app (`docs/CONTENT.md`). Adding content never needs a code change or a new version in the store.
- **Old versions keep working**: once the app is in the store, people keep old versions for months. The app ignores fields it does not know and survives optional ones being absent. Never make the app need something new in `content.json` or in the database without keeping the old path working.
- **It works without the network** after the first launch: reading comes from the saved copy. Only video needs a connection (until Phase 7).
- **Privacy**: no accounts, no analytics, no ads, no trackers. The only things that leave the phone are the one-tap reaction and the notification token, both without a name. The repository is public: never commit a key, a password, a `.env` file or a personal detail. The Supabase address and publishable key are public by design and may be committed.
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
0. The shell: the project, the look, four empty tabs, the preview on my phone.
1. Content and reading: the content build, Today, Practice, lessons with video, Journal.
2. Studio and welcome: Maria's page, class times, the first-launch welcome, settings.
3. My practice: marking a lesson done, the "how did that feel" screen, streaks, saved lessons.
4. Feedback reaches Maria: the reactions go online, Maria's sign-in and her totals.
5. Notifications: a nudge when Maria posts, and an optional daily reminder.
6. The Play Store: icon, listing, the production build, the closed test, the release. May start any time after Phase 3.

Later (`docs/phases/later.md`): our own video hosting with offline downloads, Maria posting from her phone, iPhone.

## State
(Updated by Claude Code at the end of each phase. 25 lines at most. Start with the list of phases done.)

**Phases done: 0 (the shell), 1 (content and reading).** Next: Phase 2.

**16 Nov 2026, Phase 0.** Expo SDK 58, React Native 0.88, TypeScript strict, Expo Router (versions and notes: `docs/TECH.md`).
- Built: the two variants (`app.config.ts`), `eas.json`, the theme helpers, the fonts, the base parts in `src/ui/`, `src/strings.ts`, the four tabs with the floating tab bar, the design gallery (preview only), the site page, the four workflows.
- Expo: owner `invincirick`, project ID in `app.config.ts`. Package name still the placeholder `com.yogawithmaria.app` (one constant).
- Android: the first build was requested without error and Expo created the signing key by itself. The owner has not installed it yet.

**17 Nov 2026, Phase 1.**
- Built: the content build in `tools/content/` (`content:check`, `content:build`, `content:fallback`, `content:image`), `src/config.ts`, `src/content/` (load, store, selectors), the four content cards, the states, `RichText`, `VideoPlayer` (YouTube, with a web twin), Today, Practice, Journal, the lesson, series and journal entry pages.
- Content address: `https://invinciricker.github.io/yoga-app/content/v1/` (`preview.json` for the preview app, `content.json` for production). Published by `pages.yml` on every merge into `main`.
- Checks: `npm run check` green (59 tests, content check, 31 database checks), `expo-doctor` 20/20, web export builds with and without the bundled copy, pictures in `docs/screens/phase-1/`.
- **Needs a new Android build** (the video player is a native library, and new scripts change the fingerprint). "Android build" now writes the link to the build on the run's Summary page.
- Not yet proven: nothing of Phase 1 has run on a real phone. The video player, the keep-awake and pull to refresh were only seen on the web mirror or in tests.
- Left for later, on purpose: the week card and "Mark as done" (Phase 3), the Studio card and page (Phase 2), series progress (`seriesProgress` answers 0; no bar is drawn), `file` videos.
- Still sample content everywhere (7 files marked `sample: true`). Stand-in left: `src/ui/QuietPlace.tsx`, used by the Studio tab only.
