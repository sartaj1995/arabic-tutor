# Arabic Tutor

A web app for English speakers to learn Modern Standard Arabic (MSA) —
script, vocabulary, and sentence-building — across 100 levels.

**Status: app shell with interactive exercises, an on-screen Arabic
keyboard, spaced-repetition review, real exercise depth, live audio, and a
progress dashboard.** The first 90 levels of curriculum content exist as
structured JSON — 1268 exercises across them, generated so every letter and
vocab word gets at least one dedicated question, not just the illustrative
few each level started with. A React/Vite app loads and displays them with
clickable/typeable exercises and live scoring, finishing a level feeds its
letters/vocab/patterns into a spaced-repetition queue you work through at
`/review`, 🔊 buttons speak Arabic text aloud using the browser's built-in
Web Speech API — free, no account, no API key, no pre-generated files
(though it does need an Arabic voice installed at the OS level — see
"Audio" below) — and `/progress` shows levels completed, average score,
items learned, SRS mastery breakdown, a day streak, and a review-load
forecast. See Next steps for what's still missing.

## Running it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` produces a static
`dist/` you can deploy anywhere (Vercel, Netlify, GitHub Pages, ...).

### Audio

🔊 buttons speak Arabic text live via the browser's Web Speech API
(`src/lib/speech.ts`) — nothing to set up, nothing to generate, but it does
need an Arabic voice available at the OS level. Verified directly (not
assumed): Chrome's own "remote" voice list is a small fixed set that does
**not** reliably include Arabic, so don't count on it working out of the
box. If `LevelList` shows "No Arabic voice found," install one:

- **Windows**: Settings → Time & Language → Language & region → Add a
  language → pick an Arabic variant → make sure Speech/text-to-speech is
  included in the download → restart the browser afterward.
- Other OSes: check the system language/speech/accessibility settings for
  installing an Arabic voice, then restart the browser.

