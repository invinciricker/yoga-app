# Phase 0: "The shell"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md`, `docs/ARCHITECTURE.md` and `docs/DESIGN.md` first; open `docs/design/mockups.jpg`. When this brief is silent, take the simplest option that matches the mockups and list it under "Choices made".

## In one paragraph

At the end of this phase the owner installs a preview app on his Android phone and sees the real look: the splash, the fonts, four tabs in the floating bar, a Today screen with the greeting and one cover, and a gallery page showing every part of the design system. The same screens open in a browser from GitHub Pages. Nothing is downloaded yet and there is no content: this phase is the ground everything else stands on, so the parts in `src/ui/` must be right.

## What the owner has already done

The steps of `docs/OWNER-SETUP.md`, "Before Phase 0": an Expo account, an Expo project named `yoga-app`, the `EXPO_TOKEN` secret in GitHub, and GitHub Pages set to "GitHub Actions". He pastes two values in the prompt: his **Expo account name** and the **Expo project ID**. If they are missing, build everything anyway, leave `owner` and `projectId` empty with a `TODO(owner)` comment, make the two workflows that need Expo end quietly with a clear message, and say so at the top of the pull request.

## 1. The project

- Create the app with the newest stable Expo SDK: run `npx create-expo-app@latest` into a temporary folder, then move its files into the repository root **without overwriting anything that is already there** (`README.md`, `CLAUDE.md`, `docs/`, `content/`, `shared/`, `src/theme/tokens.ts`, `supabase/`, `.gitignore`: merge that one). Remove the template's example screens, images and components (it ships a reset script: use it if present). TypeScript strict, Expo Router.
- Write the SDK, React Native and Node versions in a new `docs/TECH.md` (your file: a short technical guide that you keep up to date each phase).
- `app.config.ts` (not `app.json`):
  - `slug: 'yoga-app'`, `scheme: 'yogawithmaria'`, `version: '0.1.0'`, portrait only, `userInterfaceStyle: 'dark'`, background `#0C1311` (that is `color.bg.base`; a config file cannot import the tokens, so write the value with a comment naming the token).
  - **Two variants** from one codebase, chosen by the environment variable `APP_VARIANT`: `production` → name "Yoga with Maria", Android package `com.yogawithmaria.app`; anything else → name "Yoga (preview)", package `com.yogawithmaria.app.preview`. Both can then sit on one phone, and the store version never collides with the test version. Expose the variant to the app as `extra.variant` (read it through `expo-constants`); the web export is always the preview variant. The package name is a placeholder that the owner confirms before Phase 5: keep it in ONE constant at the top of the file.
  - Edge to edge on Android. Splash: background `#0C1311` with a small gold disc in the centre (make the image with `sharp` from an SVG: a `#F3D592` circle with a soft halo, nothing else). The same disc on `#0C1311` is the temporary app icon and adaptive icon. The real icon comes in Phase 6.
  - Web: static output, with `experiments.baseUrl` read from the environment variable `WEB_BASE_URL` (empty by default; the Pages workflow sets `/yoga-app/app`).
  - `expo-updates` with `runtimeVersion: { policy: 'fingerprint' }`.
- `eas.json`: profile `preview` (`distribution: internal`, Android `apk`, channel `preview`, `APP_VARIANT=preview`) and profile `production` (Android `app-bundle`, channel `production`, `autoIncrement`, `APP_VARIANT=production`). `appVersionSource: remote`.
- Libraries for this phase, installed with `npx expo install`: `expo-font`, `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/figtree`, `expo-splash-screen`, `expo-image`, `expo-haptics`, `expo-updates`, `react-native-svg`, `react-native-reanimated`, `react-native-safe-area-context`, `@react-native-async-storage/async-storage`; and with npm: `lucide-react-native`, `zustand`, `zod`. Dev: `jest-expo`, `@electric-sql/pglite`, `puppeteer-core`, `sharp`.

## 2. The theme and the parts

