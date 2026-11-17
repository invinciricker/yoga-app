# Phase 3: "Maria and the welcome"

Written by Claude chat, 17 Nov 2026 (evening). For Claude Code. Read `CLAUDE.md` (with its new section "How much freedom you have"), `docs/V2.md`, and in `docs/DESIGN.md` the paragraphs "Studio", "Welcome", "Motion" and "The parts". The drawn target for Maria's page is the "Studio" screen of `docs/design/mockups.jpg`; for the rest, the words below are the target. Phase 2 must be merged. The content comes from `studio` and `site` in `content.json` (`docs/CONTENT.md`, "Maria's page").

## In one paragraph

After this phase the app can be shown to Maria and to anyone. "Meet Maria" on the billboard opens her real page: who she is, why yoga, her classes, where they are, what they cost, and how to reach her in one tap. The very first time the app opens, three calm screens say what it is. You becomes a real settings page: appearance, reduce motion, about (with the "look after yourself" notice) and privacy. The phase starts by bringing Expo up to date, so it ends with a new Android build. That build is the one Phase 4 will update over the air.

## 0. First: Expo's latest fixes

As "How much freedom you have" says: `npx expo install --check`, then `npx expo install --fix`, as the first commit (`deps: …`). Then `npx expo-doctor` should pass every check (it was 19/20 because of these releases); if one still fails, say which and why. `npm run check` green before going on. Write the new versions in `docs/TECH.md`.

## 1. Maria's page (`app/maria.tsx`)

Match the "Studio" mockup, with three differences from `docs/V2.md`: it is a page with a back button, not a tab; it follows the phone's theme (only the portrait stays dark, because it is a picture); its area colour is `home` (gold), so its overlines and small icons use `area.home`.

Every block is hidden when its content is missing. With today's sample content only the portrait (an aura), the name, the introduction and "Why yoga" show: that must look finished, not empty. From the top:

- **Portrait.** Full width, 500 high, under the status bar (light icons over it). Her photo (`studio.portrait`, `imagePosition="top"`), else the `saffron` aura, as on the billboard. The scrim over the lower part. A glass back button at the top left. Over the scrim, at the bottom left: the overline "Your teacher" (`tone="cover"`), her name in `display` (`onCover.primary`), the tagline in `bodyLarge` (`onCover.secondary`).
- **Introduction.** The body blocks with `RichText`, in `bodyLarge`.
- **Why yoga.** `SectionHeader` "Why yoga". The benefit cards, 210 wide, scrolling sideways with the next one peeking, running to the right edge like "New from Maria" on Today. In each card: the icon in a round disc of 40 (`area.home` at 16%, the icon in `area.home`), the title in `h3`, the text in `body`, `text.secondary`. Icons: `moon` → Moon, `feather` → Feather, `wind` → Wind, `heart` → Heart, `sun` → Sun, `leaf` → Leaf; a word this version does not know → Sparkles.
- **Classes with Maria.** `SectionHeader` "Classes with {teacher}". One `Card`, one row per class, hairlines between rows. Left column: the day in `title` ("Today", "Tomorrow", else the weekday), the time under it in `meta`, `area.home`, tabular figures ("18:30", or "18:30 – 19:45" with an end). Right column: the class name in `title`; under it, in `meta`, `text.secondary`, the level and the length ("All levels · 75 min"; the length only when there is an end). The class that `nextClass` returns carries a small overline "Next" above its name. Order: by weekday starting from today, then by start time.
- **Place.** Under the card: a MapPin icon in `area.home`, the place's name in `title`, the address in `body`, `text.secondary`, and a link button "Open in Maps" with an arrow. It opens `mapsUrl`; without one, Google Maps' search link for the address (`https://www.google.com/maps/search/?api=1&query=` and the address, encoded).
- **Price.** `pricing` in `body`, `text.secondary`.
- **Contact.** One gold button, "Message {teacher}", with a message icon: WhatsApp (`https://wa.me/` and the digits of the number, without the +) when there is a number, else email (`mailto:`), else no gold button at all. Then ghost buttons, two to a row, in this order and only when filled in: Call (`tel:`), Instagram (`https://instagram.com/<handle>`), Email (when it is not already the gold button), Website. If a link will not open (no app for it, a tablet without a phone, the web preview), show one calm line under the buttons, "That did not open here.", followed by the address itself, selectable. Never fail silently.

