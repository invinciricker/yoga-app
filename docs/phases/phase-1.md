# Phase 1: "Content and reading"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md`, `docs/CONTENT.md` (the last section is your specification for the build), `docs/DESIGN.md` ("The screens") and `shared/content-schema.ts`. Phase 0 must be merged. Nothing to redesign: every screen is made of the parts from Phase 0 plus the four content cards.

## In one paragraph

The app becomes real: it downloads Maria's content and shows it. A build turns the files in `content/` into one JSON file and optimised pictures on GitHub Pages; the app fetches that file, keeps a copy, and works from the copy when there is no network. Today, Practice and Journal fill up; a lesson opens with its video; a series lists its lessons. From now on, adding a lesson is a pull request that touches only `content/`.

## 1. The content build (`tools/content/`)

Follow `docs/CONTENT.md`, "What the app receives", step by step. In addition:
- Node + TypeScript, run with `tsx`. Libraries: `gray-matter`, `js-yaml`, `unified` + `remark-parse`, `sharp`, `blurhash`, `zod` (already there).
- `npm run content:build` → `dist-site/content/v1/`. `npm run content:check` → validation only; add it to `npm run check`. `npm run content:image -- <file>` → shrinks a photo in place to 2400 on the long side, JPEG quality 85, metadata removed.
- Every error names the file and the field and says what to do, in one plain sentence: the owner reads these in a red check on GitHub. Example: `content/lessons/evening-wind-down/lesson.md: "level" must be gentle, steady or strong (found "easy").`
- The build is deterministic: the same input gives byte-identical output except `generatedAt`.
- Tests with small fixtures under `tools/content/__fixtures__/`: a valid tree builds; each rule in step 1 of the specification refuses its bad example; Markdown turns into the expected blocks; a draft is in `preview.json` only; `--release` fails on a sample; GPS metadata is gone from an output picture.
- `pages.yml` now runs the content build before `build:site`.
- **The bundled fallback.** `npm run content:fallback` runs the content build and copies `content.json` (no drafts) to `assets/content-fallback.json`, which is in `.gitignore` on purpose. It must exist before anything bundles the app: run it in `pages.yml` before the web export and in `preview-update.yml` before `eas update`. For EAS builds it has to run **on Expo's machine**, because EAS does not upload ignored files: add it as the `eas-build-post-install` script in `package.json` (check the name of that hook in Expo's current docs). The app must also survive the file being absent in a local run: import it through a small module that falls back to an empty content file.

## 2. The content in the app (`src/content/`)

- `src/config.ts`: `CONTENT_BASE = 'https://invinciricker.github.io/yoga-app/content/v1/'` and the file name by variant (`preview.json` for the preview variant, `content.json` for production). One place, with a comment that this address is permanent once the app is in the store.
- `load.ts`: (1) read the saved copy from storage (`ywm:content:v1`); if none, use the bundled fallback; (2) show it; (3) fetch the file with a 6-second limit and `cache: 'no-cache'`; (4) `contentFile.safeParse`; on success save and show, on failure keep what is shown and remember that the refresh failed. Never throw to the screen.
- A `zustand` store: `status` (`loading | ready | stale`), `content`, `refresh()`. Selectors as pure functions with tests: `featuredLesson(content, now)` (the newest `featured`, else the newest), `newestLessons`, `lessonsOfSeries`, `seriesProgress` (stub returning 0 until Phase 3), `searchLessons(query, filters)`, `latestQuote`.
- Pictures: `Cover` picks the smallest variant at least as wide as the cover's layout width × the pixel ratio, joins it with `CONTENT_BASE`, and gives `expo-image` the blurhash as placeholder, with disk caching on.
- Unknown `focus` words are shown capitalised as they are; an unknown `aura` falls back to `auraForSlug`. Old apps will meet new content.

## 3. The screens

Match the mockups; rules in `docs/DESIGN.md`.
- **Today**: replace the Phase 0 hero with the real one (featured lesson; tap anywhere opens it; "Begin" too), add "New from Maria" and "From the journal". The week card and the Studio card are NOT built yet: leave them out, no placeholders.
- **Practice**: search, the filter chips (All, Gentle, Steady, Strong, Under 15 min; "Saved" arrives in Phase 3), series cards, lesson rows.
- **Series** (`app/series/[slug].tsx`) and **Lesson** (`app/lesson/[slug].tsx`) as described. The save button and "Mark as done" are not shown yet (Phase 3). An address with an unknown slug shows a calm "This lesson is no longer here" with a button back to Practice.
- **Journal** tab and **Journal entry** (`app/journal/[slug].tsx`).
- `RichText` in `src/ui/`: draws `block`s with the type styles (`bodyLarge` for paragraphs, `h3` for headings, bullets in gold, quotes as a `Card` in `quote`, pictures with radius 20). Links open in the browser.
- **States**: `Skeleton` shapes on the very first load only; `OfflineNote` (one quiet line under the title: "Showing your saved copy.") when the refresh failed; `EmptyState` for a search with no result and for a tab with no content; pull to refresh on the three list tabs.
- In the preview variant, a draft shows a small "Draft" chip on its card and page.

## 4. Video

- `VideoPlayer` in `src/ui/` takes a `video` value from the content and switches on `provider`.
- `youtube`: `react-native-youtube-iframe` with `react-native-webview` (install with `npx expo install`). Pressing play on the lesson replaces the cover with a 16:9 player, radius 0, on `bg.sunken`, and starts playing. Use the privacy-enhanced host (`youtube-nocookie.com`) if the library allows it. No autoplay on opening the page. If the player reports an error (video removed, embedding disabled, no network), show the cover again with one sentence and a "Open in YouTube" ghost button.
- Tapping a step of "The flow" that has a time seeks the video to it (and starts it if needed).
- `VideoPlayer.web.tsx`: a plain YouTube `iframe` for the web mirror.
- `file`: not built yet. A lesson with `provider: 'file'` shows the cover without a play button.
- Keep the screen awake while a video plays (`expo-keep-awake`).

## 5. Check before the pull request

`npm run check`; then `npm run shots -- 1 / /practice /journal /lesson/evening-wind-down /lesson/slow-morning-flow /series/seven-evenings-of-rest /journal/why-we-slow-down` and compare with the mockups. Test with the network off (the saved copy, then a fresh install using the bundled fallback).

## Not in this phase

Saving, progress, streaks, the reaction, Maria's page, the welcome, settings, Supabase. The sample content stays; do not write more of it.

## In the pull request

"To test on your phone": reopen the preview app twice (the update loads on the second opening), then: Today shows "Evening wind-down"; open it; go to Practice, search "breath", try a filter; open "Slow morning flow" and play its video (a sample from YouTube's documentation, to be replaced by Maria's); tap a step of the flow; open the Journal; switch on airplane mode, close and reopen the app: everything except video still works. Say whether this phase needs a new build (it does: the video player adds a native library).
