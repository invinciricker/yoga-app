# How Yoga with Maria is built

Written by Claude chat, 16 Nov 2026. The owner's map of the work: who does what, how a change travels, what to paste to start each phase, and every decision taken so far. For what the pieces *are*, read `docs/START-HERE.md` first.

## Who does what

| Who | Does | Does not |
|---|---|---|
| **Ricky** (the owner) | Decides, sets up the accounts, tests on his phone, merges, talks to Maria | Write code |
| **Maria** | Films, writes, uploads her videos to YouTube, tells Ricky what she wants; later tests the app and reads her totals | Touch GitHub |
| **Claude chat** (the project "yoga app with Maria") | The architect: decisions, design, briefs, formats. Already done for version 1. Come back for a new brief, a design change, or a hard problem. | Write app code |
| **Claude Code**, on a cheaper model | The builder: one fresh session per phase, builds exactly the brief, opens one pull request | Redesign, or change the protected files without saying so |
| **Any Claude with the repository** | Adds content by following `docs/ADDING-CONTENT.md` | |

## The rules

1. Nothing reaches `main` except through a pull request that Ricky merges. (The very first commit, the blueprint, went straight to `main` because the repository was empty.)
2. `main` feeds the preview app and the web preview. The public app changes only through a store release. Exception: `content/` on `main` is live for everyone.
3. Some files are protected (list in `CLAUDE.md`). The builder may add to them in a separate, clearly named commit, never change what exists, and must say so at the top of the pull request.
4. One fresh Claude Code session per phase. A long session costs more and gets confused.
5. The repository is public: no keys, no passwords, nothing personal about a student.

## Starting a phase

1. Do the steps for that phase in `docs/OWNER-SETUP.md`, if any.
2. Check that the brief exists (`docs/phases/phase-N.md`) and that "State" in `CLAUDE.md` lists the phases before it as done. (The builder updates "State" at the end of each phase.)
3. Open a new Claude Code session on `invinciricker/yoga-app`, choose the cheaper model, and paste the message below.
4. When the pull request arrives: read "In short", merge, and follow "To test on your phone".
5. Tell the same session what is wrong, if anything. When you are happy, close it.

**New builds and updates** (added 19 Nov 2026, after a mix-up):
- Run "Android build" **only** when the pull request says "Does this need a new build? Yes", and only once.
- A build never changes your phone by itself. When Expo has finished it, open the link from the run's Summary page **on your phone**, and install the app from it, over the old one.
- When the pull request says "No", do not run a build: the new code reaches the app by itself. Close the app fully (swipe it away from the recent apps) and open it, twice. You → About then shows "Update of" and the date.
- A build made after an update already contains that update, so About will rightly say "The code that came with this build".

**The message to paste** (since 17 Nov 2026, evening; fill in the bracket):

```
Read CLAUDE.md, then build Phase [N] as docs/phases/phase-[N].md says.
Work on a branch, run the checks, look at your own screens before asking me to,
and open one pull request. I am a beginner: tell me exactly what to click.
```

Some phases need values only you have. Add them under the first line when the brief asks:
- Supabase project address and publishable key (Phase 9).
- Final app name and package name (before Phase 10, or before the first upload to Google in Phase 11, whichever comes first).

**Adding content** (any time after Phase 1):

```
Follow docs/ADDING-CONTENT.md. Here is what Maria sent: [paste her text, attach her photos,
paste the YouTube link]. It is [a new lesson / a tip / a note / a change to her page].
[Publish it / Keep it as a draft so I can look first.]
```

**Spending little.** The briefs are written so the builder does not have to think about *what* to build, which is the expensive part. Keep it that way: one phase per session; do not ask the builder to "improve the design" in general (ask for one named thing); for content use the cheapest model; if the builder fails the same check three times, stop it and ask for a plain explanation before it burns more.

## The phases
**Replaced on 17 Nov 2026: the current phases are in `docs/V2.md`.** The table below is the plan of 16 Nov, kept for the record.

| # | Name | At the end you can… | You do first | New build? |
|---|---|---|---|---|
| 0 | The shell | See the look on your phone, four tabs, the design gallery | Expo account, token, Pages switch | Yes, the first |
| 1 | Content and reading | Browse lessons, play a video, read the journal, offline | | Yes |
| 2 | Studio and welcome | Show Maria her page | Send Maria's real details as content | Maybe |
| 3 | My practice | Mark done, answer how it felt, light candles, save lessons | | No |
| 4 | Feedback reaches Maria | Maria sees totals per lesson | Supabase project | Maybe |
| 5 | Notifications | Get a nudge when Maria posts; set a daily reminder | **Final name and package**, Firebase | Yes |
| 6 | The Play Store | Have the app in Google's tests, then public | Play developer account, 12+ testers | Yes, production |

Phase 6 can begin as soon as Phase 3 is merged: the 14-day closed test runs while Phases 4 and 5 are built and shipped to the testers. If you do that, decide the final name and package before the first upload to Google.