Pure functions, tests written first (in `src/lib/`, next to `billboard.ts`; file names are yours):
- `classDays(classes, now)` → the days that have classes, in the order above, each with its label and its classes sorted by start. Tests: today comes first even when its classes are over; a day without classes is skipped; two classes on one day are in time order; Saturday → Sunday → Monday wraps; no classes → empty.
- `contactActions(contact)` → the gold action (or none) and the ghost actions, in order, each with its address. Tests: WhatsApp and email (email becomes a ghost button); email only (it is the gold one); phone only (no gold, one ghost); nothing at all; an Instagram handle with a dot in it.
- `mapsLink(location)`; `classLength(start, end)` → "75 min", or nothing when there is no end or the end is not after the start.

## 2. The welcome (`app/welcome.tsx`)

Three full screens, always dark (`ThemeScope`), shown once: the first time the app opens, before Home. Swipe sideways or press the gold button. Each screen: a full-bleed aura; in its lower part an overline (`onCover.accent`), a title in `display` (`onCover.primary`, two lines at most), one sentence in `bodyLarge` (`onCover.secondary`), three small dots (the current one `onCover.accent`), and the gold button. A quiet "Skip" at the top right of the first two screens.

The words (they replace those in `docs/DESIGN.md`). `{app}` is `site.appName`, `{teacher}` is `site.teacherFirstName`.
1. Aura `saffron`. Overline "Welcome". Title "{app}". Sentence: "A quiet place to practise, a few minutes at a time." Button "Next".
2. Aura `forest`. Overline "With {teacher}". Title "Short lessons, any time". Sentence: "Videos, tips and notes from {teacher}, new ones as she makes them. Free." Button "Next".
   **Once Breathe, Meditate and Journal are all built** (`areas` in `src/config.ts`), this screen becomes: aura `tide`, overline "Every day", title "Move, breathe, sit, write", sentence "{teacher}'s lessons, a few slow breaths, a quiet sitting, a page of your own. One small practice a day." Never name a room that is not built. A pure function chooses, with a test.
3. Aura `dusk`. Overline "Yours". Title "Nothing to sign up for". Sentence: "Open the app and begin. What you do here stays on your phone." Button "Begin".

How it behaves:
- "Seen" is kept under `ywm:welcome:v1` and read with the other preferences before the splash goes, so Home never flashes first. It is written when "Begin" or "Skip" is pressed, not when the welcome opens: someone who closes the app halfway sees it again next time.
- After the welcome, Home opens on the billboard.
- The system back button on the first screen leaves the app; on the others it goes to the previous screen.
- No permission is asked here, and nothing else pops up.
- Under reduce motion the screens change with a short fade, no slide.
- At 360 × 640 with the phone's text at 1.3, the words must fit or scroll; they never clip.

## 3. You (`app/me/`)

`app/me/index.tsx` becomes a settings page in the phone's theme. Phase 4 will put the person's numbers and week between the title and the settings: leave the page so that they can slot in. From the top, after the back button and the title "You":
- **Appearance**, as today.
- **Reduce motion**: a row with a switch, "Reduce motion", and under it "Fewer moving parts. Your phone's own setting is always followed too." Saved under `ywm:reduce-motion:v1` and read before the splash goes. `useReduceMotion()` (`src/lib/motion.ts`) answers yes when the phone's setting **or** this switch is on, so everything that already asks it (arriving, breathing, pressing, the billboard's parallax) follows at once. Check that nothing animates without asking it.
- **About** and **Privacy**: two rows with a chevron.
- In the preview app only, at the very bottom: "Design gallery", as today.

Make one part for these rows, `SettingsRow` in `src/ui/`: a label, an optional line under it, and on the right either a switch or a chevron; at least 56 high; the whole row is the touch target; a switch row has `accessibilityRole="switch"`. Phases 4 and 10 add rows with it. Show it in the gallery.

