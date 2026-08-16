# Content model & curriculum design

This document explains how curriculum content is structured and the
pedagogical reasoning behind it. It's the reference for anyone (human or AI)
authoring new levels. The formal schema lives in
[`src/types/content.ts`](../src/types/content.ts).

## Scope decisions (locked in)

- **Dialect: Modern Standard Arabic (MSA).** Formal, written, pan-Arab
  standard. Foundation for reading, media, and further study.
- **Curriculum shape: interleaved, not phased.** Every level mixes script,
  vocabulary, and sentence-building rather than mastering one pillar before
  starting the next. Keeps early levels motivating instead of a multi-week
  alphabet slog before saying anything real.
- **Audience: single user**, static client-side app, progress in
  browser storage. No accounts, no backend.
- **Retention: built-in spaced repetition (SRS).** Every letter, word, and
  pattern is tracked as an individual reviewable item (see
  `SRSItemState`), not just "level complete." Review items are pulled into
  each session at runtime — they are not baked into level JSON files.
- **Audio: live via the browser's Web Speech API**, not pre-generated files.
  `PlayAudioButton` calls `speak(text)` (`src/lib/speech.ts`), which picks
  an Arabic system/browser voice (preferring `ar-SA`) and speaks
  `AudioRef.text` on click — no account, API key, or generation step
  required, and it costs nothing. Chosen over cloud TTS specifically to
  avoid the billing-account requirement most providers impose even for
  free-tier usage. Trade-off: voice quality/availability depends entirely on
  what's installed on the user's OS — Chrome's own "remote" voice list turned
  out to be a small fixed set that does *not* reliably include Arabic (this
  was verified directly, not assumed), so a user may need to install an
  Arabic language pack at the OS level before any Arabic voice is available
  to any browser. When none is available, playback fails silently and
  `LevelList` shows a one-line notice. An
  offline pre-generation pipeline for Google Cloud TTS
  (`scripts/generate-audio.mjs`) still exists as a documented fallback if
  downloadable/consistent audio is ever wanted instead — `AudioRef.id` is
  kept in the schema for that path even though the live-speech path doesn't
  use it.
- **Exercises**: multiple-choice/matching, typed Arabic input (virtual
  keyboard + IME), and self-check speaking practice (record + compare to
  reference audio — no automated pronunciation scoring).

## Letter order: shape families, not dictionary order

Letters are grouped by shared skeleton (the part of the glyph that's
identical, before dots distinguish them), e.g. ب ت ث share one skeleton and
differ only by dot count/position. Learning the shape once and then just the
dot pattern is lower cognitive load than 28 unrelated glyphs in dictionary
order. Full alphabet is covered by level 7:

| Level | New letters | Shape family |
|---|---|---|
| 1 | ا ب ت ث | alif (unique) + "toothed" family |
| 2 | ج ح خ د | hook family + dal (unique) |
| 3 | ذ ر ز س | dhal (unique) + swoop family + seen start |
| 4 | ش ص ض ط | seen family + looped family start |
| 5 | ظ ع غ ف | looped family + ayn family + fa |
| 6 | ق ك ل م | standalone shapes |
| 7 | ن ه و ي | standalone shapes, alphabet complete |

Levels 8+ add no new base letters; they cover orthographic special cases
inside the existing letter set (hamza forms in level 8; tāʾ marbūṭa
pronunciation and sun/moon letter assimilation of `ال` in level 11 — see
"Levels 11–20" below), plus a growing jump in vocabulary and grammar now
that every glyph is available.

## Vocabulary: two converging tracks, not one gated track

Strictly requiring every vocab word to use only already-taught letters is
how *no* real intro course actually works (see e.g. the *Alif Baa*
textbook, which teaches greetings in unit 1 using letters not yet formally
covered) — and it's needlessly restrictive here, since script literacy and
vocabulary/meaning are genuinely separate skills that just happen to share a
writing system.

So: **letter exercises are strictly cumulative** (only test letters taught
so far), but **vocabulary is chosen for real-world usefulness first**, taught
via whole-word audio + transliteration regardless of letter-teaching lag.
High-frequency survival words (yes/no, greetings, pronouns) are tagged
`"core"` and appear as early as level 1 for this reason. The two tracks
converge naturally once the alphabet is complete (~level 7), at which point
a learner can start sounding out vocab they already know the meaning of.

## Diacritics (tashkeel) fade-out

Real Arabic text (news, books, street signs) is not diacritized. Showing
full vowel marks forever would leave a learner unable to read anything
authentic. `Level.diacriticsLevel` fades `"full"` → `"partial"` →
`"none"` over the course of the curriculum so undiacritized reading is a
trained skill, not a cliff at the end. Current schedule: levels 1–8 full,
9–15 partial, 16+ none. Note this only actually changes what's rendered
starting at level 16 — `Letter`/`VocabWord.arabic` fields always store full
diacritics regardless of the level's setting (that's the canonical,
TTS-facing form); it's hand-authored exercise/pattern text, and anything
`scripts/generate-exercises.mjs` generates, that gets stripped down to
match a "none" level's setting.

## First 30 levels, at a glance

