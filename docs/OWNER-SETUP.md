# Owner's setup: what to click, phase by phase

Written by Claude chat for Ricky, 16 Nov 2026. Only you can do these: they need your accounts. Each block takes 5 to 20 minutes. Button names on these websites change; if one does not match, send a screenshot to Claude and ask where it went.

Keep one private note (a password manager, or a note on your phone, **not** a file in this repository) with what you create here.

## Do today, whatever the phase

1. **Start the Google Play developer account**: `docs/PLAY-STORE.md`, steps 1 and 2. The identity check takes days, so it should be running while the app is built.
2. **Ask Maria** for: a portrait photo; two or three sentences about herself; her class days, times and place; how people should contact her (WhatsApp, Instagram…); and three to five lesson videos uploaded to **YouTube** as "Unlisted" or "Public", with the links.
3. **Ask around for testers**: 12 people at least, 15 to 20 is safer, with Android phones and a Gmail address, willing to keep the app installed for two weeks. Maria's students are perfect.

## Before Phase 0

1. **Switch on GitHub Pages.** On github.com open `yoga-app` → Settings → Pages → under "Build and deployment", set Source to **GitHub Actions**.
2. **Create an Expo account** at expo.dev (free; signing up with GitHub is fine). Note your **account name** (the username in the top corner).
3. **Create the Expo project.** On expo.dev: Projects → Create a project → name it `yoga-app`. On the project's page, find the **ID** (a long code with dashes; it also appears inside a suggested command `eas init --id …`). Copy it.
4. **Create a token for the robots.** expo.dev → your account settings → Access tokens → Create token → name it `github` → copy the token now (it is shown once).
5. **Give the token to GitHub.** github.com → `yoga-app` → Settings → Secrets and variables → Actions → New repository secret → Name: `EXPO_TOKEN` → paste → Add secret.
6. Start the Phase 0 session with the message in `docs/PLAN.md`, giving the account name and the project ID.

**Installing the preview app later** (the Phase 0 pull request repeats this): open the link on the Summary page of the Android build run. Open it on your Android phone → Install. Android will ask to allow your browser to install apps: allow it for this once. If "Play Protect" warns that it does not know the developer, choose "Install anyway": that developer is you.

## Before Phase 2

Nothing to set up. But Maria's page shows sample text until her real details are in: send them with the "adding content" message in `docs/PLAN.md`.

## Before Phase 4: Supabase

1. Create an account at supabase.com (free; GitHub sign-in is fine) → New project → name `yoga-app` → choose a strong database password (keep it in your note) → Region: the one closest to Maria's students → Create. Wait a minute or two.
2. **Allow anonymous sign-ins.** Authentication → Sign In / Providers (or "Settings" inside Authentication) → switch on **Allow anonymous sign-ins** → Save. Leave "Allow new users to sign up" **on**: switching it off also blocks the anonymous sign-ins the app relies on. It is harmless: an account that is not in the teachers list can do nothing more than an anonymous one.
3. **Create the tables.** SQL Editor → New query → open the file `supabase/migrations/20261116000000_init.sql` on GitHub, press "Raw", copy everything, paste it → Run. It should say "Success. No rows returned".
4. **Create Maria's sign-in.** Authentication → Users → Add user → Create new user → her email, a password you choose together, tick "Auto confirm user" → Create.
5. **Make her the teacher.** SQL Editor → New query → paste this with her email, then Run:
   ```sql
   insert into public.teachers (user_id) select id from auth.users where email = 'maria@example.com';
   ```
   It should say one row was added. To also see the totals yourself, repeat steps 4 and 5 with your own email.
6. **Copy two public values.** Project Settings → API (or "API Keys" / "Data API"): the **Project URL** (`https://xxxx.supabase.co`) and the **publishable** key (older projects call it the `anon` key). These two are safe to share and go into the app. **Never** copy the "secret" (or `service_role`) key anywhere except step 3 of Phase 5.
7. Start the Phase 4 session with both values.

## Before Phase 5: the final name, then Firebase

1. **Decide the app's name and package name** (`docs/PLAN.md`, "Decisions waiting"). After this step they are fixed.
2. **Firebase.** console.firebase.google.com → use an existing project or Add project → name `yoga-app` → Google Analytics: **off**.
3. In the project: Add app → Android → package name: the final one (for example `com.yogawithmaria.app`) → Register. Skip the remaining wizard steps. Then Add app → Android again with the same name ending in `.preview`.
4. Project settings (the gear) → General → download **google-services.json** (one file covers both apps).
5. **Give the file to Expo.** expo.dev → project `yoga-app` → Environment variables → Add: name `GOOGLE_SERVICES_JSON`, type **File**, upload the file, visibility "Secret", environments: all. Do not put this file in the repository.
6. **The notification key.** Firebase → Project settings → Service accounts → Generate new private key → a `.json` file downloads. expo.dev → project → Credentials → Android → choose the application identifier → "FCM V1 service account key" → upload it. Do the same for the `.preview` identifier. Then delete the downloaded file from your device.
7. **Two values for GitHub.** `yoga-app` → Settings → Secrets and variables → Actions:
   - Secrets → New repository secret → `SUPABASE_SECRET_KEY` → the **secret** key from Supabase (Project Settings → API keys).
   - Variables tab → New repository variable → `NOTIFY_TIMEZONE` → for example `Europe/Paris` (the zone where most of the students live).
8. Start the Phase 5 session with the final name and package.

## Before Phase 6: Google Play

Everything is in `docs/PLAY-STORE.md`.

## If a key leaks

A key pasted in a chat, a screenshot or a commit is burnt. Replace it: Expo → Access tokens → revoke and create a new one, then update the GitHub secret. Supabase → API keys → roll the secret key, then update the GitHub secret. The publishable key and the project address are public by design and need no care.
