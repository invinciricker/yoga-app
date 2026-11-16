# Technical guide

Kept by Claude Code, updated each phase. Short on purpose. The decisions and their reasons are in `docs/ARCHITECTURE.md`.

## Versions (Phase 0, 16 Nov 2026)

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

Exact versions of everything: `package.json` and `package-lock.json`. Install new Expo libraries with `npx expo install`, so that the version fits the SDK.

## Commands

| Command | Does |
|---|---|
| `npm run check` | types + lint + tests + database rules. Must be green before a pull request. |
| `npm run build:web` | the web export, into `dist/` |
| `npm run build:site` | `dist-site/`: `site/` at the root, the web export under `app/`, `.nojekyll` |
| `npm run shots -- 0 / /practice /gallery:full` | pictures of screens into `docs/screens/phase-0/` (needs `build:web` first and `CHROME_PATH`). `/` is saved as `today.jpg`; `:full` captures the whole scrolling page. |
| `node tools/assets/make-icons.mjs` | remakes the temporary icon and splash (gold disc) in `assets/images/` |
| `npx expo-doctor` | Expo's own health check of the project |

## Where things are

- `app.config.ts`: the two variants (`APP_VARIANT`), the package name (one constant), the Expo owner and project ID, splash, icon, updates. **Any change here needs a new build.**
- `app/`: screens. `app/_layout.tsx` loads the six fonts and holds the splash until they are ready.
- `src/theme/`: `tokens.ts` (protected), `index.ts` (re-exports, `inkColors`, `splitAlpha`), `auraForSlug.ts` (FNV-1a hash; no React Native import, so `tools/` can use it), `fonts.ts` (the font files under the names in `tokens.font`).
- `src/ui/`: the parts. `sizes.ts` holds the fixed measures of the parts themselves (button heights, icon sizes), so no part and no screen carries a loose number. `QuietPlace` is the Phase 0 stand-in for the empty tabs; Phase 1 replaces it with real screens and `EmptyState`.
- `src/lib/`: `greeting.ts` (pure, tested), `variant.ts`, `haptics.ts`, `motion.ts` (the single place that answers "reduce motion?").
- `src/strings.ts`: every word on screen.
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
