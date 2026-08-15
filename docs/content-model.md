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

## First 20 levels, at a glance

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

Levels 1–10 were a **pacing proof of concept** validating the schema and
progression before continuing; levels 11–20 build on that same shape and
add MSA's biggest missing grammatical piece — present-tense verbs —
introduced gradually across three verbs (ذهب "go", أراد "want", قرأ "read")
rather than dumping the full conjugation table at once. Each verb's
paradigm is deliberately simplified to the six pronouns already taught
(أنا, أنتَ, أنتِ, هو, هي, نحن), skipping dual and the -تم/-هم plural forms
for now. Expect to keep revising pacing as more levels get added.

## Exercises in the JSON files

Each level file has a small hand-authored core set (the flagship
sentence-build/matching/typing exercises that show off a level's grammar
point) plus generated coverage exercises ensuring every letter and vocab
word gets at least one dedicated question — see
`scripts/generate-exercises.mjs`, an idempotent script safe to re-run after
authoring new levels. As of level 20: 158 content items, 222 exercises
total. The generator is diacritics-aware — it renders Arabic text stripped
for levels where `diacriticsLevel === "none"` so generated and
hand-authored exercises never mix styles within the same level.
