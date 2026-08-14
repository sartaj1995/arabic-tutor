# Arabic Tutor

A web app for English speakers to learn Modern Standard Arabic (MSA) —
script, vocabulary, and sentence-building — across 100 levels.

**Status: app shell with interactive exercises, an on-screen Arabic
keyboard, and spaced-repetition review.** The first 10 levels of curriculum
content exist as structured JSON, a React/Vite app loads and displays them
with clickable/typeable exercises and live scoring, and finishing a level
feeds its letters/vocab/patterns into a spaced-repetition queue you work
through at `/review`. An offline TTS pipeline (Google Cloud Text-to-Speech)
is built but **not yet run** — no audio files exist yet, on hold pending a
GCP API key. See Next steps for what's still missing.

## Running it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` produces a static
`dist/` you can deploy anywhere (Vercel, Netlify, GitHub Pages, ...).

### Generating audio (on hold — not run yet)

Requires a Google Cloud API key with the Text-to-Speech API enabled, which
requires a billing account (card on file) even for free-tier usage — that's
the reason this is paused, not cost (total usage here is a few hundred
characters).

```bash
cp .env.example .env   # then fill in GOOGLE_TTS_API_KEY (see comments in the file)
npm run generate-audio                 # generate anything missing
npm run generate-audio -- --dry-run    # preview what would be generated, no API calls
npm run generate-audio -- --force      # regenerate everything
```

MP3s land in `public/audio/{audioId}.mp3` and are served at `/audio/{audioId}.mp3`.
The script is idempotent — safe to re-run after adding new levels, since it
skips any id that already has a file.

## Design at a glance

- **Dialect**: Modern Standard Arabic.
- **Curriculum shape**: script, vocabulary, and sentences are interleaved
  from level 1, not taught in separate phases. Full alphabet coverage lands
  around level 7.
- **Retention**: a lightweight SM-2-style spaced-repetition queue
  (`src/lib/srs.ts`) tracks every letter, word, and sentence pattern as an
  individually reviewable item. Finishing a level seeds its items into the
  queue; correct answers grow the review interval (1 day → 6 days →
  interval×ease), misses reset it for immediate re-review. Work through
  what's due at `/review` — reachable via the "🔁 Review N items" banner
  on the level list.
- **Platform**: static client-side app, no accounts — progress lives in the
  browser. No backend required.
- **Audio**: pre-generated via Google Cloud Text-to-Speech (`ar-XA-Wavenet-B`,
  a male MSA voice) and cached as static MP3s, not synthesized at runtime.
  Pipeline built, not yet run (see "Generating audio" above).
- **Exercises**: multiple-choice/matching, typed Arabic input (with an
  on-screen Arabic keyboard), and self-check speaking practice (record
  yourself vs. reference audio).

Full rationale for these decisions — including why letters are taught in
shape families instead of dictionary order, and why vocabulary isn't
strictly gated behind letter progress — is in
[`docs/content-model.md`](docs/content-model.md).

## Repo layout

```
docs/content-model.md     Design rationale + schema reference
src/types/content.ts      TypeScript types for the content model
src/lib/content.ts        Loads content/levels/*.json at build time
src/lib/db.ts             Dexie (IndexedDB) schema for progress/SRS
src/lib/arabic.ts         Diacritics-stripping normalization for grading
src/lib/srs.ts            Spaced-repetition scheduling (lightweight SM-2)
src/lib/reviewExercise.ts Turns a due SRS item into a synthetic quiz question
src/pages/                LevelList, LevelDetail, Review
src/components/           ArabicText, ExerciseCard, PlayAudioButton, ArabicKeyboard
content/levels/*.json     Authored level content (levels 1–10 so far)
scripts/generate-audio.mjs   Offline TTS pipeline (Google Cloud TTS) — not yet run
public/audio/*.mp3        Generated audio clips, served at /audio/{id}.mp3 (none yet)
```

Each `content/levels/level-XX.json` follows the `Level` type in
`src/types/content.ts`: new letters, new vocab, new sentence patterns,
a diacritics-display setting, and a handful of sample exercises.

## First 10 levels

| # | Theme |
|---|---|
| 1 | Greetings & basics |
| 2 | Family |
| 3 | Everyday objects |
| 4 | Descriptions (adjectives) |
| 5 | Demonstratives — "This is..." |
| 6 | Questions — "What is this?" |
| 7 | Pronouns — alphabet complete |
| 8 | Numbers 1–5 & hamza forms |
| 9 | Possession — "This is my..." |
| 10 | Negation & review |

## Next steps

1. **Review the pacing.** Read through `content/levels/level-01.json` →
   `level-10.json` (or the summary table in `docs/content-model.md`) and
   sanity-check that the progression feels right before more levels are
   generated the same way.
2. ~~Scaffold the app.~~ Done — `npm run dev` to try it.
2b. ~~Wire up interactive exercises.~~ Done — clickable options, a tile-based
    sentence builder, a typing input (compared leniently, diacritics
    stripped) backed by an on-screen Arabic keyboard, and a self-check for
    speaking exercises. Level completion + score persist to IndexedDB
    (`src/lib/db.ts`) and show as a badge on the level list.
2c. ~~Build the SRS review queue.~~ Done — `src/lib/srs.ts` schedules items
    with a lightweight SM-2 variant, `src/lib/reviewExercise.ts` generates
    quiz questions on the fly from due items (reusing `ExerciseCard`, no new
    UI needed), and `/review` (`src/pages/Review.tsx`) runs the session.
    Verified end-to-end: completing a level seeds the right item count,
    correct/incorrect answers reschedule items exactly per the algorithm,
    and the level-list due-count banner tracks it live.
3. **Stand up the audio pipeline — built, on hold.** `scripts/generate-audio.mjs`
   is ready (see "Generating audio" above) but hasn't been run — needs a
   Google Cloud API key, deferred for now due to GCP's billing-account
   requirement. Letter audio already uses the letter's full diacritized
   *name* (e.g. "بَاء" bāʾ), not the bare undiacritized glyph, since TTS
   can't meaningfully pronounce a lone unvoweled consonant. Play buttons
   (🔊) are wired into letters, vocab, sentence patterns, and
   audio-recognition exercises, and fail silently until audio exists.
4. **Generate exercises at scale (current priority).** Level files currently
   hold a few illustrative sample exercises per level; a full pass needs
   several exercises per vocab/letter item for real practice depth.
5. **Give speaking exercises real feedback**, once audio exists — reference
   audio to compare against, not just a self-check toggle.
6. **Add a progress dashboard** beyond the per-level score badges — e.g.
   review load over time, words learned, streaks.
7. **Author levels 11–100** once the first 10 are validated, continuing the
   interleaved letters → orthography → vocabulary → grammar progression.
8. **Author a `letter-writing` exercise.** The type exists in the schema
   (`src/types/content.ts`) and `ExerciseCard` already handles it, but no
   level uses it yet — only recognition, no tracing/handwriting practice.