Until then, 🔊 buttons no-op silently rather than erroring.

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
- **Progress dashboard** (`/progress`, `src/lib/progress.ts`): computed
  entirely from data already in IndexedDB, no separate tracking needed —
  levels completed, average score, items learned by type, an SRS mastery
  breakdown (new/learning/mastered, by repetitions), a day streak (derived
  from SRS review + level-completion timestamps), and a review-load
  forecast (due today / this week / later).

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
src/lib/progress.ts       Dashboard stats computed from IndexedDB (no separate tracking)
src/pages/                LevelList, LevelDetail, Review, Progress
src/components/           ArabicText, ExerciseCard, PlayAudioButton, ArabicKeyboard
content/levels/*.json     Authored level content (levels 1–90 so far)
scripts/generate-audio.mjs      Offline Google Cloud TTS pipeline — fallback, unused
scripts/generate-exercises.mjs  Coverage-based exercise generator (idempotent)
```

Each `content/levels/level-XX.json` follows the `Level` type in
`src/types/content.ts`: new letters, new vocab, new sentence patterns, a
diacritics-display setting, and exercises (a hand-authored core set plus
generated coverage exercises — 1268 total across the 90 levels).

## First 90 levels

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
| 11 | The definite article ال — sun/moon letters |
| 12 | Verbs — "to go" (I / you) |
| 13 | Verbs — "to go" (he / she / we) |
| 14 | Numbers 6–10 |
| 15 | Verbs — "to want" (full paradigm) |
| 16 | Colors |
| 17 | Days of the week |
| 18 | Verbs — "to read" (full paradigm) |
| 19 | Sound plurals |
| 20 | "And" (وَ) & review |
| 21 | Broken plurals |
| 22 | Past tense — "to go" |
| 23 | Past tense — "to want" |
| 24 | Past tense — "to read" |
| 25 | Verbs — "to eat" (present tense) |
| 26 | Verbs — "to drink" (present tense) |
| 27 | Broken plurals II — cities & mountains |
| 28 | Past tense — "to eat" |
| 29 | Past tense — "to drink" |
| 30 | Review — levels 21–30 |
| 31 | Idafa — construct phrases |
| 32 | Negating the past and future (لم / لن) |
| 33 | Verbs — "to work" (present tense) |
| 34 | Verbs — "to write" (present tense) |
| 35 | Ordinal numbers (masc.) |
| 36 | Telling time |
| 37 | Comparatives and superlatives |
| 38 | The dual |
| 39 | Weather and seasons |
| 40 | Review — levels 31–40 |
| 41 | The future tense (سَـ / سَوْفَ) |
| 42 | The imperative — giving commands |
| 43 | Verbs — "to travel" (present, Form III) |
| 44 | Verbs — "to study" (present) |
| 45 | Body parts |
| 46 | Prepositions of place |
| 47 | Nisba — nationalities |
| 48 | "To be able to" — يستطيع |
| 49 | More family and feelings |
| 50 | Review — levels 41–50 |
| 51 | Plural pronouns |
| 52 | Numbers 11–15 |
| 53 | Numbers 16–20 |
| 54 | Verbs — "to teach" (Form II) |
| 55 | Relative clauses — الذي / التي |
| 56 | Verbs — "to send" (Form IV) |
| 57 | Conditionals — إِذَا |
| 58 | Food & restaurant vocabulary |
| 59 | Clothing & everyday items |
| 60 | Review — levels 51–60 |
| 61 | Numbers 21–100 |
| 62 | Verbs — "to learn" (Form V) |
| 63 | Verbs — "to wait" (Form VIII) |
| 64 | Attached object pronouns |
| 65 | Months of the year |
| 66 | Verbs — "to sleep" |
| 67 | Prepositions of time — قَبْلَ / بَعْدَ |
| 68 | Transportation vocabulary |
| 69 | Household & furniture |
| 70 | Review — levels 61–70 |
| 71 | Verbs — "to meet" (Form VI) |
| 72 | Directions |
| 73 | Verbs — "to depart" (Form VII) |
| 74 | Money & shopping |
| 75 | Verbs — "to walk" (defective) |
| 76 | More object pronouns |
| 77 | Verbs — "to like/love" (geminate) |
| 78 | More adjectives |
| 79 | Comparison — كَـ ("like/as") |
| 80 | Review — levels 71–80 |
| 81 | Verbs — "to know" |
| 82 | More prepositions — مَعَ / حَتَّى |
| 83 | Verbs — "to open" |
| 84 | Verbs — "to close" |
| 85 | More weather |
| 86 | Conditionals — لَوْ ("if", hypothetical) |
| 87 | Verbs — "to give" (defective, Form IV) |
| 88 | Sports & hobbies |
| 89 | Health & illness |
| 90 | Review — levels 81–90 |

## Next steps

1. **Review the pacing.** Read through `content/levels/level-01.json` →
   `level-90.json` (or the summary table in `docs/content-model.md`) and
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
5. ~~Give speaking exercises real feedback.~~ Done — `SpeakingExercise`
   (`ExerciseCard.tsx`) now plays the target word/phrase via `speak()`
   before the self-check, reusing the same reference-audio pattern as
   `audio-recognition`. Also authored 116 `speaking` exercises across all
   20 levels (one per vocab word) via `generate-exercises.mjs`, since none
   existed in any level before this. True automated pronunciation scoring
   (recording + grading the learner's own voice) remains a much bigger
   separate feature, deliberately out of scope.
6. ~~Add a progress dashboard.~~ Done — `/progress` (`src/pages/Progress.tsx`
   + `src/lib/progress.ts`), reachable from a nav link in the header on
   every page. All stats are computed on the fly from existing
   `levelProgress`/`srsItems` IndexedDB data — no new tracking needed.
   Verified end-to-end: completed level 1 (17/17), dashboard correctly
   showed "1/20 levels", "100% average", "12 items learned — 4 letters, 8
   vocab", streak "🔥 1", all 12 items "New" and "due today". Then did a
   full review session (12/12 correct) and confirmed the mastery bar moved
   all 12 items from New → Learning and the forecast shifted from "12 due
   today" to "0 today / 12 this week" — exactly matching the SM-2 algorithm's
   1-day interval.
7. ~~Author levels 11–20.~~ Done — introduces the definite article
   (ال, with sun/moon letter assimilation and tāʾ marbūṭa pronunciation)
   and present-tense verb conjugation, MSA's biggest missing grammar piece
   until now, spread gradually across three verbs (ذهب "go", أراد "want",
   قرأ "read") rather than dumped at once. Also: numbers 6–10, colors, days
   of the week, sound plurals, and the وَ conjunction. Diacritics fade to
   "none" starting level 16 (see `docs/content-model.md`). Validated with a
   full consistency pass (0 problems across 158 items / 222 exercises: no
   duplicate ids, every refId resolves, every sentence-build's tiles join to
   its answer) and in the browser — level 11 renders and scores correctly,
   and level 20's capstone sentence (combining two verbs from levels 12 and
   18 via وَ) was built tile-by-tile and scored "Correct!".
8. ~~Author levels 21–30.~~ Done — broken (irregular) plurals (كِتَاب →
   كُتُب, and non-human plural agreement: الْجِبَالُ جَمِيلَةٌ, a fem.
   singular adjective for any non-human plural), full past tense across
   five verbs (ذهب، أراد، قرأ، أكل، شرب), and two new present-tense verbs
   (أكل "eat", شرب "drink"). Past tense uncovered a real content-design
   issue, not just a pacing decision: several conjugated forms become
   textually identical once diacritics strip away (levels 16+), so each
   regular past-tense verb is taught as 3 vocab entries instead of 6 — see
   "Past-tense homograph collisions" in `docs/content-model.md` for the
   full reasoning. Validated with a full consistency pass (0 problems
   across 216 items / 504 exercises) and in the browser — level 27's
   non-human plural agreement and level 30's capstone sentence (past tense
   + broken plural + وَ, spanning five of the ten new levels' vocabulary)
   both render and score correctly. 30 of 100 levels done; 31–100
   continues the same progression.
8b. ~~Author levels 31–40.~~ Done — idafa/construct phrases (بَيْتُ
    الرَّجُلِ "the man's house", no word for "of"), negating a verb rather
    than just an is/am-not sentence (لَمْ + present tense for the past,
    لَنْ + present tense for the future — reuses existing verb vocab, no
    new suffixed forms), two more verbs in the present tense only (عمل
    "work", كتب "write" — past tense left as a recognition note, not
    drilled, since the suffix pattern is well-established by verb #5),
    ordinal numbers split masc./fem. across two levels specifically so
    fem. ordinals could be motivated by telling time right after,
    comparative/superlative adjectives (reusing the level-16 أَفْعَل
    pattern), and the dual (kept light: nominative -َانِ only). Hit a
    second kind of homograph collision, distinct from past tense's: `مِنْ`
    ("than", needed for comparatives) strips to the same text as the
    already-taught `مَنْ` ("who") — since these are unrelated words, not
    forms of one verb, there was no sensible way to merge them into one
    vocab entry, so `مِنْ` simply isn't given its own vocab entry at all,
    appearing only in pattern text tested via whole-sentence
    multiple-choice. Validated with a full consistency pass (0 problems
    across 266 items / 617 exercises) and in the browser — idafa, telling
    time's feminine-ordinal agreement, and the dual all render correctly.
    40 of 100 levels done.
8c. ~~Author levels 41–50.~~ Done — rounds out the tense/mood picture:
    the positive future (سَـ/سَوْفَ, completing لَنْ from level 32), the
    imperative (built from the same jussive stem لَمْ uses, including the
    well-known irregular أكل → كُلْ exception), and يستطيع + أَنْ ("can"),
    which reuses the same "pair a particle with existing present-tense
    vocab" trick as لَمْ/لَنْ/سَـ rather than minting new subjunctive-form
    entries. سافر ("travel") is the first verb taught outside the basic
    Form I pattern — Form III, present-tense prefixes take damma instead
    of fatha (أُسَافِرُ). Also: درس ("study", present tense only, same
    reasoning as levels 33/34), body parts, prepositions of place (an
    idafa-like structure — تَحْتَ الْكِتَابِ), nisba adjectives (the ـِيّ
    pattern behind nationalities), and more family/feelings vocab.
    Validated with a full consistency pass (0 problems across 319 items /
    740 exercises, 0 new stripped-text collisions across the full 246-word
    pool) and in the browser — the imperative, the Form III verb, nisba
    agreement, and a 7-tile capstone sentence-build (spanning 41, 43, and
    48) all render and score correctly. Also extended
    `src/components/LevelIcon.tsx` with 5 new per-level-type icons so
    none of this batch's levels fall back to the generic icon. 50 of 100
    levels done — halfway.
8d. ~~Author levels 51–60.~~ Done — picks up three of the "real grammar
    gaps" flagged after level 50: plural pronouns (أَنْتُمْ, هُنَّ, completing
    the pronoun table left unfinished since level 7), relative clauses
    (الَّذِي/الَّتِي), and conditionals (إِذَا, which — like لَمْ/لَنْ/سَـ before
    it — pairs with the existing past-tense pool instead of minting new
    forms). Two more verb forms: عَلَّمَ ("to teach", Form II) and أَرْسَلَ
    ("to send", Form IV), rounding out three of the ten forms outside
    basic Form I. Also began numbers past ten (11–20) without pushing all
    the way to 100 in one batch — teens/tens gender-polarity and 30–100
    are explicitly left for a future batch, not silently dropped. Caught
    a real collision while picking the Form II verb: دَرَّسَ ("to teach",
    same root as level 44's دَرَسَ "to study") would have produced an
    identical stripped present-tense form to يَدْرُسُ once diacritics fade
    — switched to عَلَّمَ (root ع-ل-م) instead. Validated with a full
    consistency pass (0 problems across 369 items / 867 exercises, 0 new
    stripped-text collisions against the full 288-word vocab pool) and in
    the browser — the new Unit 6 ("Complex Sentences" / الجمل المركبة)
    renders all ten levels with correct icons, and level 60's 8-tile
    capstone (إِذَا + relative clause + سَـ-future) renders and scores
    correctly. 60 of 100 levels done.
8e. ~~Author levels 61–70.~~ Done — closes out the numbers system (tens
    30–100, plus a grammar note that 21–99 needs zero new vocabulary: it's
    just [unit] + وَ + [ten]; full 3–19 gender-polarity agreement is still
    explicitly deferred) and picks up attached object pronouns
    (أُعَلِّمُهُ "I teach him", يُعَلِّمُنِي "he teaches me" — the same
    possessive suffixes from level 9, reused as verb objects, with -نِي
    as a deliberate exception from possessive -ي). Two more verb forms:
    تَعَلَّمَ ("to learn", Form V, built directly on level 54's عَلَّمَ "to
    teach" as a concrete II→V pair) and اِنْتَظَرَ ("to wait", Form VIII),
    bringing the running count of non-Form-I forms to five. Both levels'
    grammar notes correct a rule that could have over-generalized from
    level 43: only Forms II/III/IV take a damma-prefixed present tense;
    V and beyond (including X, already met via يستطيع) take fatha
    instead. نَامَ ("to sleep") is deliberately not a new form — it's the
    second hollow verb after أَرَادَ (level 15), included to reinforce that
    pattern rather than add new grammar. Also: months of the year (13
    words, one level, matching the days-of-week precedent), قَبْلَ/بَعْدَ
    ("before"/"after", extending level 46's idafa-like preposition
    pattern to time), transportation and household vocabulary. Validated
    with a full consistency pass (0 problems across 431 items / 1029
    exercises, 0 new stripped-text collisions against the full 340-word
    vocab pool) and in the browser — the new Unit 7 ("Daily Life
    Expanded" / الحياة اليومية الموسعة) renders all ten levels with correct
    icons, level 65's 13-word month list and level 70's 5-tile capstone
    both render and score correctly. 70 of 100 levels done.
8f. ~~Author levels 71–80.~~ Done — rounds out the verb-form system to
    nine of ten forms (Form IX left out deliberately, too narrow to be
    worth a level) with تَقَابَلَ ("to meet each other", Form VI) and
    اِنْطَلَقَ ("to depart", Form VII), and introduces the two remaining
    weak-verb irregularity classes: مَشَى ("to walk", defective/weak-final)
    and أَحَبَّ ("to like/love", geminate/doubled-root) — alongside hollow
    verbs already known, all three weak-verb categories are now
    represented, each via one genuinely useful verb. تَقَابَلَ's grammar note
    flags a deliberate choice: reciprocal verbs only make sense with
    plural subjects, so only نَحْنُ/أَنْتُمْ/هُمْ forms are taught, reusing
    level 51's plural verb endings instead of a six-pronoun paradigm
    nobody would use. Also extends level 64's object pronouns with three
    more suffixes (-كَ, -نَا, -هُمْ — six of Arabic's object pronouns now
    taught), adds a light comparison particle (كَـ, "like/as" — its
    example deliberately avoids Arabic's irregular "five nouns" by using
    أُمِّهَا 'her mother' instead of أَبِيهِ 'his father'), directions, money
    & shopping, and more adjectives. Validated with a full consistency
    pass (0 problems across 478 items / 1146 exercises, 0 new
    stripped-text collisions against the full 377-word vocab pool) and in
    the browser — the new Unit 8 ("Practical Fluency" / الطلاقة العملية)
    renders all ten levels with correct icons, level 77's geminate-verb
    conjugation and level 80's 7-tile capstone (combining قَبْلَ with
    أَنْ + a verb for the first time) both render and score correctly. 80
    of 100 levels done. Also added a favicon and meta description
    (`index.html`, `public/favicon.svg`) — the app previously had neither.
8g. ~~Author levels 81–90.~~ Done — four more high-utility regular verbs:
    عَرَفَ ("to know", 81), فَتَحَ/أَغْلَقَ ("to open"/"to close", 83/84,
    deliberately taught as an opposite pair), and أَعْطَى ("to give", 87,
    defective + Form IV, reusing level 76's object suffixes as recipients
    rather than plain objects — أُعْطِيكَ الْكِتَابَ, 'I-give-you the-book',
    a genuine two-object construction). 86 (لَوْ) adds a second word for
    "if", directly contrasted with إِذَا (level 57): إِذَا marks a
    real/likely condition, لَوْ a hypothetical/counterfactual one — both
    reuse the existing past-tense pool rather than minting new forms,
    continuing the لَمْ/لَنْ/سَـ/إِذَا reuse trick one more time. Also: two
    more prepositions (مَعَ, حَتَّى) plus a surprisingly overdue صَدِيق
    ("a friend"), and لُغَة ("a language") — notable for a
    language-learning app, minted specifically to demonstrate adjective
    gender agreement (عَرَبِيّ vs. its feminine عَرَبِيَّة) concretely.
    Weather, sports/hobbies, and health/illness round out the batch as
    vocabulary-only levels. Validated with a full consistency pass (0
    problems across 527 items / 1268 exercises, 0 new stripped-text
    collisions against the full 416-word vocab pool) and in the browser —
    the new Unit 9 ("Everyday Fluency" / الطلاقة اليومية) renders all ten
    levels with correct icons, level 86's لَوْ-conditional and level 90's
    6-tile capstone both render and score correctly. 90 of 100 levels
    done — ten to go.
9. ~~Author `letter-writing` exercises.~~ Done — `generate-exercises.mjs`
   now generates one per letter (28 total, across levels 1–7 where all the
   alphabet is introduced), testing the production direction (name ->
   glyph) that `letter-recognition` doesn't cover, rotating through the
   initial/medial/final positional forms so a letter's joining shapes get
   exercised too, not just its isolated form. Reuses the existing
   choice-exercise UI — no new component needed.
