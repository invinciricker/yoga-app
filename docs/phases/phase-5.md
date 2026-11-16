# Phase 5: "Notifications"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md` and Expo's current guides for `expo-notifications` (setup for Android with FCM V1, and sending with the Expo push service) before writing anything: this area changes often. Phase 4 must be merged.

## In one paragraph

Two kinds of gentle nudges. **From Maria**: when she publishes a lesson or a journal entry marked `notify: true`, the people who said yes get one notification, once, at a civil hour; tapping it opens that lesson. **For yourself**: an optional daily reminder at an hour the person chooses, which stays entirely on the phone. Nobody is asked for permission before they have finished a first lesson.

## What the owner has already done

The steps of `docs/OWNER-SETUP.md`, "Before Phase 5": **the final name of the app and its package name are decided** (they can never change after this); a Firebase project with two Android apps (the production package and the `.preview` one); the `google-services.json` file stored in Expo as a secret file variable named `GOOGLE_SERVICES_JSON` for both build profiles; the FCM V1 key uploaded to Expo's credentials for both packages; the GitHub secret `SUPABASE_SECRET_KEY` and the GitHub variable `NOTIFY_TIMEZONE` (for example `Europe/Paris`). He tells you the final name and package in the prompt. If the Firebase part is missing: build everything, keep the "From Maria" switch hidden behind a config flag that is off, ship the daily reminder (it needs none of this), and say so at the top of the pull request.

## 1. In the app (`src/notifications/`)

- Install `expo-notifications` and `expo-device` with `npx expo install`; add the config plugin with a small white monochrome icon (the disc of the app icon, flat white on transparent, made with `sharp`) and the accent colour `#E3B45E`. `android.googleServicesFile` reads `process.env.GOOGLE_SERVICES_JSON`.
- Two Android channels, created at launch: `maria` ("New from Maria", default importance) and `reminder` ("Practice reminder", default importance, no sound).
- **Asking.** The first time an After practice screen is closed, and only then, a bottom sheet rises: a `candle` aura strip, "A quiet nudge?" in `h2`, one sentence ("We can let you know when Maria shares something new. Never more than one a day."), a gold "Yes, tell me" and a quiet "Not now". "Yes" triggers the system permission; "Not now" is remembered and the sheet never returns by itself. The same choice lives in My practice → Settings as the switch "New from Maria".
- **Token.** On yes and permission granted: get the Expo push token (with the project ID), `ensureSignedIn()`, `rpc('register_push_token', { p_token, p_platform: 'android', p_enabled: true })`. Switch off: the same call with `false`. At each launch with the switch on, send the token again if it changed. Permission refused in the system settings: the switch shows off with one sentence and a "Open settings" button.
- **Tapping.** A notification carries `data.url` (for example `/lesson/evening-wind-down`). Open it with the router, also when the app was closed (`getLastNotificationResponseAsync`). An address the content does not know opens Today.
- **Daily reminder.** A second switch, "Daily reminder", with a time (default 19:00, the platform time picker). On: one repeating local notification on the `reminder` channel: title "Your mat is waiting", body "Ten quiet minutes?". When a lesson is done before the reminder's hour, today's reminder is skipped (cancel and schedule again from tomorrow). Changing the hour reschedules. This needs the permission too: ask for it through the same sheet wording if it was never asked.
- Neither switch exists on the web mirror (`.web.tsx` twins that render nothing).
- "Delete my data" also switches both off and cancels the local reminder.

## 2. Sending (`tools/notify/`, run by GitHub)

`tools/notify/send.ts`, Node + TypeScript, no library beyond `@supabase/supabase-js`:
1. Read `content/` with the same loader as the content build. Candidates: lessons and journal entries with `notify: true`, not drafts, `published` today or in the last 3 days. Their keys: `lesson/<slug>`, `journal/<slug>`.
2. With the secret key, read `sent_notifications` and drop candidates already there. Nothing left: stop.
3. **Civil hours, and once a day.** If the hour in `NOTIFY_TIMEZONE` is before 08:00 or after 20:59, or if a row of `sent_notifications` already carries today's date in that time zone, stop without recording anything: a later run will send. The app promises "never more than one a day".
4. Read the enabled tokens. Build ONE message for everybody: one candidate → title "New from Maria", body its title, `data.url` its page; several → body "3 new things to explore", `data.url` `/`. Channel `maria`.
5. Send through the Expo push service in batches of 100. Wait 30 seconds, fetch the receipts, and delete every token reported `DeviceNotRegistered`.
6. Insert one row per candidate in `sent_notifications` with the number of recipients. If step 5 failed entirely, record nothing so that the next run retries.
7. Print a short plain summary. Never print a token or a key.

`notify.yml`: runs after a successful `pages.yml`, and every hour from 07:00 to 21:00 UTC as a safety net (the script itself decides by time zone). Ends quietly when `SUPABASE_SECRET_KEY` is missing. `--dry-run` prints what would be sent and sends nothing: the default when the workflow is started by hand.

Tests (no network; inject fakes): nothing is sent twice; nothing at 3 a.m.; several items become one message; a failed send records nothing; an old item (4 days) is never sent.

## Check before the pull request

`npm run check`; shots of the sheet and of Settings. On a real build, the owner must test, because the web mirror cannot.

## Not in this phase

Marketing messages, badges on the icon, anything sent on a schedule from the server, notifications about streaks. One nudge from Maria at most per publication, one reminder a day at most, both off until asked for.

## In the pull request

"To test on your phone". A new build is needed (say so first). Then: finish a lesson, say yes on the sheet; ask the owner to merge a content pull request for a test lesson with `notify: true` and `draft: false`, published today; the notification arrives within a few minutes during the day; tap it; then delete the test lesson with a second content pull request. For the reminder: set it two minutes ahead and wait. Remind the owner that the preview app and the store app receive separately.
