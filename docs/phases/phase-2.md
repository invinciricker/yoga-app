# Phase 2: "The new look and the new map"

Written by Claude chat, 17 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md`, `docs/V2.md` (whole), and in `docs/DESIGN.md` "Colour", "Auras", "Motion" and "The parts". Phase 1 must be merged. Nothing is drawn for this phase: the words below are the target, and the five drawn screens stay the reference for spacing and type.

## In one paragraph

There is nothing new to *do* in the app after this phase, but everything looks and sits differently: a light theme next to the dark one, a colour for each area, five tabs instead of four, and a new first screen where a billboard for Maria leads to Today. Maria's tips and notes move from their own tab to the bottom of Practice. The app then has its final shape, and every later phase fills one room.

## 1. The theme (`src/theme/`)

- `tokens.ts` now holds `palette.dark` and `palette.light` (same keys), `onCover`, and ten auras. `color` is still exported, as another name for `palette.dark`, only so that nothing breaks while you convert. **When you finish, nothing outside `src/theme/` imports `color`**: add a test that fails if a file in `app/` or `src/` (outside `src/theme/`) does.
- `ThemeProvider`, in `app/_layout.tsx`, around everything. The setting is `'system' | 'light' | 'dark'`, saved under `ywm:appearance:v1`, `'system'` at first, resolved with React Native's `useColorScheme()` (no answer from the phone means dark).
- `useTheme()` gives `{ scheme, color }`. `ThemeScope` is a nested provider that forces a scheme for what is inside it: `<ThemeScope scheme="dark">`.
- One way to style, used everywhere: `const useStyles = makeStyles((color) => StyleSheet.create({ … }))`, remembered per scheme. Styles that hold no colour may stay in a plain `StyleSheet.create`.
- The `color` prop of `Text` keeps its names and gains `onCover.primary`, `onCover.secondary`, `onCover.accent`, `area.home`, `area.move`, `area.breathe`, `area.sit`, `area.write`. `inkColors` becomes a function of the palette.
- `auraForSlug` picks from `autoAuraNames` (the first five). Its test passes unchanged.
- Status bar: light icons on a dark screen and inside a dark `ThemeScope` that reaches the top of the screen; dark icons on a light screen. The root view's background follows the theme (`expo-system-ui`), so no flash of the other colour shows between two screens.
- `app.config.ts`: `userInterfaceStyle: 'automatic'`. The splash stays as it is: the app opens on the billboard, which is dark.
- In the preview variant and on the web mirror only, `?scheme=light` or `?scheme=dark` in the address forces the theme without saving it. The shots tool needs it.
- A test, `src/theme/contrast.test.ts`: in each palette, every colour of `text` (except `onAccent`), `accent.gold`, every colour of `support` and of `area` has a contrast of 4.5 or more against each of the four `bg` colours; `text.primary`, `text.secondary` and each `area` colour against its own `areaSoft`; `text.onAccent` against `accent.fill`. They all pass today. The test is there so that nobody dims a colour later.

## 2. The parts

Convert every part in `src/ui/` and every screen in `app/` to `useTheme()`. Then:

- **On a cover.** Every word and icon drawn over a `Cover` or an `Aura` uses `onCover.*`: the hero card on Today, `LessonCard`, `SeriesCard`, the covers of the lesson and series pages, the cover of a note, `EmptyState` with an aura. Glass buttons keep `glass` and `glassBorder`, with their icon in `onCover.primary`.
- **Gold fills.** The primary `Button`, the selected `Chip`, `PlayButton` and progress fills use `accent.fill`, a hairline of `accent.fillBorder`, and `text.onAccent` on top. Gold words, overlines, links and icons use `accent.gold`.
- **`Candlelight`**: the strength of the glow is `glow` from the palette.
- **`Overline`** gains `tone="area"` with the name of an area. Inside Practice, use `move`.
- **`TabBar`**: five items. The active one takes the colour of its area (`docs/V2.md`, "The map"); the others stay `text.muted`. Icons from lucide: `House`, `Play`, `Wind`, `Moon`, `Feather`. If a name does not exist in the installed version, take the nearest and say so. Check that "Meditate" stays on one line at 360 wide with the phone's text size at 1.3.
- **A new part, `AreaCard`**: a `Card` whose ground is `areaSoft.<area>`. On the left a round disc of 40, filled with `area.<area>` at 16%, holding the area's icon in `area.<area>`. Then an overline in the area's colour, a title (`h3`), one line of `body` in `text.secondary`. On the right a chevron. At least 88 high. This is how Today will show Breathe, Sit and Write. Show its four kinds in the gallery; use it on no screen yet.
- **The gallery** gets a System / Light / Dark control at the top, shows every part in the chosen theme, and shows all ten auras.

## 3. The map

- `app/(tabs)/_layout.tsx`: Home (`index`), Practice, Breathe, Meditate, Journal.
- **Which tabs show** is decided by `areas` in `src/config.ts`: `{ breathe: false, meditate: false, journal: false }` for now. A tab whose area is `false` is hidden in the production variant. In the preview variant it shows a placeholder: its aura over the whole screen (`tide`, `iris`, `rose`) inside a dark `ThemeScope`, the area's name in `display`, and one line: "This room is being built." Each later phase turns its area to `true`.
- **Notes.** Move `app/(tabs)/journal.tsx` to `app/notes/index.tsx`: a page with a back button, the title "Notes from Maria" (her first name comes from the content), the same chips and the same list. Move `app/journal/[slug].tsx` to `app/notes/[slug].tsx`. Rename `JournalCard` to `NoteCard`, and the route helpers and strings to match. Keep the data names (`content.journal`, `content/journal/`), and say why in a comment where they are read.
- **Practice** gains a last section, "Notes from Maria": the three newest tips or notes as `NoteCard`s, and "See all" → `/notes`. Hidden when there are none.
- **Studio.** Delete the tab. `app/maria.tsx` is a page with a back button that shows the same stand-in the Studio tab shows today. Phase 3 builds the real page.
- **You.** `app/me/index.tsx`: the title "You"; a section "Appearance" with three chips, System, Light, Dark (a light tick in the hand when one is chosen); and, in the preview variant, the "Design gallery" link, which leaves Today.

## 4. Home (`app/(tabs)/index.tsx`)

One vertical scroll with two parts.

**The billboard.** Always dark (`ThemeScope`), exactly as tall as the window.
- Ground: Maria's portrait from `studio.portrait` (`contentPosition` top), or the `saffron` aura when there is none. Edge to edge, under the status bar. The scrim over the lower 70%.
- Top row, 16 under the top inset. Left: the app's name as an overline in `onCover.accent`. Right: a `glass` `IconButton` (`User`, label "You") → `/me`.
- Bottom block. Its last line sits 24 above the top of the tab bar. In this order, 8 apart unless said otherwise:
  1. the overline "Your teacher", in `onCover.accent`;
  2. Maria's name, in `display`, `onCover.primary`;
  3. her tagline, in `bodyLarge`, `onCover.secondary` (left out when empty);
  4. 16 lower, only if she has classes: a `CalendarDays` icon (16) and "Next class · Tuesday 18:30 · Evening flow" in `label`, `onCover.primary`; under it the name of the place in `meta`, `onCover.secondary`;
  5. 20 lower: one button, "Meet Maria", 48 high, a pill, `glass` ground and `glassBorder`, its label in `onCover.primary` with an `ArrowRight` → `/maria`;
  6. 24 lower: a hairline in `glassBorder`;
  7. 16 lower, one row. Left: today's date, "Tuesday 17 November", in `title`, `onCover.primary`. Right: a small pill, "Today" with a `ChevronDown` (16): 40 high, `glass` ground, `glassBorder`, its words in `label` (touch area 48). Tapping it scrolls to Today.
- With the sample content only the name and the tagline show. The block must still look finished.
- As the page scrolls, the portrait rises at half the speed and the block fades out over the first 40% of the height. Not under "reduce motion".

**Today.** In the phone's theme, straight under the billboard.
- 32 under its top edge: the overline (weekday and part of the day) on the left, a `raised` `IconButton` "You" on the right. Then the greeting with the candlelight behind it, and the "saved copy" line when offline. All as today.
- The practice of the day: the hero card, as today.
- "New from Maria": as today.
- The saying: as today, under the overline "A note from Maria".
- No week card, and no Breathe, Sit or Write card yet.

**How the two parts behave.**
- The scroll stops at two places only, the top and the start of Today (`snapToOffsets={[0, billboardHeight]}`, `snapToEnd={false}`, `decelerationRate="fast"`). Below Today's start it scrolls freely. Pull to refresh works from the top.
- **Once a day.** The first time the app is opened on a calendar day (the phone's own day, kept under `ywm:billboard-day:v1`), Home shows the billboard. Later the same day it opens already at Today, without any movement; pulling down brings the billboard back. Tapping the Home tab while on Home scrolls to the top.
- Pure functions, tests written first: `nextClass(classes, now)` → the next class from now, or nothing (later today; today but already past; wrapping round the week; no classes at all). `longDate(date)` → "Tuesday 17 November". `showBillboard(lastDay, today)`.

## Check before the pull request

`npm run check`. Shots at 390 × 844 in `docs/screens/phase-2/`, **each one in both themes** (names ending `-dark` and `-light`): `/` at the top; `/` scrolled to Today (the whole page); `/practice`; a lesson; a series; `/notes`; a note; `/breathe`; `/meditate`; `/journal`; `/maria`; `/me`; `/gallery` (the whole page). Look at every one. In the light ones, hunt for: ivory words on an ivory ground, ink words on a cover, bright gold words, a hairline that turned into a heavy line, a tab bar that melts into the page. In the dark ones nothing may have changed except the tabs and Home.

## Not in this phase

Maria's real page, the welcome, about and privacy (Phase 3). Marking a lesson done, candles, saving (Phase 4). Anything a person can do in Breathe, Meditate or Journal. No new library.

## In the pull request

"Does this need a new build?": yes, the app's settings changed (the theme now follows the phone). "To test on your phone": run "Android build" once and install over the old app. Open it: the billboard; tap "Today". Close it and open it again: it opens on Today. Walk the five tabs. Open You and try Light, Dark, System. With System chosen, switch the phone itself between light and dark. Open a lesson in the light theme and check that everything can be read. Say that the web preview shows the same without waiting for a build, and give the two addresses ending in `?scheme=light` and `?scheme=dark`.
