# Start here: the lay of the land

Written by Claude chat for Ricky, 16 Nov 2026. Read this once, slowly. It explains what everything is, why it is there, and what happens when. You do not need to remember it: come back when a word confuses you (there is a glossary at the end).

> **Updated 17 Nov 2026 (evening).** The app grew in version 2 (`docs/V2.md`): five tabs, a light theme, and breathing, meditation and a private journal next to Maria's lessons. The phases were renumbered: the current list is the table in `docs/V2.md`. Maria's page and the welcome are now Phase 3, "My practice" is Phase 4, Supabase is Phase 9, notifications Phase 10, the Play Store Phase 11. Everything else on this page still holds where it does not name a phase.

## The 60-second version

- You are making a real Android app. It is written once in a toolkit called **Expo**, which can also produce an iPhone app later from the same code.
- The app is a **shell**: screens, buttons, a video player. Maria's lessons are **not inside it**. They sit on a small free website, and the app downloads them. So adding a lesson takes minutes and never needs Google's permission.
- A cheap Claude model **builds** the app phase by phase from briefs that are already written. You test each phase on your phone and press "merge".
- Getting on the Play Store costs **$25 once**, needs your ID, and takes **about a month** the first time, mostly waiting: Google makes new developers run a 14-day test with 12 people first. Maria's students are those 12 people.

## The cast: who and what is involved

| Name | What it is | What it does for you | Cost |
|---|---|---|---|
| **GitHub** | Where the project's files live (you know it already) | Stores every version. Also runs **Actions**: small robots that check, build and publish each time you merge. | Free |
| **GitHub Pages** | A free website made from the repository | Serves Maria's lessons and photos to the app, a web preview of the app, and the privacy page Google asks for | Free |
| **Claude Code** | Claude working inside the repository, in the cloud | The builder. Writes the code, opens pull requests. | Your Claude plan |
| **Expo / EAS** | The toolkit, and its cloud service | Turns the code into an installable Android file. Without it you would need a powerful computer and Android Studio. | Free plan: 15 Android builds a month |
| **Google Play Console** | Google's website for app developers | Where you upload the app, describe it, run the tests, and publish | $25, once |
| **YouTube** | You know it | Stores and plays Maria's videos, at any length, from her phone | Free |
| **Supabase** (Phase 4) | A small online database | Receives the one-tap answers ("too gentle / just right / too much") and shows Maria the totals | Free plan |
| **Firebase** (Phase 5) | Google's service for apps | Only used as the pipe that Android notifications must pass through | Free |
| **Cloudflare** (later) | Storage for files | Our own video hosting, which allows offline viewing | Free up to 10 GB, card required |

## How this differs from a website

With a website, you change a file and everyone sees it. An app has three extra ideas.

1. **It must be built.** The code is compiled into one file. An **APK** is the file you can install directly on a phone (for testing). An **AAB** is the file Google wants for the store. Expo's servers do this; it takes 10 to 20 minutes, plus waiting in the free queue.
2. **It must be signed and named.** Every app has a **package name**, a permanent identifier like `com.yogawithmaria.app`. It can never be changed after the first upload to Google, and it appears in the store address forever. It is separate from the name people see, which you can change any time. The app is also **signed** with a secret key so that only you can publish updates; Expo keeps that key for you.
3. **It is reviewed and it lingers.** Google checks every version before it goes public (hours to days). And once people install it, they keep old versions for months. That is why the briefs keep repeating "old versions must keep working".

This is exactly why the lessons live outside the app: content travels like a website (instant), and only the shell travels like an app (slow, reviewed).

## The three things that can happen

**You merge a code change** (a phase, a fix):
GitHub checks it → publishes the web preview → sends the new code to the **preview app** on your phone (reopen it twice to see it). The public never sees this. If the change touched the app's "native" parts, the builder tells you to press one button to make a new build.

**You merge a content change** (a lesson, a photo, new class times):
GitHub checks it → rebuilds the content → a few minutes later **every phone** has it, including the public app. This is the one kind of merge that is live at once. Drafts (`draft: true`) are only visible in your preview app.

**You release to the store** (rare, deliberate):
You press "Run workflow → production" on GitHub → Expo produces the AAB → you upload it in the Play Console → Google reviews → people get the update.

Two apps will sit on your phone: **Yoga (preview)**, which follows every merge, and later the real one from the Play Store. They do not disturb each other.

## Your road

