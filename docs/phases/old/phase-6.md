# Phase 6: "The Play Store"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md` and `docs/PLAY-STORE.md` (the owner's guide: you prepare everything it tells him to upload or answer). This phase can start any time after Phase 3; the owner may ask for it before Phases 4 and 5, because Google's closed test lasts 14 days and the later phases can ship during it.

## In one paragraph

Your part is everything that can be prepared in the repository: the real icon and splash, the store pictures and texts, the production build, and a release check that refuses to build while anything unfinished remains. The owner's part is in the Play Console, click by click, in `docs/PLAY-STORE.md`. At the end he holds an `.aab` file accepted by Google on the internal test track, and a folder with every picture and text the listing needs.

## What the owner has already done

Decided the **final name** and the **package name** (given in the prompt; if Phase 5 is done they are already in place), and started his Google Play developer account (`docs/PLAY-STORE.md`, steps 1 and 2).

## 1. Name, icon, splash

- Put the final name and package in the one constant of `app.config.ts`. `version: '1.0.0'`.
- **The icon** (`tools/brand/`, made with `sharp` from SVG you write, so it can be regenerated): a night ground (`#0C1311` to `#16302A`, top to bottom), a low gold disc (`#F3D592`) with a soft halo, and under it one thin ivory arc, like a horizon or the edge of a mat. No letter, no figure in a pose, no lotus. It must read at 48 pixels: check it small.
  - `icon.png` 1024 × 1024; Android adaptive icon: `foreground` (the disc and the arc inside the central 66%), `background` (the ground), `monochrome` (disc and arc, flat).
  - Splash: the ground colour with the disc alone, small, in the centre.
- Show three variations of the icon in the pull request (the position of the disc and the weight of the arc) and use the first; the owner may pick another.

## 2. The store folder (`store/`)

- `store/icon-512.png` (512 × 512, PNG, 32-bit, under 1 MB) and `store/feature-graphic.png` (1024 × 500: the `dusk` aura at full width, the app's name in Cormorant on the left, nothing else).
- `store/screenshots/`: five phone pictures, 1080 × 1920, made with the shots tool from the web mirror with the real content: Today, a lesson, Practice, After practice, Studio. No device frame, no added slogans. If Maria's real content is not in yet, stop this step and say so: sample content must never be in the listing.
- `store/listing.md`, drafted for the owner to edit: the title (30 characters at most), the short description (80 at most), the full description (4,000 at most; aim for 150 words: what is inside, that it is free and needs no account, who Maria is in one sentence from her introduction), and "What's new" for 1.0.0. Plain, warm, true. No health promise ("relieves", "cures", "treats"), no "best", no other app's name, no emoji.
- `store/data-safety.md`: go through the code and list exactly what leaves the phone (expected: the reaction: lesson slug, difficulty, feeling; the notification token; nothing else; YouTube's player is a third party when a video plays). Compare with the answers in `docs/PLAY-STORE.md`, "Data safety", and flag any difference in bold at the top of the pull request. Also list the Android permissions of the production build (from the merged manifest in the build output, or `npx expo config --type introspect`): expected are internet access, notifications, vibration and little else. Anything about location, contacts, camera, microphone, storage or the advertising ID (`AD_ID`) must not be there: find which library adds it and remove or block it.

## 3. The release check

- `npm run release:check` runs: `npm run check`; the content build with `--release` (fails on any `sample: true`); a scan that fails on `TODO(owner)` left in `app.config.ts` or `src/config.ts`, on an empty `contactEmail` in `content/site.yaml`, on a missing `site/privacy.html` or `site/delete-my-data.html`, and on the `?demo` and `?backend=fake` switches being reachable in the production variant.
- `android-build.yml` runs `release:check` before a `production` build and stops if it fails.
- If Phase 4 is not built yet, write `site/delete-my-data.html` now (everything is on the phone: uninstalling or "Delete my data" erases it), and let Phase 4 extend it.
- In About, add "Share the app" (the system share sheet with the Play Store address built from the package name). 
- Write "Releasing" in `docs/TECH.md`: how the version name and the version code work, how to run the production build, where the `.aab` appears, and what to do when Google raises the required Android target (once a year: move to the newest Expo SDK and rebuild).

## 4. After the first upload (only if the owner asks)

Set up `eas submit` so later versions go to the internal track without the browser: the Google service account key is uploaded by the owner on expo.dev (never in the repository); add a `submit` job to `android-build.yml` behind an input that is off by default. Expo's own pages disagree on whether the very first upload can be automatic, so the guide tells the owner to do the first one by hand.

## Check before the pull request

`npm run release:check` (it is allowed to fail on things only the owner can supply: list them); the icon at 48, 96 and 512 pixels side by side in `docs/screens/phase-6/`; the five screenshots.

## Not in this phase

Paid features, ads, an in-app review prompt, analytics for the store. Do not add the Play Billing library.

## In the pull request

"In short", then **"What I need from you"**: a numbered list of what only the owner can do, each with where to click, in the order of `docs/PLAY-STORE.md`. Then "To test on your phone": run the `production` build, install it from the internal test track once Google has it, and go through the whole app once as a stranger would.
