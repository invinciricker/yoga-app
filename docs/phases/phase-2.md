# Phase 2: "Studio and welcome"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md` and, in `docs/DESIGN.md`, the paragraphs "Studio", "Welcome" and "My practice". Phase 1 must be merged. The content comes from `studio` in `content.json` (format: `docs/CONTENT.md`, "Maria's page").

## In one paragraph

The app becomes Maria's shop window. The Studio tab presents her, says why yoga is worth it, lists her in-person classes with the place, and lets someone contact her in one tap. A three-screen welcome greets people the first time. A "My practice" page appears behind the round button on Today, for now holding only the settings and the about pages. After this phase the app can be shown to Maria and to anyone.

## 1. Studio (`app/(tabs)/studio.tsx`)

Match the mockup. Every block is hidden when its content is missing; with the sample content only the name, the introduction and "Why yoga" show, and that must still look finished.
- **Portrait**: full width, 500 high, under the status bar. Her photo when there is one (the top of the photo matters: `contentPosition` top), otherwise the `ember` aura. Over the scrim: overline "Your teacher", her name in `display`, the tagline.
- **Introduction**: the body blocks in `bodyLarge`.
- **Why yoga**: the benefit cards, 210 wide, scrolling sideways with the next one peeking. Map the `icon` words to lucide icons: `moon` → Moon, `feather` → Feather, `wind` → Wind, `heart` → Heart, `sun` → Sun, `leaf` → Leaf; an unknown word → Sparkles.
- **Classes with Maria**: one card. Group by day, in week order starting from today's weekday, so the next class is first. Today's day name in gold. Times shown as written (24-hour clock), "18:30 – 19:45". A pure function `nextClass(classes, now)` with tests (same day later, same day already past, wraps around the week, no classes).
- **Place**: name, address, "Open in Maps" (opens `mapsUrl`; without it, a maps search for the address through `Linking`).
- **Price line**: `pricing`, as body text.
- **Contact**: the gold button is "Message Maria" → WhatsApp (`https://wa.me/<digits>`), else email (`mailto:`), else it is not shown. Ghost buttons, in this order and only if filled: Call (`tel:`), Instagram (`https://instagram.com/<handle>`), Website. If a link cannot be opened, say so in one sentence; never fail silently.
- **Today** gains the Studio card at the bottom: the portrait in a 64 circle (or a small `ember` aura), "Practise with Maria in person", and under it the next class ("Tuesday 18:30 · Evening flow") or, without classes, the tagline. Tapping it opens the Studio tab. Hidden when there is neither a class nor a location.

## 2. Welcome (`app/welcome.tsx`)

The three screens of `docs/DESIGN.md`, "Welcome", with the exact words given there (replace "Maria" and the app name with the values from `site`). Shown once, before the tabs, the first time the app opens (`ywm:welcome:v1` in storage). The system back button on the first screen leaves the app. No permission is asked here.

## 3. My practice, for now (`app/me/`)

- The round button on Today opens `app/me/index.tsx`: title "My practice", then only the **Settings** rows that exist today: "Reduce motion" (a switch; stored; `PressableScale`, the arriving animation and the breathing all obey it, on top of the system setting), "About" and "Privacy".
- **About** (`app/me/about.tsx`): the app name, the version and build number (`expo-application`), one sentence ("Made for Maria's students, and for anyone who wants to begin."), then a `Card` titled "Look after yourself" with these exact words: "These lessons are general guidance, not medical advice. If you are pregnant, injured, or unsure whether a practice is right for you, ask a doctor first. Stop if something hurts." (Google requires such a notice in a fitness app, so it must stay easy to find), "Show the welcome again", and "Open-source licences" (a plain list generated at build time from `package.json` dependencies with their licence names).
- **Privacy** (`app/me/privacy.tsx`): the text of `docs/legal/privacy-policy.md` drawn with `RichText` (convert it to blocks at build time with the same Markdown code as the content build), with the placeholders filled from `site` when available. The same text becomes `site/privacy.html` on the website, built by `build:site`.
- In the preview variant, "Design gallery" moves from the bottom of Today to the bottom of this page.

## Check before the pull request

`npm run check`; shots of `/studio`, `/welcome`, `/me`, `/me/about`, `/me/privacy`, and `/` again. Check Studio twice: with the sample content, and with a temporary local copy of `studio.md` where every field is filled (do not commit that copy).

## Not in this phase

Progress, streaks, saving, the reaction (Phase 3). Notifications (Phase 5). Do not ask for any permission.

## In the pull request

"To test on your phone": reopen the preview app twice; you should see the welcome (if not: My practice → About → "Show the welcome again"). Open Studio. Then tell the owner the one thing only he can do: **send Maria's real details through a content pull request** (`docs/ADDING-CONTENT.md`: her photo, introduction, class times, place, contact), because until then Studio shows sample text. Say whether a new build is needed (yes if `expo-application` was not yet installed).
