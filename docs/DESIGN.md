# Design

Written by Claude chat, 16 Nov 2026. For Claude Code. The values are in `src/theme/tokens.ts`; the target is `docs/design/mockups.html` (open it in Chrome) and its picture `docs/design/mockups.jpg`. This page gives the rules behind them, so that screens which are not drawn come out looking like the ones that are.

## The idea

**A room lit by one candle.** The owner chose "deep and moody": a forest-at-night ground, warm ivory text, and candlelight gold used sparingly. The app is opened in the evening, on a mat, by someone who wants quiet. Everything follows from that: few things on a screen, large calm type, light that glows instead of shouting.

Three principles decide every doubtful case:
- **Dark must never mean dim.** A dark app fails when it turns murky. Text is warm ivory at full strength. Every text colour in the tokens passes 4.5:1 on every surface. Never put muted text on a photo, never lower the opacity of text to make it "subtle", never use a grey that is not in the tokens.
- **One idea per screen area, and air around it.** If a screen feels full, remove something. Do not shrink it.
- **It must feel like an app, not a page.** Things respond when touched (scale, haptic), screens arrive with a short movement, the tab bar floats. See "Motion".

## Colour

- Screens are `bg.base`. Cards and rows are `bg.raised` with a 1-pixel `border.subtle`. The tab bar and sheets are `bg.elevated` with `border.strong`. **No drop shadows** anywhere: on a dark ground they look dirty. Depth is a lighter surface plus a hairline.
- **Gold is rationed.** On one screen: at most one filled gold button, plus small gold details (overlines, the active tab, a time stamp, an icon). If two things are gold and large, one of them is wrong.
- `support.sage` means done. `support.ember` is warmth and the "strong" level. `support.danger` is for errors and destructive actions only.
- The only glow allowed: the lit candles, the play button, and the soft "candlelight" circle behind a greeting (a radial gradient of gold at 20 to 30% fading to nothing, as on Today and After practice).

## Type

Two families. **Cormorant Garamond** (medium, semibold, medium italic) is Maria's voice and every title. **Figtree** (regular, medium, semibold) is everything functional. Load them with `@expo-google-fonts/cormorant-garamond` and `@expo-google-fonts/figtree` under the exact names in `tokens.font`.

- Use the `type` styles by name through the `Text` part (`<Text variant="h1">`). Never set a font size in a screen.
- Cormorant is never smaller than 20. Small text in Cormorant is unreadable on a phone.
- Italic Cormorant (`quote`) is for Maria's words and for the second line of a greeting. Nowhere else.
- Overlines are uppercase, 11, letter-spaced, gold or muted. They label; they never carry the message.
- Numbers that change or line up (times, counts) use tabular figures (`fontVariant: ['tabular-nums']`).
- Let text grow with the system setting, capped at 1.3 (`maxFontSizeMultiplier`), and check Today and Lesson at that size.

## Space and shape

- 20 on the left and right of every screen (`layout.gutter`). 40 between sections (`layout.sectionGap`). 12 between cards.
- Radius: 28 for hero covers, 20 for cards and buttons, 14 for inputs and small thumbnails, full pills for chips and the tab bar.
- Every tappable thing is at least 48 high and wide, even if what you see is smaller (use `hitSlop`).
- The content column never grows beyond `layout.maxContentWidth`; on a tablet or in the web preview it is centred.
- Draw under the status bar and the navigation bar (edge to edge) and pad with the safe-area insets. The top of every screen starts 16 below the top inset.

## Auras: covers made of light

Maria will not have a photo for everything on day one, and stock photos would cheapen her. So a cover with no photo is an **aura**: a small night scene built from the palette. Five exist (`tokens.aura`): `dusk`, `forest`, `candle`, `ember`, `moss`. Each is a vertical ground gradient, two soft glows, and one small bright disc (a moon, a sun, a flame). The disc is what makes it a picture and not a gradient: never leave it out.

- Build one part, `src/ui/Aura.tsx`, with `react-native-svg`: a `LinearGradient` rect for the ground, a `RadialGradient` ellipse for each glow (colour at the given opacity in the centre, fully transparent at the edge), and a `Circle` for the disc with a second, larger, faint circle behind it as its halo. Positions and radii in the tokens are fractions of the cover's width and height.
- `src/ui/Cover.tsx` shows the photo when the content has one, otherwise the aura named in the content. When text sits on a cover, add the scrim: a gradient from transparent to `color.scrim` over the lower 70%.
- Content always arrives with an `aura` name. If the name is unknown to this version of the app, use `auraForSlug(slug)`: a stable pick from the five by a hash of the slug.