After version 1: `docs/phases/later.md`.

## Decisions

- **16 Nov 2026** · A real Android app on Google Play first, built with Expo so that an iPhone version stays possible. Not a wrapped website.
- **16 Nov 2026** · Open to anyone, free, in English. No sign-up: the app opens straight onto the lessons.
- **16 Nov 2026** · Budget €0 a month. Only the $25 Google fee. Free plans everywhere, with their ceilings written down.
- **16 Nov 2026** · Content is published in phases: first by Ricky through Claude (files in `content/`), later by Maria from her phone (Phase 8). Either way the lessons live outside the app and never need a store update.
- **16 Nov 2026** · Videos start on YouTube (free, any length, Maria can do it alone). Our own hosting, which is what makes offline viewing possible, comes in Phase 7. So "offline downloads", chosen for version 1, is honestly a later phase; reading offline works from Phase 1.
- **16 Nov 2026** · Feedback is one tap after a lesson (too gentle, just right, too much) and an optional feeling. No messages and no comments in version 1. Maria sees totals, never names.
- **16 Nov 2026** · Extras kept for version 1: progress and streaks (the week of candles), notifications, the in-person class schedule. The Studio tab is Maria's shop window: who she is, why yoga, her classes, how to reach her.
- **16 Nov 2026** · Look: "deep and moody". A forest-at-night ground, ivory text, candlelight gold. Cormorant Garamond for titles and Maria's voice, Figtree for the rest. Covers without a photo are "auras", small night scenes made of light. Designed fresh for this app; nothing is carried over from Promo MAPST.
- **16 Nov 2026** · The work is split as in the table above. All briefs for version 1 are written in advance so the builder can run on a cheaper model without the architect.
- **16 Nov 2026** · Working title "Yoga with Maria", placeholder package `com.yogawithmaria.app`.
- **16 Nov 2026** · Small backend: Supabase (reactions, notification tokens, Maria's sign-in). Chosen over Firebase because one free account also gives the server functions and storage that Phase 8 needs. Firebase is still needed in Phase 5, only as Android's notification pipe.
- **17 Nov 2026** · Version 2 of the plan: see "Decisions" in `docs/V2.md`.
- **17 Nov 2026, evening** · The builder gets more freedom; Phases 3 and 4 briefed together; the architect now delivers briefs as pull requests. See "Decisions (17 Nov 2026, evening)" in `docs/V2.md`.
- **19 Nov 2026** · Phases 5 and 6 briefed: the Journal (free pages and Gratitude, then Habit and Health). Both arrive over the air. See the two "Decisions (19 Nov 2026)" lists in `docs/V2.md`.

## Decisions waiting for the owner

- **The name and the package name.** Needed before Phase 10 (notifications) or before the first upload to Google (Phase 11), whichever comes first. The name can change later; the package name never can, and it shows in the store address: `play.google.com/store/apps/details?id=<package>`. Ask Maria what she wants to be called. A neutral package such as `com.yogawithmaria.app` survives a rename of the app.
- **Whose developer account.** Yours or Maria's. Google shows the account holder's legal name and country on the store page. If Maria should be the public face, either she opens the account, or you open it and accept that your name is shown. An app can be transferred to another account later.
- **"Trader" or not.** Google asks whether you publish as a business (a "trader", in EU law). A trader's address and phone are shown publicly. The app is free but it advertises Maria's paid classes, so this is not obvious. Read Google's own page on it before answering; Claude is not a lawyer and neither answer is safe to guess.
- **Maria's videos: unlisted or public on YouTube.** Unlisted keeps them for the app; public also makes them findable on YouTube, which is free advertising. It can differ per video.
- **The contact email** shown on the privacy page and on the store listing. It is public. A dedicated address is wiser than a personal one. It goes in `content/site.yaml` as `contactEmail`, together with `publisher`, the name the store will show (Phase 3 adds that field).
- **Where the students are**, for the hour notifications may be sent (`NOTIFY_TIMEZONE`, Phase 10).

## Not certain: to check when you get there

These were true or unclear on 16 Nov 2026 and can change.
- Whether Expo's build service can create the Android signing key by itself on the first automatic build. If not, it is a one-time click on expo.dev (the Phase 0 brief covers both cases).
- Whether the first upload to Google can be automatic. Expo's own pages disagree. The guide assumes the first upload is done by hand in the browser, which always works.
- How Google wants the YouTube player declared in the "Data safety" form. The guide gives a careful answer and says where to check.
- The exact names of buttons on Expo, Supabase, Firebase and the Play Console. They are renamed often. When a label in `docs/OWNER-SETUP.md` does not match, send a screenshot to Claude and ask where it went.
- Google's rules themselves: the 12 testers for 14 days, the required Android version (Android 16, API level 36, for anything submitted since 31 August 2026), the forms. Each is linked to Google's own page in `docs/PLAY-STORE.md`.
