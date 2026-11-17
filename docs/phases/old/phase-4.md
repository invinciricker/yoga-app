# Phase 4: "Feedback reaches Maria"

Written by Claude chat, 16 Nov 2026. For Claude Code: build exactly this. Read `CLAUDE.md`, `docs/ARCHITECTURE.md` ("The backend"), the whole of `supabase/migrations/20261116000000_init.sql` (its comments are part of this brief), and in `docs/DESIGN.md` the paragraph "Maria's totals". Phase 3 must be merged.

## In one paragraph

Until now the answer to "How did that feel?" stayed on the phone. This phase sends it to a small online database, without a name and without an account, and gives Maria a private page with the totals for each lesson. The service is Supabase, free plan. The app keeps working fully without the network and without Supabase.

## What the owner has already done

The steps of `docs/OWNER-SETUP.md`, "Before Phase 4": a Supabase project, anonymous sign-ins switched on, the migration run in the SQL editor, Maria's sign-in created and her row added to `teachers`. He pastes the **project address** and the **publishable key** in the prompt (both are public by design and go into `src/config.ts`). If they are missing: build everything on the fake backend (below), leave the two values empty, make the app hide every online feature while they are empty, and say so at the top of the pull request.

## 1. The backend folder (`src/backend/`)

The only folder that imports Supabase. Check Supabase's current guide for Expo before writing the client (storage adapter, any polyfill it still asks for). Install `@supabase/supabase-js` only.

- `client.ts`: creates the client on first use (never at launch), session kept in AsyncStorage, `autoRefreshToken` on, `detectSessionInUrl` off.
- `identity.ts`: `ensureSignedIn()` → the existing session, or `signInAnonymously()`. Never call it unless there is something to send.
- `reactions.ts`: `sendPending()` takes every reaction in the practice store with `sent: false` whose lesson exists in the content, upserts it (`onConflict: 'user_id,lesson_slug'`, columns `lesson_slug`, `difficulty`, `feeling`), and marks it `sent`. A changed answer goes back to `sent: false`.
- `teacher.ts`: `signIn(email, password)`, `signOut()`, `isTeacher()` (`rpc('is_teacher')`), `stats(since?)` (`rpc('reaction_stats')`), with the result typed.
- `fake.ts`: the same functions kept in memory, with a few invented totals. Used by the tests, and by the web mirror and the preview variant when the address has `?backend=fake`. Never in a production build.
- `enabled`: false when the config values are empty. Every caller checks it.

**When things are sent.** `sendPending()` runs: 3 seconds after an answer is chosen on After practice (so a feeling chip chosen just after travels with it), when that screen closes, and each time the app comes to the foreground with something unsent. It never blocks a screen, never shows an error, and gives up quietly until the next occasion.

## 2. Maria's side

- At the very bottom of My practice, small and quiet: "Teacher sign in". It opens `app/teacher/sign-in.tsx`: email, password, a gold "Sign in" button, and one sentence saying this page is for Maria. Wrong details: one calm sentence, the fields stay filled. Signed in but not in `teachers`: sign out at once and say "This account is not a teacher account."
- Once signed in as a teacher, My practice shows a new first row, "How lessons felt", and "Sign out" replaces "Teacher sign in". Signing out returns the phone to having no session.
- `app/teacher/index.tsx`: the page described in `docs/DESIGN.md`. Titles come from the content by slug; a slug the content does not know is listed last under its raw slug with a muted "no longer published". Pull to refresh. Without network: the last totals seen, with the usual offline line.
- Maria's phone keeps working as a student's phone too: her own answers are sent under her teacher identity, which is fine.

## 3. Delete my data, for real

"Delete my data" now also calls `rpc('delete_my_data')` when the phone has a session, then signs out, then clears the phone. If the server cannot be reached, clear the phone anyway, remember that the server part is still owed (`ywm:owed-delete:v1`), say so in one honest sentence, and finish the job at the next launch with network.

Also write `site/delete-my-data.html`: a short page saying what the app keeps, that there are no accounts, and how to erase everything (the button in the app, or uninstalling for the phone's part, or writing to the contact email for the rest). Google Play asks for such an address.

## 4. Staying awake, and the checks

- `keepalive.yml`: Mondays and Thursdays, one `POST` to `<project address>/rest/v1/rpc/ping` with the publishable key. Fails red only if the answer is not `true`, with a message telling the owner to open the Supabase dashboard and press "Restore".
- `npm run check` already runs `supabase/tests/rules.test.mjs`. Add tests for `reactions.ts` on the fake backend: an answer is sent once; a changed answer is sent again; nothing is sent when `enabled` is false; a failure leaves `sent: false`.
- Do not write a new migration. If you believe one is needed, describe it under "Choices made".

## Check before the pull request

`npm run check`; shots of `/teacher/sign-in` and `/teacher?backend=fake`, and `/me` signed out and signed in (fake).

## Not in this phase

Messages, comments, names, profiles, any list of who answered. Notifications (Phase 5).

## In the pull request

"To test on your phone", for two people. **You**: do a lesson, answer, wait ten seconds. **Maria** (or you with her sign-in): My practice → Teacher sign in → "How lessons felt" should show one answer for that lesson. Then on your phone: Delete my data, and Maria pulls to refresh: the answer is gone. Say that a new build is needed if Supabase's guide required a native library, and that it is not otherwise.