| Step | What you get | Waiting for |
|---|---|---|
| **Today** | Start your Google Play developer account (identity check takes days). Ask Maria for: a portrait, three sentences about herself, her class times and place, and 3 to 5 lesson videos uploaded to YouTube. | Google, Maria |
| Phase 0 | The look on your phone: splash, four tabs, the design gallery | one build |
| Phase 1 | A real app: lessons, video, journal, works offline | |
| Phase 2 | Maria's page and the welcome. **Show it to Maria.** | Maria's real content |
| Phase 3 | Mark as done, "how did that feel", the candles | |
| Phase 6, part 1 | The app on Google's **internal test**, then the **closed test** with 12+ of Maria's students | 14 days, by Google's rule |
| Phases 4 and 5 | Answers reach Maria; notifications. Shipped to the testers during the 14 days. | |
| Phase 6, part 2 | You apply for production; Google reviews; the app is public | Google |

The phases are in `docs/phases/`. How to start each one, with the exact message to paste, is in `docs/PLAN.md`. What to click on each website is in `docs/OWNER-SETUP.md`. The Play Store, step by step, is in `docs/PLAY-STORE.md`.

## Money

| | Cost |
|---|---|
| Google Play developer account | $25, once |
| Everything else in version 1 | €0 |
| Optional, later: a domain name (a permanent address for the content, and needed for our own video hosting) | about €10 a year |
| Optional, later: iPhone | $99 a year to Apple |
| Building with Claude | One fresh session per phase on a cheaper model. Adding content is a much smaller job than a phase. |

The free plans have ceilings (listed in `docs/phases/later.md`). None is close for a teacher's app; the first one you might meet is Expo's 15 builds a month, which is why the preview app updates itself without a build whenever it can.

## What can go wrong, and what to do

| What you see | What it means | What to do |
|---|---|---|
| A red cross on a pull request | A check failed. Nothing is broken on any phone. | Click "Details", copy the message, give it to the Claude Code session: "the check failed with this, fix it". |
| The preview app did not change after a merge | It loads updates on the *second* opening, or this change needs a new build | Close and reopen twice. Then read "Does this need a new build?" in the pull request. |
| The build waits a long time | The free queue | Wait. Up to an hour happens. |
| The builder is going in circles | The same error three times | Stop it. Say: "Stop. Explain in plain words what is blocking you and what the options are." Take that to a stronger model if needed. |
| A lesson looks wrong in the app | A content mistake | Fix the file with a content pull request, or revert the merge on GitHub ("Revert" button on the merged pull request). |
| Supabase emails "your project will be paused" | Nobody used it for a week | The keepalive job should prevent it. If it happens: open the dashboard, press "Restore". Nothing is lost. |
| Google rejects something | Usually a form answer or a missing page | Read their email slowly, give it word for word to Claude, and fix exactly what it names. It is normal on a first app. |

## Glossary

- **AAB / APK**: the two kinds of Android app file. AAB for the store, APK for installing directly.
- **Branch**: a separate copy of the project where work happens without touching the real one.
- **Build**: turning the code into an app file. Slow, limited to 15 a month on the free plan.
- **Channel** (`preview`, `production`): which app receives which over-the-air update.
- **Closed test**: Google's 14-day test with at least 12 people you invite. Required once for new personal accounts.
- **Commit**: one saved change in the project's history.
- **Content**: Maria's lessons, tips, photos, class times. Files in `content/`.
- **EAS**: Expo's cloud service that builds the app.
- **Expo / React Native**: the toolkit the app is written in.
- **Internal test**: Google's quick track for up to 100 testers, with no review. For you and Maria.
- **Main**: the real version of the project. Here it feeds the preview app, not the public.
- **Merge**: accepting a pull request into main.
- **Over-the-air update (OTA)**: new code sent straight to an installed app, without the store. Used for the preview app only.
- **Package name**: the app's permanent identifier. Decide it carefully, once.
- **Play Console**: Google's website where you manage the app.
- **Pull request (PR)**: a proposal to put a branch into main. You read its summary, test, and merge.
- **Secret**: a password for a robot (for example `EXPO_TOKEN`). Stored in GitHub's settings, never in a file.
- **Slug**: the short permanent name of a lesson, like `evening-wind-down`.
- **Track**: a stage in the Play Console: internal → closed → production.
- **Version code**: a number that goes up with every upload to Google. Automatic.
- **Workflow**: one of the GitHub robots. You start some by hand with "Run workflow".
