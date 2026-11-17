# Getting on Google Play: the whole road

Written by Claude chat for Ricky, 16 Nov 2026, checked against Google's and Expo's pages on that day. Google changes its rules and its forms often: every step links to Google's own page, and that page wins over this one. Phase 6 (`docs/phases/phase-6.md`) makes the builder prepare every file and text this guide asks you to upload.

**The road in one line:** developer account → create the app → fill the forms → internal test → closed test with 12 people for 14 days → ask for production → public.

**How long:** about a month the first time. Roughly: a few days for Google to check your identity, a few days for the first review, the 14 days, then a few days for Google to grant production. Later updates take hours to a couple of days.

## 1. Before you start: three choices

- **Personal or organisation account.** Organisation accounts skip the 14-day test but need a registered business with official papers. You almost certainly want **personal**.
- **Whose account.** Google shows the holder's **legal name and country** on the store page. See "Decisions waiting" in `docs/PLAN.md`.
- **A public email address** for the store listing. Create a dedicated one.

## 2. The developer account (do this first, it takes days)

1. Go to play.google.com/console → sign in with the Google account that will own the app → choose **Personal** → follow the form.
2. Pay the **$25** registration fee, once, by card.
3. **Verify your identity**: Google asks for an official photo ID and your legal name and address. Allow a few days.
4. **Verify a phone**: new personal accounts must prove they have a real Android phone, with the "Play Console" app from the Play Store (any Android 10 or newer, not rooted). The console's home page shows the task with a QR code.
5. You cannot publish until these are done, but you can already create the app and fill the forms.

Google's pages: [account types and what is verified](https://support.google.com/googleplay/android-developer/answer/10841920) · [identity check](https://support.google.com/googleplay/android-developer/answer/9198012) · [phone check](https://support.google.com/googleplay/android-developer/answer/14316361)

## 3. Create the app

Play Console → Create app → name (the final one, 30 characters at most) → default language English → **App** → **Free** → accept the declarations. (An app set to free cannot be made paid later; paid features inside a free app remain possible.)

## 4. The forms ("App content" and the dashboard's setup list)

The console's dashboard lists them under "Set up your app". Answers for this app:

| Form | Answer |
|---|---|
| **Privacy policy** | `https://invinciricker.github.io/yoga-app/privacy.html` |
| **App access** | "All or some functionality is restricted" → add instructions: "The app needs no sign-in. One optional area is for the teacher only: My practice → Teacher sign in." and give Google a **test teacher sign-in** (create a second teacher in Supabase as in `docs/OWNER-SETUP.md`, Phase 4, steps 4 and 5, with an email and password made only for Google). If Phase 4 is not built yet, choose "All functionality is available without special access" and change it later. |
| **Ads** | No ads. |
| **Content rating** | Fill the questionnaire honestly: no violence, no sexual content, no gambling, no user-to-user communication, no location sharing. The result should be the lowest rating. |
| **Target audience** | **18 and over** only. This keeps the app out of Google's rules for children's apps. Answer "No" to "could this appeal to children". |
| **News app** | No. |
| **Data safety** | See below. |
| **Health apps** | Every app must answer this, and a yoga app does have health features. Tick **Activity and fitness** (and **Stress management, relaxation, mental acuity** if Maria has breathing or relaxation lessons). The app reads no health data and does not use Health Connect. Google expects a fitness app to tell people to ask a doctor when in doubt: that notice is on the About page ("Look after yourself"). |
| **Government app / Financial features** | No / none. |
| **Advertising ID** | The app does not use it: answer No. (The builder checks that no library adds it.) |
| **Store settings** | Category: **Health & Fitness**. Contact email: the public one. |
| **Trader status** (EU) | See "Decisions waiting" in `docs/PLAN.md`. |

Google's pages: [health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291) · [account and data deletion](https://support.google.com/googleplay/android-developer/answer/13327111)

### Data safety

The builder writes `store/data-safety.md` from the real code in Phase 6; if it differs from this, the code is right and this table is wrong.

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **Yes** (collects; shares nothing). |
| Is the data encrypted in transit? | Yes. |
| Can users ask for their data to be deleted? | Yes. Web address: `https://invinciricker.github.io/yoga-app/delete-my-data.html`. In the app: My practice → Delete my data. |
| Does the app let users create an account? | No. |
| Data type 1 | **App activity → App interactions** (which lesson, and how it felt). Collected, not shared. Optional (the person chooses to answer). Purpose: app functionality. |
| Data type 2 | **Device or other IDs** (the notification token), only if the person switches notifications on. Collected, not shared. Optional. Purpose: app functionality. |
| Everything else (name, email, location, contacts, photos, health info, purchases…) | Not collected. |