- `src/theme/index.ts` re-exports the tokens and adds `auraForSlug(slug)`: a small, documented string hash (for example FNV-1a, 32-bit) modulo the number of auras. The content build will use the very same function in Phase 1, so put it where `tools/` can import it without pulling in React Native.
- Load the six font files under exactly the names in `tokens.font`. Keep the splash screen up until they are ready. Nothing may ever render in a fallback font.
- Build every part listed in `docs/DESIGN.md`, "The parts", except the four content cards and the three state parts (Phase 1). Each part takes its values from the tokens, has a comment at the top saying what it is for, and is typed strictly.
- `src/strings.ts`: one exported object, grouped by screen. Every word on screen comes from it.
- `app/gallery.tsx`: one scrolling page that shows, under small overlines, every `Text` variant, the colour swatches with their names, each button, chip and icon button in each state, a card, the five auras at hero size (350 × 440) and thumbnail size (76 × 76), a cover with the scrim and text on it, and the tab bar. This page is how you and the owner check the look. Reachable from a quiet "Design gallery" link at the bottom of Today **in the preview variant only**.

## 3. The four tabs

- `app/(tabs)/_layout.tsx` with the custom floating `TabBar`: Today, Practice, Journal, Studio, icons as in `docs/DESIGN.md`. A light haptic on change. The bar respects the bottom inset and screens pad their scroll content so nothing hides behind it.
- **Today**: the overline (weekday and part of the day), the round "My practice" button (does nothing yet), the greeting that follows the clock (the three pairs of lines are in `docs/DESIGN.md`, "Today"; write `greetingFor(date)` as a pure function with a test), the breathing candlelight circle behind it, and one hero cover with the `dusk` aura, the overline "Coming next", the title "The first lessons" and one sentence saying that Maria's lessons arrive in the next update. No button on it.
- **Practice, Journal, Studio**: the title in `display` and an `EmptyState`-like block (a small aura disc, one calm sentence). Three different sentences, from `strings.ts`.
- The arriving animation on each tab, and "reduce motion" respected from the start.

## 4. Checks and the two public places

- Scripts in `package.json`: `typecheck`, `lint` (`expo lint`), `test` (Jest), `check:db` (`node supabase/tests/rules.test.mjs`), `check` (all of them), `build:web` (`expo export --platform web`), `build:site`, `shots`.
- `tools/site/build.mjs` (`build:site`): makes `dist-site/` with `site/` copied to its root, the web export under `app/`, and an empty `.nojekyll` file. Phase 1 adds `content/v1/`.
- `site/index.html`: one dark page in the app's colours and fonts (Google Fonts link is fine on a website): the name, one line ("Yoga lessons from Maria. Coming soon to Google Play."), and a link "Open the web preview" to `app/`.
- `tools/shots.mjs` (`npm run shots -- <phase> <route> [<route>…]`): serves the web export locally, opens each route in Chrome through `puppeteer-core` (`executablePath: process.env.CHROME_PATH`) at 390 × 844 with a device scale factor of 2, waits for fonts (`document.fonts.ready`), and saves `docs/screens/phase-<n>/<route>.jpg`. Use it now for the four tabs and the gallery (full page for the gallery).
- Workflows (table in `docs/ARCHITECTURE.md`): `checks.yml`, `pages.yml`, `preview-update.yml`, `android-build.yml`. Pin the actions to their current major versions. Put a comment at the top of each, in plain words, saying when it runs and what a red cross means: the owner reads these.
- Tests: `auraForSlug` (same slug, same aura; spread over the five), `greetingFor` at the three boundaries.

## Not in this phase

Content, lists, the lesson page, the week card, anything stored, Supabase, notifications. Do not create empty folders or placeholder files for them.

## In the pull request

"To test on your phone" must give the owner these steps, in these words or better:
1. Merge. Two or three minutes later, open `https://invinciricker.github.io/yoga-app/app/` on your phone: four tabs, dark, gold details.
2. On GitHub: Actions → "Android build" → "Run workflow" → `preview`. Expo emails you when it is ready (the free queue can take up to an hour). Open the link on your phone, tap Install, and allow your browser to install apps when Android asks.
3. Open "Yoga (preview)": the splash with the small gold light, then Today. Tap the four tabs. Scroll to the bottom of Today and open "Design gallery".
4. Tell me what looks wrong, in your own words. Screenshots help.

Also say whether the first non-interactive Android build could create its signing key by itself. If Expo refused, give the owner the exact clicks to create it once on expo.dev (Project → Credentials → Android), and do not try another way.
