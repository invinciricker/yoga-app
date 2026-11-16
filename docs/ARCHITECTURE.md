# Architecture

Written by Claude chat, 16 Nov 2026. For Claude Code. Each decision comes with its reason, so that you can judge an edge case the way the architect would. The owner's version in plain words is `docs/START-HERE.md`.

## The shape, in one picture

```
content/ (markdown + photos, in this repo)
   │  GitHub Action: validate, build
   ▼
GitHub Pages ──► content/v1/content.json + media/*.webp     ◄── the app downloads this
   │             /app/   web preview of the app                 (saved copy on the phone,
   │             /privacy.html, /delete-my-data.html             works offline)
   │
app code ──► GitHub Action ──► EAS (Expo's build service) ──► preview .apk on the owner's phone
                                                         └──► production .aab ──► Google Play

the app ──► Supabase (from Phase 4): anonymous sign-in, reactions, notification tokens
YouTube ◄── the app plays Maria's videos from there (until Phase 7)
```

Three planes, on purpose:
1. **Content is static files.** No database for lessons. Static files are free, fast, cannot go down the way a database can, are versioned in git, and a content mistake is undone with a revert.
2. **The backend is tiny.** Supabase holds only what must be shared: the one-tap reactions, notification tokens, and who the teacher is. The app works fully with the backend switched off.
3. **GitHub Actions is the only deployer.** Your cloud session never needs a production key. You push code; the Actions build, publish and send. Secrets live in GitHub and Expo, never in the repo, never in the session.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Expo + React Native + TypeScript**, not Kotlin, not Flutter, not a wrapped website | One codebase reaches Android now and iPhone later (the owner wants that option). Builds happen on Expo's servers, so no Android Studio is needed: the owner works only in cloud sessions. It is the stack coding models know best. A wrapped website was rejected: the owner asked for a real app, and a web view never quite feels like one (gestures, the keyboard, video, notifications). |
| 2 | **Expo Router**, file-based | The folder is the map of the app. A beginner can find a screen. |
| 3 | **Styling: `StyleSheet` + tokens + our own small parts in `src/ui/`**. No Tailwind/NativeWind, no UI kit | A kit would fight the look. Tokens in one typed file keep a small model from inventing colours. |
| 4 | **Content as static JSON on GitHub Pages**, built from `content/` | See plane 1. Also: publishing content needs no secret and no backend. |
| 5 | **Markdown becomes blocks at build time** (`shared/content-schema.ts`, `block`) | The app draws text with its own type styles, with no markdown library at runtime and no HTML to sanitise. |
| 6 | **User data stays on the phone** (progress, streaks, saved lessons) in AsyncStorage | No account means nothing to sign up for, nothing to leak, and almost nothing to declare to Google. The cost: data does not follow the person to a new phone. Accepted for version 1. |
| 7 | **Supabase**, anonymous sign-in, only when first needed | One free service gives auth, Postgres with row-level rules, and (later) server functions and file storage for Maria's own posts. The sign-in happens the first time a reaction or a notification token is sent, not at launch: someone who only reads never becomes a row. |
| 8 | **Videos on YouTube first** (`video.provider: youtube`), our own files later (`file`, Phase 7) | €0 budget. Maria can upload any length from her phone with no help. The video source is a field in the content, so moving to our own hosting later changes content, not screens. Offline download is only possible for `file` videos. |
| 9 | **Main = preview, store = deliberate** | The owner tests on his phone after merging. Over-the-air updates go to the `preview` channel only. The public app changes only through a store release. EAS Update's free plan stops at 1,000 monthly users, so the public app must never depend on it. |
| 10 | **Web export as a mirror** | You can open screens in Chrome and look at them. Without it a cloud session is blind. It also gives iPhone users something to open until there is an iOS app. |
| 11 | **Strings in one file, English only** | Easy to review the wording, easy to translate later. No i18n library yet. |

## Folder layout