If Phases 4 and 5 are not built when you first fill this in, the honest answer today is that the app collects nothing. Come back to this form when they ship: the answers above apply from then.

Two honest uncertainties. First, the progress and streaks never leave the phone, so they are not "collected" in Google's sense. Second, **videos play through YouTube's player**, which is Google's own service and has its own privacy rules; whether an embedded player must be declared here is not clear from Google's pages. The privacy page says plainly that videos come from YouTube. If Google's review asks for more, add what they name.

## 5. The store listing

Main store listing → upload what Phase 6 put in `store/`:
- App icon 512 × 512, feature graphic 1024 × 500, at least 2 phone screenshots (five are prepared).
- Short description (80 characters at most) and full description (4,000 at most) from `store/listing.md`, after you and Maria have edited them. No health promises ("cures", "treats"), no "best", no other app's name.

## 6. Upload the first version, to the internal test

1. On GitHub: Actions → "Android build" → Run workflow → **production**. Open the link on the Summary page of the Android build run; on the build's page press Download to get the **.aab** file.
2. Play Console → Testing → **Internal testing** → Create new release → accept **Play App Signing** when offered (Google then keeps the final signing key, which is the safe choice) → upload the `.aab` → release name and notes fill themselves → Save → Review → Start rollout.
3. Testers tab → create a list with your address and Maria's → copy the **opt-in link** → open it on your phone → accept → install from the Play Store.

The internal test has no review and no minimum. It is for you two. It does **not** count toward the 14 days.

The first upload is done by hand here because Expo's own pages disagree on whether a robot can do the very first one. Later uploads can be automatic (Phase 6, part 4).

## 7. The closed test: 12 people, 14 days

This is Google's rule for personal accounts created after 13 November 2023: before you may ask for production, at least **12 testers** must have been **opted in for 14 days in a row**. [Google's page](https://support.google.com/googleplay/android-developer/answer/14151465).

1. Testing → **Closed testing** → create a track → Testers: a list of the testers' **Gmail addresses** (or a Google Group) → Countries: where they live → create a release with the same `.aab` (or a newer one) → send for review. The first review can take several days.
2. When it is approved, send everyone the **opt-in link**. Each tester must: open the link on their Android phone, signed in with the address you listed → "Become a tester" → install from the Play Store → **keep it installed and stay opted in**.
3. The 14 days count from the moment the twelfth person is opted in. If someone leaves and you drop under 12, the count suffers. **Invite 15 to 20.**
4. Make the test real, because Google asks about it afterwards:
   - Ask Maria to tell her students in class. A real teacher asking real students is the best case there is.
   - Ask testers to open the app several times and do a lesson. Collect what they say (a WhatsApp group is enough) and keep notes.
   - Ship at least one update during the 14 days that answers their feedback (Phases 4 and 5 arriving is a natural one), and write that in the release notes.
5. Avoid paid "tester" services and swap groups. Google looks at whether the testers really used the app, and twelve strangers who never open it do not help you answer the questions in step 8.

## 8. Ask for production

When the console's dashboard says the requirement is met: **Apply for production**. You answer questions about the test: how you found testers, what they did, what feedback you got, what you changed, why the app is ready. Answer concretely from your notes. Vague answers are the usual reason for a refusal; if refused, Google says what was missing and you can test more and apply again.

## 9. Go public

Production → Create new release → the latest `.aab` → Countries → Review → Start rollout. Choose a **staged rollout** (for example 20%) if offered, then raise it. After Google's review the app has its public page: `https://play.google.com/store/apps/details?id=<package>`. Put that link on Maria's Instagram and in her studio.

## 10. Living with it

- **Updates.** A new lesson is never an update (it is content). A code change is: build `production`, upload to the internal track, try it, then promote the same file to production.
- **Every August** Google raises the Android version that updates must target (since 31 August 2026: Android 16, API level 36). Staying on a recent Expo SDK takes care of it. [Google's page](https://support.google.com/googleplay/android-developer/answer/11926878).
- **Read Google's emails.** A policy warning has a deadline; an ignored one removes the app.
- **Reviews.** Answer them, kindly. Maria can too if you add her as a user of the console (Users and permissions).
- **Never lose the account.** Switch on 2-step verification on that Google account today.

## If Google says no

It happens to almost everyone once. The email names a policy and usually a place (a form, a screen, a sentence in the listing). Do not argue and do not resubmit unchanged. Give the email word for word to Claude, fix exactly what is named, and reply through the link in the email.