## Motion

Short and calm (`tokens.motion`). Nothing bounces.
- **Press**: every card and button scales to 0.97 in 120 ms and back. One part does this (`PressableScale`); use it everywhere.
- **Arrive**: the sections of a screen fade in and rise 12, 40 ms apart, at most 6 steps, 220 ms each. Once per visit, not on every re-render.
- **Breathe**: the candlelight circle behind a greeting scales from 1 to 1.06 and back over 6 seconds, forever. It is the only looping animation.
- **Haptics** (`expo-haptics`): a light tick when changing tab, when saving a lesson, when choosing a reaction; a success notification when a lesson is marked done.
- **Reduce motion**: when the system setting (or the app's own switch, Phase 3) is on, there is no arriving, no breathing and no scaling; only fades of 120 ms.
- Stack screens use the platform's normal transition. Do not write custom screen transitions.

## The parts (`src/ui/`)

Build these in Phase 0 and show each one in `app/gallery.tsx`. A screen is assembled from them and adds layout only.

| Part | What it is |
|---|---|
| `Text` | `variant` (a key of `tokens.type`), `color` (a key path such as `text.secondary`), uppercase for `overline`. |
| `Screen` | Background, safe area, gutter, centred column, optional scroll, bottom padding that clears the tab bar. |
| `PressableScale` | The press behaviour above, with `accessibilityRole="button"`. |
| `Button` | `primary` (gold, 56 high, radius 20, label 16 semibold, optional icon), `ghost` (hairline `border.strong`, 52 high), `quiet` (text only, 48 high). One `primary` per screen. |
| `IconButton` | 48 round. `raised` (on a screen) or `glass` (on a cover: `color.glass` with `color.glassBorder`). Always an `accessibilityLabel`. |
| `Chip` | 40 high pill. Selected: gold fill with `text.onAccent`. Unselected: hairline `border.strong`, `text.secondary`. Also a small static kind, 36 high, for "You'll need". |
| `Card` | `bg.raised`, hairline, radius 20, padding 20 or 24. |
| `Overline`, `SectionHeader` | Label above a block; a section title (`h3`) with an optional "See all" on the right. |
| `Aura`, `Cover` | See above. `Cover` takes a radius and an aspect or a height. |
| `LessonCard`, `LessonRow`, `SeriesCard`, `JournalCard` | The four ways content appears in lists (Phase 1). Sizes as in the mockups. |
| `TabBar` | Floating pill: 16 from the sides and from the bottom inset, 68 high, `bg.elevated`, hairline `border.strong`. Icon 22 over a label. Active is gold with a slightly thicker icon stroke; inactive is `text.muted`. Not translucent: a blurred bar is not reliable on Android. |
| `EmptyState`, `OfflineNote`, `Skeleton` | Calm states for nothing, no network, loading (Phase 1). |

Icons: `lucide-react-native`, stroke width 1.5, size 20 or 22. Tabs: `Sun` (Today), `Play` (Practice), `BookOpen` (Journal), `MapPin` (Studio). Never an emoji as an icon.

## The screens

Five are drawn. Build them to match. The rest are described here.

**Today** (drawn). From the top: overline with the weekday and part of the day; the round "My practice" button; the greeting (`display`, second line italic and `text.secondary`); the week card (Phase 3; until then leave it out, do not fake it); "Tonight's practice" hero (the featured lesson, or the newest); "New from Maria" (the five newest lessons except the hero, scrolling sideways, cards 200 wide); "From the journal" (the newest entry with a `quote`; hidden if none); the Studio card (Phase 2). The greeting and the hero label follow the clock: before 12 "Good morning." / "This morning's practice", 12 to 17 "Good afternoon." / "Today's practice", after 17 "Good evening." / "Tonight's practice". Second lines, in order: "Begin gently.", "A pause in the day.", "Let the day settle."

**Practice** (drawn). Title, search field, filter chips in one sideways-scrolling row (All, Saved from Phase 3, Gentle, Steady, Strong, Under 15 min), "Series" (first one large, the others 152 high), "All lessons" as rows, newest first. Search matches title, summary and focus. With a search or a filter active, the series block is hidden and the list shows matches, or an empty state with a "Clear" button.

**Lesson** (drawn). Cover 460 high running under the status bar, glass back and save buttons, a gold play button in the centre when there is a video. Then overline (series name and place, if any), title, three facts (minutes, level, focus), the summary and body, "You'll need", "The flow", "A note from Maria". A bar fixed at the bottom, fading in from `bg.base`: "Begin practice" (plays the video in place of the cover; without a video the button is not shown) and "Mark as done" (Phase 3). Sections without content are left out, never shown empty.

**After practice** (drawn; Phase 3). One screen, nothing else on it. The streak overline, "Well done.", one italic line with the minutes, the three answers, then (only after an answer is chosen) the optional feeling chips, the privacy line, "Done". One tap is a complete answer; "Done" without an answer is allowed and sends nothing.

**Studio** (drawn; Phase 2). Maria's portrait full width, 500 high, with her name over the scrim (an `ember` aura until a photo exists). Her introduction. "Why yoga" cards scrolling sideways. "Classes with Maria": one card listing the classes by day, today's day in gold, then the place with "Open in Maps", then the price line. A gold "Message Maria" button (WhatsApp if there is a number, otherwise email, otherwise hidden) and ghost buttons for whatever else is filled in. Blocks whose content is missing are hidden.

**Series** (not drawn). The series cover 320 high with title and "n lessons · total minutes" over the scrim, the description, then the lessons as numbered rows (a small `h3` numeral in gold in place of nothing, then the usual row). From Phase 3, done lessons show the sage tick and the first lesson not yet done has a ghost "Continue" button under the description.

**Journal** (not drawn). Title "Journal", chips (All, Tips, Notes), then a single column. A **tip** is a `Card` with an overline "Tip", its title in `h3`, and its summary. A **note** is a cover 180 high, radius 20, with an overline "Note", title in `h2` and summary underneath, outside the cover. Newest first.

**Journal entry** (not drawn). A reading page: back button, overline (Tip or Note, and the date written as "16 November"), title in `h1`, cover if any (radius 20, not full bleed), then the body in `bodyLarge` with 20 between blocks; headings in `h3`; a quote block is a `Card` holding the text in `quote` (never a coloured line down the left side). Related lessons at the end as rows under "Try this".

**My practice** (not drawn; Phases 2 and 3). Opened from the round button on Today. Title "My practice". Three numbers in a row (`h1` numerals over a `meta` label): lessons done, minutes, longest streak. The week card. "Saved" and "History" as rows leading to lists. Then "Settings" rows: notifications (Phase 5), daily reminder (Phase 5), reduce motion, about and privacy, delete my data, and at the very bottom, quiet and small, "Teacher sign in" (Phase 4).

**Welcome** (not drawn; Phase 2). Three full screens, swiped or advanced with a gold button, shown once. Each has a full-bleed aura as background, an overline, two lines in `display` and one sentence in `bodyLarge`: (1) `candle`: "Yoga with Maria" / "A quiet place to practise." (2) `forest`: "Short lessons, any time" / "Videos, tips and notes from Maria, new ones as she makes them. Free." (3) `dusk`: "Nothing to sign up for" / "Open the app and begin. Your progress stays on your phone." The last button reads "Begin". A quiet "Skip" at the top right of the first two.

**Maria's totals** (not drawn; Phase 4). Title "How lessons felt". Chips: 7 days, 30 days, All. Then one `Card` per lesson that has answers: lesson title, "n answers", and one horizontal bar split in three (too gentle in `support.sage`, just right in `accent.gold`, too much in `support.ember`) with the three counts written under it in `meta`, so the bar is never the only way to read it. Feelings as four small counts on one line. Lessons without answers are not listed. An empty state says so plainly.

## Checking your work

Open `docs/design/mockups.html` and your web export side by side at 390 wide. Check, in this order: the fonts are really Cormorant and Figtree (a fallback serif is the most common miss); spacing matches; nothing is gold that should not be; text on covers is readable; touch targets are large enough. Then put a picture of each screen you built in `docs/screens/phase-N/`.
