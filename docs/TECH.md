# Technical guide

Kept by Claude Code, updated each phase. Short on purpose. The decisions and their reasons are in `docs/ARCHITECTURE.md`.

## Versions (Phase 0, 16 Nov 2026; libraries of Phase 1 added 17 Nov 2026; Expo patches of Phase 3, 17 Nov 2026; unchanged in Phase 4)

| What | Version |
|---|---|
| Expo SDK | 58 (`expo` ~58.0.26) |
| React Native | 0.88.1 |
| React | 19.3.0 |
| Expo Router | ~58.0.32 |
| Reanimated | 4.7.1 (with `react-native-worklets` 0.13.0) |
| TypeScript | ~6.0.3, strict |
| Node | 22 (22.23 here; the workflows use 22) |
| Jest | 30, preset `jest-expo` ~58.0.15 |
| Video (Phase 1) | `react-native-youtube-iframe` ^2.4.1 on `react-native-webview` 14.0.1, `expo-keep-awake` ~58.0.4 |
| Content build (Phase 1, dev only) | `tsx`, `gray-matter`, `js-yaml` 5, `unified` 11 + `remark-parse` 11, `sharp`, `blurhash`, `zod` 4 |

Exact versions of everything: `package.json` and `package-lock.json`. Install new Expo libraries with `npx expo install`, so that the version fits the SDK.

## Commands

| Command | Does |
|---|---|
| `npm run check` | types + lint + tests + content check + database rules. Must be green before a pull request. |
| `npm run content:check` | reads and checks everything in `content/` (fast, writes nothing). One sentence per problem: file, line if known, what to do. |
| `npm run content:build` | `dist-site/content/v1/`: `content.json`, `preview.json`, `media/*.webp`. Add `-- --release` to fail while a `sample: true` remains, or while `site.yaml` lacks `contactEmail` or `publisher` (the privacy page names them). |
| `npm run content:fallback` | the content build, then a copy of `content.json` to `assets/content-fallback.json` (ignored by git, bundled in the app). Run it before `build:web` if you want content in the pictures. |
| `npm run content:image -- <file>` | shrinks a photo in place: 2400 on the long side, JPEG quality 85, metadata removed |
| `npm run build:web` | the web export, into `dist/` |
| `npm run build:site` | `dist-site/` (`tools/site/build.ts`): `site/` at the root, `privacy.html` made from `src/legal/privacy.json` with the names of the built `content.json`, the app's own font files in `fonts/`, the web export under `app/`, `.nojekyll`. Keeps `dist-site/content/` and refuses to run without it. |
| `npm run legal` | remakes `src/legal/privacy.json` (from `docs/legal/privacy-policy.md`) and `src/legal/licences.json` (from `dependencies` and the installed packages). Run it after changing either; the tests fail until you do. |
| `npm run shots -- 2 --both / /:today /practice /gallery:full` | pictures of screens into `docs/screens/phase-2/` (needs `build:web` first and `CHROME_PATH`). `/` is saved as `home.jpg`. `--both` takes each route in dark and light (`-dark.jpg`, `-light.jpg`, through `?scheme=`); `:light`/`:dark` do one; `:full` captures the whole scrolling page; `:today` captures the whole of Today under Home's billboard; `:offline` cuts the content download; `:next1`/`:next2` press "Next" first (the welcome's screens 2 and 3); `:first` is a first launch (otherwise the welcome counts as seen, so `/` is Home); `:big` is 360 × 640 with everything 1.3 times larger (the web cannot grow only the text); `:demo` adds `?demo=streak` (sample progress, `-demo.jpg`). Each picture opens in a fresh browser profile (no progress saved). The content address is answered from `dist-site/content/v1/` on this machine: build it with `-- --content <folder>` to picture other content without touching `content/`. |
| `node tools/assets/make-icons.mjs` | remakes the temporary icon and splash (gold disc) in `assets/images/` |
| `npx expo-doctor` | Expo's own health check of the project |

## Where things are

