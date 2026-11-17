# Technical guide

Kept by Claude Code, updated each phase. Short on purpose. The decisions and their reasons are in `docs/ARCHITECTURE.md`.

## Versions (Phase 0, 16 Nov 2026; libraries of Phase 1 added 17 Nov 2026)

| What | Version |
|---|---|
| Expo SDK | 58 (`expo` ~58.0.25) |
| React Native | 0.88.1 |
| React | 19.3.0 |
| Expo Router | ~58.0.31 |
| Reanimated | 4.7.1 (with `react-native-worklets` 0.13.0) |
| TypeScript | ~6.0.3, strict |
| Node | 22 (22.23 here; the workflows use 22) |
| Jest | 30, preset `jest-expo` |
| Video (Phase 1) | `react-native-youtube-iframe` ^2.4.1 on `react-native-webview` 14.0.1, `expo-keep-awake` ~58.0.4 |
| Content build (Phase 1, dev only) | `tsx`, `gray-matter`, `js-yaml` 5, `unified` 11 + `remark-parse` 11, `sharp`, `blurhash`, `zod` 4 |

Exact versions of everything: `package.json` and `package-lock.json`. Install new Expo libraries with `npx expo install`, so that the version fits the SDK.

## Commands

| Command | Does |
|---|---|
| `npm run check` | types + lint + tests + content check + database rules. Must be green before a pull request. |
| `npm run content:check` | reads and checks everything in `content/` (fast, writes nothing). One sentence per problem: file, line if known, what to do. |
| `npm run content:build` | `dist-site/content/v1/`: `content.json`, `preview.json`, `media/*.webp`. Add `-- --release` to fail while a `sample: true` remains. |
| `npm run content:fallback` | the content build, then a copy of `content.json` to `assets/content-fallback.json` (ignored by git, bundled in the app). Run it before `build:web` if you want content in the pictures. |
| `npm run content:image -- <file>` | shrinks a photo in place: 2400 on the long side, JPEG quality 85, metadata removed |
| `npm run build:web` | the web export, into `dist/` |
| `npm run build:site` | `dist-site/`: `site/` at the root, the web export under `app/`, `.nojekyll`. Keeps `dist-site/content/` and refuses to run without it. |
| `npm run shots -- 1 / /practice /lesson/evening-wind-down:full` | pictures of screens into `docs/screens/phase-1/` (needs `build:web` first and `CHROME_PATH`). `/` is saved as `today.jpg`; `:full` captures the whole scrolling page; `:offline` cuts the content download. The content address is answered from `dist-site/content/v1/` on this machine. |
| `node tools/assets/make-icons.mjs` | remakes the temporary icon and splash (gold disc) in `assets/images/` |
| `npx expo-doctor` | Expo's own health check of the project |

## Where things are

- `app.config.ts`: the two variants (`APP_VARIANT`), the package name (one constant), the Expo owner and project ID, splash, icon, updates. **Any change here needs a new build.**
- `app/`: screens. `app/_layout.tsx` loads the six fonts and holds the splash until they are ready.
- `src/theme/`: `tokens.ts` (protected), `index.ts` (re-exports, `inkColors`, `splitAlpha`), `auraForSlug.ts` (FNV-1a hash; no React Native import, so `tools/` can use it), `fonts.ts` (the font files under the names in `tokens.font`).
- `app/`: also `lesson/[slug].tsx`, `series/[slug].tsx`, `journal/[slug].tsx` (Phase 1). Each exports `generateStaticParams`, used only by the web export.
- `src/ui/`: the parts. `sizes.ts` holds the fixed measures of the parts themselves (button heights, icon sizes), so no part and no screen carries a loose number. Phase 1 added the four content cards (`LessonCard`, `LessonRow`, `SeriesCard`, `JournalCard`), the states (`EmptyState`, `OfflineNote`, `Skeleton`, `NotHere`, `LoadingPage`, `DraftChip`), `RichText`, `SearchField`, `PlayButton`, `Fact`, `FlowStep`, and `VideoPlayer` (phone) with its twin `VideoPlayer.web.tsx`. `QuietPlace` now only serves the Studio tab, until Phase 2.
- `src/config.ts`: the content address (`CONTENT_BASE`, permanent once in the store), the file by variant, the 6-second limit.
- `src/content/`: `fallback.ts` (the bundled copy), `load.ts` (saved copy, download, check), `store.ts` (zustand: `status`, `content`, `refresh`), `selectors.ts`, `labels.ts`, `pictures.ts`. All pure except the store; tests next to them.
- `src/lib/`: `greeting.ts` (pure, tested), `variant.ts`, `haptics.ts`, `motion.ts` (the single place that answers "reduce motion?"), `storage.ts` (the one wrapper around AsyncStorage; keys start with `ywm:`), `nav.ts` (the addresses of the pages, and a back that always leads somewhere).
- `src/strings.ts`: every word on screen.
- `tools/content/`: `read.ts` (steps 1 and 2 of the specification: read, check, Markdown to blocks), `markdown.ts`, `pictures.ts`, `problems.ts` (zod issues turned into plain sentences), `build.ts`, `check.ts`, `fallback.ts`, `image.ts`. Fixtures in `__fixtures__/valid/` (remake its two pictures with `node tools/content/__fixtures__/make-pictures.mjs`).
- `tools/`: `site/build.mjs`, `shots.mjs`, `assets/make-icons.mjs`.
- `.github/workflows/`: `checks`, `pages`, `preview-update`, `android-build`. Each starts with a plain-words comment.

