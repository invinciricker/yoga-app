# Later: what comes after version 1

Written by Claude chat, 16 Nov 2026. These are **directions, not briefs**. Before building one, the owner brings it to Claude chat for a proper brief (or asks a Claude Code session on a strong model to write one in the style of the earlier phases and waits for his OK). The decisions already taken are written here so they are not reopened by accident.

## Phase 7: our own video hosting, and offline lessons

**Why it waits.** It needs a Cloudflare account with a payment card on file (the free allowance is 10 GB of storage with no charge for downloads, which is unusual and is why it was chosen), and getting large video files from Maria's phone into a pipeline is the hardest plumbing in the whole project. YouTube covers version 1.

**Already decided.**
- The content already has the door: `video.provider: 'file'` in `shared/content-schema.ts`. Screens do not change; `VideoPlayer` gains a second branch built on `expo-video`, with our own quiet controls (play, a scrubber in gold, ten seconds back and forward, full screen).
- Files are plain MP4 (H.264 + AAC, 720p, "fast start", about 1 to 1.5 Mbit/s: yoga is slow and filmed from a tripod, so this looks fine). No adaptive streaming at first.
- Offline: a "Download" button on lessons with a `file` video, a "Downloaded" chip in Practice, a page listing downloads with their size and a delete button, Wi-Fi only by default. Files go in the app's own folder with `expo-file-system`.
- A lesson may keep a YouTube video and gain a file later; the content decides.

**To decide in the brief.** How raw videos arrive (the Cloudflare dashboard in a browser accepts files up to a few hundred megabytes, which is two or three minutes of phone video; longer ones need either compression on the phone first or Phase 8's upload). Where the compression runs (a GitHub Action with `ffmpeg` is the first idea). Whether to buy a domain name (about €10 a year): the free `r2.dev` address is rate-limited and meant for testing, so a real audience needs a proper one. Buying a domain also gives the content a permanent address that does not depend on GitHub.

## Phase 8: Maria posts from her phone

**Already decided.** Git stays the single source of truth. Maria's phone does not write to a database that the app reads; it sends her text and photo to a small server function (Supabase Edge Function, free), which checks she is in `teachers` and commits a new file under `content/` through GitHub's API on a branch. The usual checks run; when they pass, it merges by itself and goes out through the same pipeline as everything else. So there is one way content reaches the app, one place to look when something is wrong, and every post can be undone.

**In the app.** In teacher mode, a "New" button: a tip (text, optional photo), a note, or a lesson (title, level, minutes, focus, YouTube link, optional photo, optional flow). Photos are shrunk on the phone before sending. A "My posts" list with their state: being checked, published, refused (with the reason in plain words).

**To decide in the brief.** Whether posts publish at once or wait for the owner's merge at first. How edits and removals work from the phone. The limits (posts per day, photo size).

## Then, in the order the owner chose to care about them

| Idea | What it takes | Note |
|---|---|---|
| **iPhone app** | An Apple Developer account ($99 a year). Expo builds iOS without a Mac. The code is already cross-platform; notifications and the video player need their iOS setup and a review of every screen on a real iPhone. | Maria may move to an iPhone: until then the web preview address works on iPhone in the browser. |
| **Private messages to Maria** | A real inbox for Maria, replies, notifications, and a way to block abuse: with an app open to anyone, strangers can write. | The owner chose reactions only for version 1. |
| **Progress that follows you to a new phone** | Optional sign-in (Google) linked to the anonymous identity, and syncing the practice store. Then Google's account-deletion rules apply in full. | |
| **Comments under lessons** | Moderation tools first. | Not recommended for a one-teacher app. |
| **Photos or videos from students** | Storage, strict privacy rules, consent. | Heavy. |
| **French or another language** | The words are already in one file; content needs a language field (schema version 2). | |
| **Paid lessons** | Google Play Billing, a tax and legal setup, a server to check purchases. | A different project. |

## Things to watch that are not features

- **Each August** Google raises the Android version new updates must target. Moving to the newest Expo SDK and rebuilding takes care of it. An app that is never updated slowly disappears from new phones.
- **The free plans**: Expo (15 Android builds a month; over-the-air updates for up to 1,000 monthly users, used only for the preview app), Supabase (pauses after a week of silence: the keepalive job prevents it; 500 MB of database, far more than reactions will ever need), GitHub Pages (a 1 GB site and a soft limit of 100 GB of traffic a month).
- **A backup of the reactions** is not set up (the free Supabase plan has none). They are not precious; if that changes, a monthly export by a GitHub Action is an hour of work.