```
app/                      screens (Expo Router). The file name is the address.
  _layout.tsx             fonts, splash, providers
  (tabs)/_layout.tsx      the four tabs and the floating tab bar
  (tabs)/index.tsx        Today
  (tabs)/practice.tsx     Practice
  (tabs)/journal.tsx      Journal
  (tabs)/studio.tsx       Studio
  lesson/[slug].tsx       a lesson            (Phase 1)
  series/[slug].tsx       a series            (Phase 1)
  journal/[slug].tsx      a tip or a note     (Phase 1)
  me/…                    My practice, settings, about (Phases 2 and 3)
  teacher/…               Maria's sign-in and totals (Phase 4)
  gallery.tsx             every part of src/ui on one page, for checking the look
src/
  theme/tokens.ts         PROTECTED. Colours, type, spacing, motion.
  theme/index.ts          re-exports, plus small helpers (auraForSlug)
  ui/                     the parts: Text, Screen, Button, Chip, Card, Cover, Aura, IconButton, TabBar…
  strings.ts              every word the user reads
  config.ts               public settings: content address, Supabase address and publishable key
  content/                download, validate, save, and read content.json   (Phase 1)
  practice/               progress, streaks, saved lessons: pure logic + storage (Phase 3)
  backend/                the ONLY folder that talks to Supabase            (Phase 4)
  notifications/          permission, token, reminders                      (Phase 5)
shared/content-schema.ts  PROTECTED. The content contract, used by tools and by the app.
content/                  the lessons, journal, studio page (docs/CONTENT.md)
tools/content/            the content build and check (Node + TypeScript)   (Phase 1)
tools/notify/             sends notifications after a content publish       (Phase 5)
site/                     the small public website: landing, privacy, delete-my-data
supabase/                 the migration and its test
docs/                     PROTECTED, except TECH.md and screens/
```

Rules of the layout: a screen file in `app/` stays thin (layout and wiring); logic lives in `src/`. Anything that can be a pure function is one, with a test. One folder talks to each outside service, so it can be replaced by a fake in tests.

## Content: from a markdown file to the screen

Formats: `docs/CONTENT.md`. The contract: `shared/content-schema.ts`.

1. **Build** (`tools/content/build.ts`, Phase 1). Reads `content/`, validates every file with the `...Source` schemas, turns markdown into blocks, prepares pictures (WebP at widths 480, 960 and 1440, never bigger than the original, named by a hash of their bytes, plus a blurhash), and writes into `dist-site/content/v1/`:
   - `content.json`: everything that is not a draft;
   - `preview.json`: drafts included;
   - `media/<hash>-<width>.webp`.
   Paths inside the JSON are relative to the JSON file, so the host can change without rebuilding.
2. **Publish**. The `pages` workflow runs on every push to `main`: content build + `site/` + the web export of the app, deployed to GitHub Pages. Address: `https://invinciricker.github.io/yoga-app/`. **Never rename the repository or the GitHub account after the store release**: that address is inside every installed app.
3. **Download** (`src/content/`, Phase 1). At launch and on pull-to-refresh: show the saved copy at once, fetch the new file with a 6-second limit, validate it with `contentFile.safeParse`, and only then replace the saved copy. A file that fails validation is ignored and the saved copy stays. The very first launch without network falls back to a snapshot bundled in the app at build time (`assets/content-fallback.json`).
4. **Which file**: builds of the `preview` profile read `preview.json`; `production` builds read `content.json`. So a draft can be checked on the owner's phone before the world sees it.

## The backend (from Phase 4)

`supabase/migrations/20261116000000_init.sql` is the whole database; read its comments. `supabase/tests/rules.test.mjs` proves the rules on a real Postgres engine without a Supabase project (31 checks, all passing on 16 Nov 2026). Keep it in `npm run check`.