## Things worth knowing

- **Expo Router 58 carries its own copy of React Navigation.** Import tab types from `expo-router/tabs`. A custom tab bar receives `state`, `descriptors`, `emitter` and `navigateToTab` (no `navigation` prop any more).
- **Edge to edge** is always on for Android in this SDK; there is no setting for it. Screens pad with the safe-area insets through the `Screen` part.
- **Reanimated shared values**: use `.get()` and `.set()`, not `.value`. The lint rules (React Compiler) reject `.value =` inside hooks.
- **TypeScript 6** no longer loads `@types/*` by itself: `tsconfig.json` lists `"types": ["jest"]`.
- **Jest** only looks in `src/` and `tools/`. The database test (`supabase/tests/rules.test.mjs`) is run by Node directly (`npm run check:db`).
- **Auras** measure their box (`onLayout`) and then draw in pixels, because the disc radius is a fraction of the width. Gradient ids come from `useId`, since the web shares one id space per page.
- **Web preview**: `WEB_BASE_URL=/yoga-app/app` is set by the Pages workflow only. Locally the export is served from the root.
- **Preview updates and builds must be the same variant**: the update workflow sets `APP_VARIANT=preview`, like the `preview` build profile, so the fingerprints match.

## Things worth knowing (Phase 1)

- **`package.json` scripts are part of the build's fingerprint.** Adding or changing a script means over-the-air updates no longer reach the installed build: say "needs a new build" in the pull request.
- **The bundled fallback** is read with `require.context` (`src/content/fallback.ts`), not a plain import, so the bundle still builds when `assets/content-fallback.json` is absent. It is made by `npm run content:fallback` in `pages.yml`, in `preview-update.yml`, and on Expo's machine by the `eas-build-post-install` script (Expo does not upload files ignored by git). The checks workflow builds the web export WITHOUT it, on purpose.
- **Loading order**: saved copy (`ywm:content:v1`) → else bundled copy → shown at once; then one download with a 6-second limit and `cache: 'no-cache'`; only a file that passes `contentFile.safeParse` replaces the saved copy. The raw download is what gets saved, so a newer app can read more of it later. The splash stays until the fonts are loaded and the saved copy has been read.
- **Unknown aura**: the protected schema turns an unknown aura into a fixed one (`.catch`). To get the stable pick by slug the brief asks for, `withKnownAuras` fixes the raw file before the check.
- **Scheduled lessons do not exist yet.** The build publishes everything that is not a draft, whatever its date. Only the big card on Today waits for a lesson's day (`featuredLesson(content, now)`).
- **Video on the phone** uses the library's default page (`lonelycpp.github.io/react-native-youtube-iframe`), which loads YouTube's player. The library has no setting for `youtube-nocookie.com`; the web twin does use it. Errors come from the player (`onError`) and from the web view (`onError`, `onHttpError`, i.e. no network). The play state follows what YouTube reports, so tapping a step after a pause plays again.
- **Web export and slugs**: each lesson, series and journal entry of the bundled copy gets its own static page. An address the export does not know gives GitHub's 404 on Pages; inside the app it shows "This lesson is no longer here."
- **Jest and the Markdown libraries**: `unified`/`remark-parse` are ESM only, so `transformIgnorePatterns` in `package.json` lets Babel transform them. Extend that list if a new ESM-only library joins the tools.
- **`js-yaml` 5** leaves an unquoted date as text (`2026-11-20`); version 4 made a `Date`. The schema accepts both.
- **Pictures**: `sharp` drops all metadata unless asked to keep it; `.rotate()` first turns a phone photo the right way up. The 2400 limit is checked on the long side (the specification says "wider"; `docs/CONTENT.md` says long side).
- **Android build link**: `eas build --json --no-wait` prints a list with one build (`[{ "id": … }]`); the workflow writes `https://expo.dev/accounts/invincirick/projects/yoga-app/builds/<id>` to the run's Summary. If the id cannot be read it links to the list of builds instead.
