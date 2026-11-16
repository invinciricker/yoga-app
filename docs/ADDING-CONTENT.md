# Adding content: the guide any Claude follows

Adding a lesson, a tip, a note, a photo or a class time **never needs a code session and never needs a new version in the store**. Any Claude that can open this repository (Claude chat in the project, or a Claude Code session on a cheap model) follows this page.

**For the owner, in plain words.** Give Claude what Maria sent you: her text, her photos, the link to her video. Say what it is ("a new lesson", "a tip", "her class times changed"). Claude writes the files and opens a pull request. You read the short summary, check it in the preview app if you want, and merge. A few minutes later it is in everyone's app.

## What to give Claude

| For | Give |
|---|---|
| A lesson | A title or a few words about it, how long it is, how hard (gentle, steady or strong), what it works on, and the **YouTube link** if there is a video. Optional: a cover photo, the poses in order with their times, things needed, a note from Maria. |
| A tip or a note | Maria's text, as she wrote or said it. Optional: a photo. |
| Maria's page | Whatever changed: class times, the place, the price line, her photo, her introduction, her contact details. |
| A photo | Attach it in the chat. Phone photos are fine. |

**Videos.** Maria uploads the video with the YouTube app on her phone and sets it to **Unlisted** (only people with the link can see it; it does not show on her channel) or **Public** (if she wants it found on YouTube too). Then she sends you the link. That is all: the video itself never goes into this repository. Her own hosting with offline viewing comes in a later phase.

## Steps for Claude

1. Read `docs/CONTENT.md` (the formats). Look at one existing item of the same kind in `content/` and copy its shape.
2. Choose the **slug**: short, lowercase, dashes, from the title (`evening-wind-down`). Check that no folder already has it. It can never be renamed later.
3. Create the folder and the file (`content/lessons/<slug>/lesson.md`, `content/journal/<slug>/entry.md`, …).
4. **Keep Maria's words.** Fix typos and punctuation only. Do not polish her voice, do not add claims about health, do not invent a quote, a pose, a time or a class. If something needed is missing (level, minutes), make a sensible choice, set `draft: true`, and say in the pull request what you guessed.
5. **Photos**: save each into the item's folder with a plain name (`cover.jpg`). If one is wider than 2400 pixels or heavier than 1 MB, shrink it first (`npx sharp-cli`, or the `content:image` script once Phase 1 exists). Write `coverAlt`: one line saying what is in the photo. Never use a photo from the internet.
6. **Video**: take the 11-character id from the link (`https://youtu.be/M7lc1UVf-VE` → `M7lc1UVf-VE`; `https://www.youtube.com/watch?v=M7lc1UVf-VE&t=5s` → the same). If the owner gave no link, leave `video` out.
7. `published`: today's date, unless told otherwise. Leave `draft: true` if the owner asked to see it first, or if you guessed something.
8. Run `npm run check` if the project has it (from Phase 1). Otherwise re-read your file against `docs/CONTENT.md` line by line.
9. Branch `content/<slug>`, one pull request that touches **only `content/`**. The description starts with "In short" (what was added, in two sentences), then "Guessed" (anything you chose for Maria), then "To check" (where it will appear in the app).
10. If the owner said "publish it", and the checks are green, say that it is ready to merge. Never merge yourself.

## Changing or removing something

- Change the text, the photo or the video freely. **Never change a slug.**
- To hide something: `draft: true`. To remove it: delete its folder, and remove its slug from any `related` list (the check will tell you).
- Class times and contact details are in `content/studio/studio.md`.

## Do not

- Touch anything outside `content/`.
- Commit a video file, a file over 1 MB, or anything personal about a student.
- Write health promises ("cures back pain"). Say what the practice is, not what it treats.
