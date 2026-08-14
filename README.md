# Arabic Tutor

A web app for English speakers to learn Modern Standard Arabic (MSA) —
script, vocabulary, and sentence-building — across 100 levels.

**Status: app shell with interactive exercises, an on-screen Arabic
keyboard, spaced-repetition review, real exercise depth, and live audio.**
The first 10 levels of curriculum content exist as structured JSON — 133
exercises across them, generated so every letter and vocab word gets at
least one dedicated question, not just the illustrative few each level
started with. A React/Vite app loads and displays them with
clickable/typeable exercises and live scoring, finishing a level feeds its
letters/vocab/patterns into a spaced-repetition queue you work through at
`/review`, and 🔊 buttons speak Arabic text aloud using the browser's
built-in Web Speech API — free, no account, no API key, no pre-generated
files. See Next steps for what's still missing.

## Running it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` produces a static
`dist/` you can deploy anywhere (Vercel, Netlify, GitHub Pages, ...).

### Audio

🔊 buttons speak Arabic text live via the browser's Web Speech API
(`src/lib/speech.ts`) — nothing to set up, nothing to generate. Voice
quality/availability depends on your browser and OS:

- **Chrome** supplies Arabic voices remotely regardless of what's installed
  locally — this is the most reliable option.
- Other browsers rely on voices installed at the OS level; if none are
  found, `LevelList` shows a small notice and 🔊 buttons no-op silently
  rather than erroring.

An offline pre-generation pipeline for Google Cloud TTS
(`scripts/generate-audio.mjs`) still exists as a documented fallback if you
ever want downloadable/offline-consistent MP3s instead — it was shelved
because Google Cloud requires a billing account (card on file) even for
free-tier usage, which was more setup friction than the Web Speech API for
no real quality gain. To use it: `cp .env.example .env`, fill in
`GOOGLE_TTS_API_KEY`, then `npm run generate-audio` (supports `--dry-run`
and `--force`). `PlayAudioButton` would need a small change to prefer a
static file when one exists, since it currently always calls
`speak()`.

### Generating exercises

```bash
npm run generate-exercises              # write changes to content/levels/*.json
npm run generate-exercises -- --dry-run # preview counts, no writes
```

Scans each level for vocab/letters not yet tested by their own dedicated
exercise and generates what's missing (meaning + recall/typing for vocab,
recognition for letters), spliced into the level JSON alongside the
hand-authored ones. Idempotent — safe to re-run after authoring new levels,
since already-covered items are skipped.

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
- **Audio**: live via the browser's Web Speech API (`src/lib/speech.ts`) —
  free, no account, no pre-generation step. See "Audio" above for the
  cloud-TTS fallback path if that's ever needed instead.
- **Exercises**: multiple-choice/matching, typed Arabic input (with an
  on-screen Arabic keyboard), and self-check speaking practice (record
  yourself vs. reference audio). Every letter and vocab word gets at least
  one dedicated exercise per `scripts/generate-exercises.mjs` — see
  "Generating exercises" above.

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
src/lib/speech.ts         Web Speech API wrapper (speak, voice detection)
src/pages/                LevelList, LevelDetail, Review
src/components/           ArabicText, ExerciseCard, PlayAudioButton, ArabicKeyboard
content/levels/*.json     Authored level content (levels 1–10 so far)
scripts/generate-audio.mjs      Offline Google Cloud TTS pipeline — fallback, unused
scripts/generate-exercises.mjs  Coverage-based exercise generator (idempotent)
```

Each `content/levels/level-XX.json` follows the `Level` type in
`src/types/content.ts`: new letters, new vocab, new sentence patterns, a
diacritics-display setting, and exercises (a hand-authored core set plus
generated coverage exercises — 133 total across the 10 levels).

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
3. ~~Get audio working.~~ Done, via a different route than originally
   planned — the Google Cloud TTS pipeline needed a billing account even
   for free usage, so switched to the browser's built-in Web Speech API
   instead: zero setup, zero account, zero cost (see "Audio" above).
   `PlayAudioButton` now takes the Arabic `text` to speak directly rather
   than a pre-generated file id. Letter audio still uses the letter's full
   diacritized *name* (e.g. "بَاء" bāʾ) rather than the bare glyph, since
   speech synthesis can't meaningfully pronounce a lone unvoweled consonant
   — that fix was provider-agnostic and carried over. `LevelList` shows a
   notice if no Arabic voice is detected in the browser. The Google Cloud
   pipeline is kept as a documented, unused fallback.
4. ~~Generate exercises at scale.~~ Done — `scripts/generate-exercises.mjs`
   (see "Generating exercises" above) took the 10 levels from 42 hand-authored
   sample exercises to 133, ensuring every letter and vocab word has at
   least one dedicated question. Verified in the browser: answered all 17
   of level 1's exercises via a scripted click-through, got a clean 17/17,
   and confirmed SRS seeding still counts by unique content item (not
   exercise count), so this didn't perturb the review-queue math.
5. **Give speaking exercises real feedback (current priority).** Audio
   infrastructure exists now, but `SpeakingExercise` (`ExerciseCard.tsx`)
   isn't wired to it yet — still just a "mark as practiced" toggle. Play the
   target word/phrase via `speak()` so the learner has a reference to
   compare their own pronunciation against; true automated pronunciation
   scoring is a much bigger separate feature, out of scope for this step.
6. **Add a progress dashboard** beyond the per-level score badges — e.g.
   review load over time, words learned, streaks.
7. **Author levels 11–100** once the first 10 are validated, continuing the
   interleaved letters → orthography → vocabulary → grammar progression.
   `generate-exercises.mjs` is idempotent, so re-run it after each new batch
   of levels to fill in coverage automatically.
8. **Author a `letter-writing` exercise.** The type exists in the schema
   (`src/types/content.ts`) and `ExerciseCard` already handles it, but no
   level uses it yet — only recognition, no tracing/handwriting practice.
