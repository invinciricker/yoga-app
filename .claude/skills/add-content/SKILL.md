---
name: add-content
description: Use when the owner gives Maria's material (text, photos, a YouTube link, new class times) and asks to add or change a lesson, a tip, a note, a series or Maria's page in the yoga app.
---

# Adding content to Yoga with Maria

Follow `docs/ADDING-CONTENT.md` exactly; the formats are in `docs/CONTENT.md` and, as code, in `shared/content-schema.ts`.

The short version:
1. Touch only `content/`. Never app code, never `docs/`.
2. One folder per item, named by a slug that never changes. Copy the shape of an existing item of the same kind.
3. Keep Maria's words. Fix typos only. Never invent a quote, a pose, a time, a class or a health claim. Anything you had to guess: set `draft: true` and list it under "Guessed" in the pull request.
4. Photos go next to the file, 2400 pixels and 1 MB at most, each with a `coverAlt` line. Videos are YouTube ids, never files.
5. Run `npm run check` when the project has it.
6. Branch `content/<slug>`, one pull request. Never merge it yourself.