| Level | Theme | New letters | New pattern |
|---|---|---|---|
| 1 | Greetings & basics | ا ب ت ث | — |
| 2 | Family | ج ح خ د | — |
| 3 | Everyday objects | ذ ر ز س | — |
| 4 | Descriptions (adjectives) | ش ص ض ط | — |
| 5 | Demonstratives | ظ ع غ ف | "This is a [noun]." |
| 6 | Questions | ق ك ل م | "What is this?" |
| 7 | Pronouns (alphabet complete) | ن ه و ي | "I am [adjective]." |
| 8 | Numbers 1–5, hamza forms | — | — |
| 9 | Possession | — | "This is my [noun]." |
| 10 | Negation & review | — | "I am not [adjective]." |
| 11 | The definite article ال | — | "The house is big." |
| 12 | Verbs — "to go" (I/you) | — | "I go to school." |
| 13 | Verbs — "to go" (he/she/we) | — | "Where are you going?" |
| 14 | Numbers 6–10 | — | — |
| 15 | Verbs — "to want" (full) | — | "I want coffee." |
| 16 | Colors | — | "The car is red." |
| 17 | Days of the week | — | "Today is Friday." |
| 18 | Verbs — "to read" (full) | — | "He is reading a newspaper." |
| 19 | Sound plurals | — | "The teachers are in the school." |
| 20 | "And" (وَ) & review | — | capstone: two verbs joined by وَ |
| 21 | Broken plurals | — | "The books are in the house." |
| 22 | Past tense — "to go" | — | "Yesterday I went to the market." |
| 23 | Past tense — "to want" | — | "Yesterday I wanted coffee." |
| 24 | Past tense — "to read" | — | "Did you read the newspaper today?" |
| 25 | Verbs — "to eat" (present) | — | "I eat bread." |
| 26 | Verbs — "to drink" (present) | — | "I drink water." |
| 27 | Broken plurals II — cities & mountains | — | "The mountains are beautiful." (non-human plural agreement) |
| 28 | Past tense — "to eat" | — | "Yesterday grandfather ate the apple." |
| 29 | Past tense — "to drink" | — | capstone: two full past-tense clauses joined by وَ |
| 30 | Review — levels 21–30 | — | capstone: past tense + broken plural + وَ |

Levels 1–10 were a **pacing proof of concept** validating the schema and
progression before continuing; levels 11–20 build on that same shape and
add MSA's biggest missing grammatical piece — present-tense verbs —
introduced gradually across three verbs (ذهب "go", أراد "want", قرأ "read")
rather than dumping the full conjugation table at once. Each verb's
paradigm is deliberately simplified to the six pronouns already taught
(أنا, أنتَ, أنتِ, هو, هي, نحن), skipping dual and the -تم/-هم plural forms
for now.

Levels 21–30 add the two other big pieces flagged as "natural next topics"
after level 20: broken (irregular) plurals and past tense, plus two new
verbs (أكل "eat", شرب "drink") to keep vocabulary growing. Past tense is
spread across multiple levels the same way present tense was — one level
per verb (22 ذهب, 23 أراد, 24 قرأ, 28 أكل, 29 شرب) — but each level teaches
noticeably *fewer* than six conjugated forms per verb, for a reason
specific to the past tense: see "Past-tense homograph collisions" below.
Expect to keep revising pacing as more levels get added.

### Past-tense homograph collisions

Arabic's past tense conjugates by suffix (ذَهَبْتُ "I went", ذَهَبَ "he
went", …) rather than the present tense's prefix system. For a regular
verb, the suffixes for *I*, *you (masc.)*, *you (fem.)*, and *she* differ
**only by a short vowel diacritic** on the very last letter — so once
diacritics are stripped (every level from 16 on), all four collapse to the
*identical* written string: ذَهَبْتُ / ذَهَبْتَ / ذَهَبْتِ / ذَهَبَتْ all
become `ذهبت`. This is a real feature of unvocalized Arabic (native
readers resolve it from context, not the verb alone), not a content bug —
but it means those four meanings cannot be separate vocab entries without
producing multiple-choice options and typing answers that are visually
identical for different correct answers.

The fix: each regular past-tense verb (ذهب، قرأ، أكل، شرب) is taught as
**3 vocab entries**, not 6 — one merged entry covering the
I/you-masc./you-fem./she collision group (with a 4-way English gloss), one
for هو (distinct: no suffix at all), one for نحن (distinct: -نَا). أراد is
the exception: as a hollow verb, its vowel shortens before consonant
suffixes but not before vowel ones, so هو (أَرَادَ) and هي (أَرَادَتْ) stay
visually distinct from each other even without diacritics — it gets **4
entries** instead of 3, and level 23's grammar note calls this out
explicitly as a teaching point (compare the levels' `newVocab` counts:
22/24/28/29 have 3 verb forms each, 23 has 4). Before authoring any new
past-tense (or other suffix-conjugated) content, compute each candidate
vocab word's `arabicNoDiacritics` by hand and check for collisions the same
way — `scripts/generate-exercises.mjs` doesn't detect this automatically,
it will happily generate broken exercises from colliding vocab.

## Exercises in the JSON files

Each level file has a small hand-authored core set (the flagship
sentence-build/matching/typing exercises that show off a level's grammar
point) plus generated coverage exercises ensuring every letter and vocab
word gets at least one dedicated question — see
`scripts/generate-exercises.mjs`, an idempotent script safe to re-run after
authoring new levels. As of level 30: 216 content items, 504 exercises
total. The generator is diacritics-aware — it renders Arabic text stripped
for levels where `diacriticsLevel === "none"` so generated and
hand-authored exercises never mix styles within the same level.