- `app.config.ts`: the two variants (`APP_VARIANT`), the package name (one constant), the Expo owner and project ID, splash, icon, updates (on in the preview app only). **Any change here needs a new build.**
- `app/`: screens. `app/_layout.tsx` loads the six fonts and holds the splash until they are ready.
- `src/theme/`: `tokens.ts` (protected: `palette.dark`, `palette.light`, `onCover`, ten auras), `index.ts` (re-exports, `areas`, `inkColors(palette)`, `splitAlpha`, `withAlpha`; no React Native), `scheme.ts` (which scheme to draw, pure), `ThemeProvider.tsx` (`ThemeProvider`, `ThemeScope`, `useTheme`, `makeStyles`, the `?scheme=` override), `statusBar.tsx` (`ThemedStatusBar`, `useDarkTop`), `auraForSlug.ts` (FNV-1a hash over the first five auras; no React Native import, so `tools/` can use it), `fonts.ts`. Tests: `contrast.test.ts`, `noColorImport.test.ts`, `scheme.test.ts`, `auraForSlug.test.ts`.
- `app/`: `(tabs)/` holds Home (`index`), `practice`, `breathe`, `meditate`, `journal` (the last three are placeholders until their phases). Pages: `lesson/[slug]`, `lesson-done/[slug]` (the closing screen, Phase 4), `series/[slug]`, `notes/index`, `notes/[slug]` (Maria's tips and notes; the content key stays `journal`), `maria`, `welcome`, `me/index` (You), `me/saved`, `me/history`, `me/delete` (Phase 4), `me/about`, `me/privacy`, `me/licences`, `gallery`. The `[slug]` pages export `generateStaticParams`, used only by the web export.
- `src/ui/`: the parts. `sizes.ts` holds the fixed measures of the parts themselves (button heights, icon sizes), so no part and no screen carries a loose number. Phase 4 added `WeekCard` (seven candles), `AnswerChoice` (an answer of a closing screen), `DoneTick` (the sage tick), `ProgressLine` (a series over its cover), and: `IconButton active` (the filled bookmark), `Button kind="danger"`, `Chip look="soft"`, `SettingsRow detail`/`danger`, `Candlelight place="top"`, `LessonRow` reading the stores for its tick and bookmark, `SeriesCard progress`. Phase 1 added the four content cards (`LessonCard`, `LessonRow`, `SeriesCard`, `JournalCard`), the states (`EmptyState`, `OfflineNote`, `Skeleton`, `NotHere`, `LoadingPage`, `DraftChip`), `RichText`, `SearchField`, `PlayButton`, `Fact`, `FlowStep`, and `VideoPlayer` (phone) with its twin `VideoPlayer.web.tsx`. Phase 3 added `ListCard` (rows in one card, hairlines between them), `SettingsRow` (switch or chevron; Phases 4 and 10 add rows with it) and `icons.ts` (`Instagram`, drawn with Lucide's own `createLucideIcon`: Lucide 1.x ships no brand logos). `Button` quiet and link take `onCover`.
- `src/config.ts`: the content address (`CONTENT_BASE`, permanent once in the store), the file by variant, the 6-second limit, and `areas` (which of Breathe, Meditate, Journal are built; a `false` tab is hidden in production and a placeholder in preview).
- `src/content/`: `fallback.ts` (the bundled copy), `load.ts` (saved copy, download, check), `store.ts` (zustand: `status`, `content`, `refresh`), `selectors.ts`, `labels.ts`, `pictures.ts`. All pure except the store; tests next to them.
- `src/lib/`: `billboard.ts` (`nextClass`, `longDate`, `showBillboard`; pure, tested), `studio.ts` (Maria's page: `classDays`, `classTime`, `classDetails`, `classLength`, `contactActions`, `mapsLink`; pure, tested), `welcome.ts` (`welcomeSlides`: the words of the welcome, never naming a room that is not built; tested), `version.ts` (`versionLines` for About; tested) with `buildInfo.ts` and its web twin, `links.ts` (`openLink`: false when nothing can open the link; web twin), `prefs.ts` (zustand: appearance, reduce motion, welcome seen, the billboard's day, all read before the splash goes), `greeting.ts` (pure, tested), `variant.ts`, `haptics.ts` (`tick`, and `success` when a lesson is done), `motion.ts` (the single place that answers "reduce motion?"), `storage.ts` (the one wrapper around AsyncStorage; keys start with `ywm:`), `nav.ts` (the addresses of the pages, and a back that always leads somewhere).
- `src/day/` (Phase 4): the record of the day. `record.ts` (pure, tested: `DayEntry`, `addDays`, `streak`, `longestStreak`, `week`, `totals`, `nextStep`, `parseEntries`, `lessonEntry`), `todayMove.ts` (Today's big card, tested), `store.ts` (zustand, `ywm:days:v1`), `hooks.ts` (`useWeek`).
- `src/practice/` (Phase 4): saved lessons and answers. `types.ts` (`Practice`, `Reaction`, `parsePractice`, `toggled`; the words are the database's), `progress.ts` (`isDone`, `lastDone`, `seriesProgress`, `doneLine`, `savedLessons`, `historyDays`), `store.ts` (zustand, `ywm:practice:v1`), `sample.ts` and `demo.ts` (sample progress). All tested except `demo.ts`.
- `src/strings.ts`: every word on screen.
- `src/legal/`: `privacy.json` and `licences.json` (made by `npm run legal`, kept in git, never edited by hand), `fill.ts` (`placeholderValues`, `fillPlaceholders`: `{appName}`, `{teacher}`, `{contactEmail}`, `{publisher}` from the content, "(not set yet)" when missing; tested), `index.ts`.
- `tools/content/`: `read.ts` (steps 1 and 2 of the specification: read, check, Markdown to blocks), `markdown.ts`, `pictures.ts`, `problems.ts` (zod issues turned into plain sentences), `build.ts`, `check.ts`, `fallback.ts`, `image.ts`. Fixtures in `__fixtures__/valid/` (remake its two pictures with `node tools/content/__fixtures__/make-pictures.mjs`).
- `tools/`: `legal/build.ts` (with its freshness tests), `site/build.ts` (with tests: privacy.html is filled; no page of the site loads anything from another site), `shots.mjs`, `assets/make-icons.mjs`.
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

## Things worth knowing (Phase 2)

- **Colours come from `useTheme()`, never from an import.** Styles with colours are written `const useStyles = makeStyles((color) => StyleSheet.create({…}))` and called inside the component; they are made once per scheme. `src/theme/noColorImport.test.ts` fails if a file in `app/` or `src/` (outside `src/theme/`) imports `color`, `palette`, `onCover` or `tokens`. `color` is still exported by the protected tokens, as the dark palette.
- **Words over a cover use `onCover.*`** (`<Text color="onCover.primary">`, `<Overline tone="cover">`, `<DraftChip onCover>`, glass buttons). Covers are pictures and look the same in both themes.
- **`ThemeScope scheme="dark"`** wraps the billboard, the room placeholders and the lesson's video stage. A part inside reads the dark palette through `useTheme()`; a style made by `makeStyles` in a parent outside the scope is NOT dark (Home draws its billboard as its own component for that reason).
- **The status bar** is drawn once (`ThemedStatusBar` in `app/_layout.tsx`). A screen whose top is dark calls `useDarkTop(true)`, or gives `Screen` a `darkTop` height; only the focused screen counts.
- **The theme before the first drawing**: `usePrefs.start()` reads `ywm:appearance:v1` and `ywm:billboard-day:v1` while the splash is up; the root draws nothing until then, so no flash of the other theme. `expo-system-ui` sets the window colour on every change; React Navigation's own theme gets the same colours (otherwise its light grey `#F2F2F2` layer sits behind the screens).
- **`?scheme=light|dark`** is read in the preview app and on the web only, kept for the whole visit, never saved. On the web, "System" follows the browser (`prefers-color-scheme`); headless Chrome reports light.
- **`userInterfaceStyle: 'automatic'`** needs `expo-system-ui`'s config plugin on Android; Expo applies it by itself when the package is installed (`@expo/prebuild-config`).
- **Home's scroll**: `snapToOffsets`, `snapToEnd` and `contentOffset` do nothing on the web, so Home also places itself with one `scrollTo` when its height is first known. The scroll position is followed on the UI thread (Reanimated); the status bar hears about it through `scheduleOnRN` (react-native-worklets), not the deprecated `runOnJS`.
- **Tab press**: the custom tab bar emits `tabPress`; a screen listens with `navigation.addListener('tabPress')` and checks `navigation.isFocused()` (the event also arrives when coming from another tab).
- **The shots tool and window-sized parts**: for `:full` and `:today` it stops react-native-web from hearing `resize`, so the billboard keeps its phone height while the window grows.
- **`expo-doctor`, 17 Nov 2026 evening**: 19/20, only because Expo published patch releases since Phase 1 (`expo` 58.0.26, `expo-router` 58.0.32, `jest-expo` 58.0.15). Not upgraded in Phase 2 (no library changes); `npx expo install --fix` does it, and changes the build's fingerprint.

## Things worth knowing (Phase 3)

- **The welcome** is reached through `app/(tabs)/_layout.tsx`: when `welcomeSeen` is false at the moment the tabs first appear, it renders `<Redirect href="/welcome">` (a `replace`), so Home never draws first and the welcome is alone in the stack (back leaves the app). The answer is read once (`useState`), so "Show the welcome again" in About pushes the welcome on top instead, without unmounting the tabs. "Begin"/"Skip" write `ywm:welcome:v1`, forget the billboard's day in memory (Home listens and goes back to its top), then `replace('/')` on a first launch or `dismissAll()` + `navigate('/')` from About. A deep link (`/maria` in the web preview) does not go through the tabs, so it opens directly.
- **The welcome's pager** is a horizontal `ScrollView` with `pagingEnabled`; the current screen comes from `onScroll` (react-native-web has no `onMomentumScrollEnd`). With reduce motion there is no pager: one screen at a time, a 120 ms fade, and a swipe read from `onTouchStart`/`onTouchEnd` (a `PanResponder` built during render trips the React Compiler lint).
- **Reduce motion** = the phone's setting OR `ywm:reduce-motion:v1` (`useReduceMotion()`, `src/lib/motion.ts`). Everything that moves asks it: `Arrive`, `PressableScale`, `Candlelight`, the billboard's parallax and fade, Home's and the lesson's scrolls, the welcome, the photo fade-in of `Cover` (120 ms), and the stack's screen transitions (`animation: 'fade'`).
- **Updates**: `updates.enabled` is `false` in the production variant (Expo's app config: the build then only runs its bundled code). About reads `expo-updates` (`isEmbeddedLaunch`, `createdAt`, `runtimeVersion`) on the phone; `buildInfo.web.ts` never imports it.
- **Links that cannot open**: `Linking.openURL` rejects on Android when no app takes the link (`tel:` on a tablet). On the web, a `https:` link opens a new tab and anything else counts as "did not open". Maria's page then shows "That did not open here." and the address, selectable. `canOpenURL` is not used: on Android 11 and later it needs every scheme declared in the manifest.
- **`npm run build:site` is TypeScript now** (`tsx`), so it reuses `src/legal/fill.ts`. `tsx` follows the `@/` paths of `tsconfig.json`.
- **The site's fonts**: `site/fonts.css` points at `fonts/*.ttf`, which `build:site` copies from `@expo-google-fonts/*` (the app's own files).
- **`eslint-config-expo`** moved to `devDependencies` (it never shipped in the app); `licences.json` is made from `dependencies` only, direct libraries (not the libraries they use in turn).
- **Scripts changed** (`legal`, `build:site`): with `app.config.ts`, this phase changes the build's fingerprint. `expo-doctor`: 20/20 after `npx expo install --fix` (17 Nov 2026).

## Things worth knowing (Phase 4)

- **Over the air.** Phase 4 adds no library, and changes neither `app.config.ts` nor the scripts of `package.json`: the fingerprint is the one of the Phase 3 build (`APP_VARIANT=preview npx @expo/fingerprint .` gave `c19562c9…` on `main` and on this branch, 17 Nov 2026), so `preview-update.yml` reaches it. `npx expo install --check` found nothing newer within SDK 58 on 17 Nov 2026; `expo-doctor` 20/20.
- **Two keys, read before the splash goes**: `ywm:days:v1` (a list of `DayEntry`) and `ywm:practice:v1` (`{ saved, reactions }`). `app/_layout.tsx` draws nothing until both are read, so Today's week never pops in. Reading back goes through `parseEntries`/`parsePractice`: anything broken or unknown is left out, never a crash. Every change saves the whole value again; a refused save (storage full) leaves the change in memory for the session.
- **Days are text.** `addDays` works on the local noon of a day, so no change of summer time can move it; days compare as `"YYYY-MM-DD"` text. The entry's day is the moment the closing screen opens (`lessonEntry(lesson, new Date())`).
- **One entry per opening.** The closing screen names its opening once (`useState`) and `useDays.add(entry, opening)` ignores a second write under the same name, so a screen drawn twice (React's strict mode, a content refresh) writes once; a new opening (or a reload of the web page) writes again.
- **The closing screen** is `app/lesson-done/[slug].tsx`, at `/lesson-done/<slug>`, shown as a `fullScreenModal` that rises from below (a fade with reduce motion). Not `/lesson/<slug>/done`: the web export would then hold both `lesson/<slug>.html` and a folder `lesson/<slug>/`, and a web host may answer the folder.
- **Today's big card** is chosen from what was done before today (`todayMove`), so it stays put, with its tick, once done today. "The last 7 days" = today and the six days before.
- **Saved and done in lists**: `LessonRow` reads both stores itself, so every list (Practice, Series, Saved, the gallery) shows the tick and the bookmark without the screen passing anything. History passes `marks={false}`.
- **Limit 3 of docs/V2.md**: `FILTERS_FROM = 8` (`src/content/selectors.ts`). Practice hides its search and filters below 8 lessons, Notes its chips below 8 notes. `searchLessons` takes the saved slugs for the "Saved" filter.
- **Sample progress** (`?demo=streak`, the gallery's switch; preview app and web only): `showSample` puts the sample in the stores and keeps the person's own aside; nothing is written while it shows. "Delete my data" empties both.
- **The video's end** opens the closing screen on the phone (`onChangeState('ended')` → `onEnd`). The web twin is a plain YouTube frame and cannot tell: on the web, "Mark as done" is the way.
- **Nested buttons**: the bookmark on Today's big card sits inside the card's own button; the inner one wins the touch on the phone and on the web (checked in Chrome).