- **Identity**: `supabase.auth.signInAnonymously()`, called lazily. The session is kept by supabase-js in AsyncStorage. Anonymous users have the `authenticated` role; the `anon` role (key alone) can do nothing.
- **Reactions**: upsert into `reactions` on `(user_id, lesson_slug)`. Saved on the phone first, sent when online, retried quietly (an outbox). The screen never waits for the network.
- **Maria**: an email and password account that the owner creates in the Supabase dashboard, plus one row in `teachers`. She signs in from Settings. Signing in replaces the anonymous session on her phone, which is fine. Her totals come from `rpc('reaction_stats')`, which refuses anyone else.
- **Config**: `src/config.ts` exports the Supabase address and publishable key. Both empty means every backend feature is hidden and the app behaves as in Phase 3. This is also how tests and the web preview run.
- **Sleeping**: a free Supabase project pauses after 7 days without requests. The `keepalive` workflow (Phase 4) makes one cheap request twice a week.
- Supabase now names its keys "publishable" (was `anon`) and "secret" (was `service_role`). Use whichever names the dashboard shows; the meaning is the same.

## Builds and updates

- **Two variants of one app**, chosen by `APP_VARIANT` in `app.config.ts` and exposed to the code as `extra.variant`: `preview` ("Yoga (preview)", package ending in `.preview`, reads `preview.json`, shows the design gallery and the demo switches) and `production` (the real name and package, reads `content.json`). Both can be installed on one phone. The web export is always `preview`.
- **Profiles** in `eas.json`: `preview` (an `.apk` for direct install, channel `preview`) and `production` (an `.aab` for Google Play, channel `production`, version code raised automatically).
- **Runtime version**: policy `fingerprint`. An over-the-air update reaches a build only when the native side is identical. Changing a native library or the app config means a new build; say so in the pull request under "Does this need a new build?".
- **Workflows** (`.github/workflows/`), all yours to write:
  | File | Runs | Does | Secrets |
  |---|---|---|---|
  | `checks.yml` | every pull request, every push to `main` | `npm run check` | none |
  | `pages.yml` | push to `main` | content build + site + web export → GitHub Pages | none |
  | `preview-update.yml` | push to `main` that touches app code | `eas update --channel preview` | `EXPO_TOKEN` |
  | `android-build.yml` | by hand ("Run workflow", choose `preview` or `production`) | `eas build --platform android --non-interactive --no-wait` | `EXPO_TOKEN` |
  | `keepalive.yml` | Phase 4, twice a week | one request to Supabase | none (publishable key) |
  | `notify.yml` | Phase 5, after `pages.yml` and hourly by day | announces new content once | `SUPABASE_SECRET_KEY` |
  A workflow that needs a secret must end quietly with a clear message when the secret is missing, never fail red: the owner adds secrets phase by phase.
- The free EAS plan gives 15 Android builds a month in a slow queue (waits of an hour happen), and stops a build after 45 minutes. Spend builds only when the native side changed.

## Conventions

- TypeScript strict. No `any`. Types for content come from `shared/content-schema.ts` (`z.infer`), never re-declared.
- State: `zustand` stores, one per concern (`content`, `practice`), persisted through one small wrapper around AsyncStorage (`src/lib/storage.ts`). Storage keys start with `ywm:` and carry a version (`ywm:practice:v1`).
- Dates: days are local calendar days as `YYYY-MM-DD` strings. Never compare days through UTC timestamps (streaks break at midnight otherwise).
- Errors the user can meet (no network, a video that will not load) get a calm sentence from `src/strings.ts` and a way forward. Nothing fails silently and nothing shows a stack trace.
- Tests: Jest (`jest-expo`) for pure logic and for the content tools. No snapshot tests of screens: screens are checked by looking at them (the gallery and the web export).
- `npm run check` = typecheck + lint + tests + content check + database rules test.

## What is deliberately not here

Accounts and sync between phones, comments, private messages, photos sent by students, payments, a French version, an iPhone build. Each is on the later list in `docs/PLAN.md` with what it would take. Do not lay groundwork for them.