**About** (`app/me/about.tsx`):
- The app's name in `h1`, then one sentence: "Made for {teacher}'s students, and for anyone who wants to begin."
- A `Card` titled "Look after yourself", with exactly these words: "Everything here is general guidance, not medical advice. If you are pregnant, injured, unwell, or unsure whether a practice is right for you, ask a doctor first. Stop if something hurts or makes you feel worse." Google expects such a notice in a fitness app, so it must stay easy to find.
- **Which copy of the app this is**, in `meta`: "Version 0.1.0". In the preview app, a second line that tells me which code I am running: "Update of 17 November, 15:48" when an over-the-air update is running, or "The code that came with this build" when none is; then the first 7 characters of the build's fingerprint (its runtime version). On the web: "Web preview". Use what Expo already gives (`expo-constants`, `expo-updates`); add `expo-application` only if you need it. This line is how I will check, after Phase 4, that an update reached my phone.
- "Show the welcome again": a quiet button. It forgets `ywm:welcome:v1` and opens the welcome.
- "Open-source licences" → `app/me/licences.tsx`: a plain list of the libraries the app ships with and the two fonts (SIL Open Font License), each with its licence's name. Make it with a small script from the installed packages, and keep it from going stale: the check fails when a dependency is missing from the list.

**Privacy** (`app/me/privacy.tsx`), and the same text on the website:
- The text is `docs/legal/privacy-policy.md`, rewritten today: it now says what the app does after Phases 3 and 4, and nothing more. Turn it into blocks at build time with the same Markdown code as the content build, and draw it with `RichText`.
- The same text becomes `privacy.html` at the root of the website, made by `npm run build:site` in the look of `site/index.html`, and linked from that page. Google will ask for this address in Phase 11: `https://invinciricker.github.io/yoga-app/privacy.html`.
- Fill the placeholders from `site`: `{appName}`, `{teacher}`, `{contactEmail}`, `{publisher}`; and `{updated}` from the file's own `updated:` line, written as "17 November 2026". Add `publisher` (optional, 60 characters at most: the name Google Play will show as the developer) to `siteSource` and to `site` in `contentFile`, in a `protected:` commit, and describe it in `docs/CONTENT.md`. A missing value shows as "(not set yet)". `npm run content:build -- --release` fails while `contactEmail` or `publisher` is missing, with a sentence that says which.

## 4. Two small things that protect privacy

- **The public app never asks Expo for updates.** In `app.config.ts`, the production variant sets `updates.enabled: false`; the preview variant keeps updates as they are. Reason: `docs/ARCHITECTURE.md` decision 9 (the public app changes only through the store), and the privacy page, which names no Expo. Check the setting in the SDK 58 docs.
- **The website stops loading fonts from Google.** `site/index.html` (and the new `privacy.html`) use the same font files the app bundles, served from the site itself. A page about privacy should not send its readers to a third party.

## Check before the pull request

`npm run check`, with the new tests. Pictures at 390 × 844 in `docs/screens/phase-3/`, in both themes where the page follows the theme: `/maria` twice (with the sample content, and with a temporary local copy of `content/studio/studio.md` where every field is filled in: do not commit it), the three screens of `/welcome` (dark only), `/me`, `/me/about`, `/me/privacy`, `/me/licences`, and `/` once more. Look at each one next to the "Studio" mockup.

## Watch out for

The cases most likely to go wrong for a real person. Each deserves a test or a picture.
1. Maria's page with only a name: no empty heading, no lonely hairline, no gap where a block was.
2. Long values: a 40-letter name and an 80-letter tagline over the portrait with the text at 1.3; an address of 120 letters; 21 classes over seven days.
3. A contact link with nothing to open it: WhatsApp not installed (wa.me falls back to the browser by itself), `tel:` on a tablet, anything on the web.
4. The welcome on a very first launch with no network and nothing saved: it still shows, with the names from the copy bundled in the app.
5. Reduce motion switched on in the app while the phone's own setting is off: nothing scales, rises or breathes anywhere.

## Not in this phase

Marking done, the week, saving, the closing screen, "Delete my data" (Phase 4). Any permission. Maria's content: `content/` is not touched in a phase; her real details arrive through a content pull request.

## In the pull request

"Does this need a new build?": yes (Expo's fixes; the production setting). "To test on your phone": run "Android build" once and install over the old app. Open it: the welcome. Begin: the billboard. Meet Maria. Then You → Reduce motion, About (read the version line out to me), Privacy; About → "Show the welcome again". Give the web preview addresses of Maria's page and of `privacy.html`. Then tell me the one thing only I can do: **send Maria's real details as content** (her photo, a few sentences in her words, her class days and times, the place, how to reach her), with the "adding content" message of `docs/PLAN.md`. Until then her page shows sample text.
