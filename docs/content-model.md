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

## First 70 levels, at a glance

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
| 31 | Idafa — construct phrases | — | "The house key is big." |
| 32 | Negating the past and future (لم / لن) | — | "I did not go to school yesterday." |
| 33 | Verbs — "to work" (present) | — | "I work in an office." |
| 34 | Verbs — "to write" (present) | — | "I write with the pen." |
| 35 | Ordinal numbers (masc.) | — | "the first day" |
| 36 | Telling time | — | "It is three o'clock." |
| 37 | Comparatives and superlatives | — | "My house is bigger than your house." |
| 38 | The dual | — | "The two boys are small." |
| 39 | Weather and seasons | — | "The weather is hot in summer." |
| 40 | Review — levels 31–40 | — | capstone: idafa + comparative + وَ |
| 41 | The future tense (سَـ / سَوْفَ) | — | "I will go to the market tomorrow." |
| 42 | The imperative — giving commands | — | "Go to school!" |
| 43 | Verbs — "to travel" (present, Form III) | — | "I travel by plane." |
| 44 | Verbs — "to study" (present) | — | "I study at the university." |
| 45 | Body parts | — | "My hand is big." |
| 46 | Prepositions of place | — | "The pen is under the book." |
| 47 | Nisba — nationalities | — | "I am Egyptian." |
| 48 | "To be able to" — يستطيع + أَنْ | — | "I can go." |
| 49 | More family and feelings | — | "I am sad today." |
| 50 | Review — levels 41–50 | — | capstone: سَـ-future + وَ + يستطيع/أَنْ |
| 51 | Plural pronouns | — | "You (plural) go to the university." |
| 52 | Numbers 11–15 | — | — |
| 53 | Numbers 16–20 | — | — |
| 54 | Verbs — "to teach" (Form II) | — | "I teach the student." |
| 55 | Relative clauses — الذي / التي | — | "The man who works in the office." |
| 56 | Verbs — "to send" (Form IV) | — | "I send a letter to the office." |
| 57 | Conditionals — إِذَا | — | "If I go to the airport, I will travel." |
| 58 | Food & restaurant vocabulary | — | "I am hungry and I want food." |
| 59 | Clothing & everyday items | — | "This shirt is red." |
| 60 | Review — levels 51–60 | — | capstone: إِذَا + relative clause + سَـ-future |
| 61 | Numbers 21–100 | — | "thirty-five" (compound numbers) |
| 62 | Verbs — "to learn" (Form V) | — | "I learn at the university." |
| 63 | Verbs — "to wait" (Form VIII) | — | "I wait at the restaurant." |
| 64 | Attached object pronouns | — | "The teacher teaches me." |
| 65 | Months of the year | — | "I am in January." |
| 66 | Verbs — "to sleep" | — | "I sleep in the house." |
| 67 | Prepositions of time — قَبْلَ / بَعْدَ | — | "I go to the airport before three o'clock." |
| 68 | Transportation vocabulary | — | "I go by train." |
| 69 | Household & furniture | — | "The bed is in the room." |
| 70 | Review — levels 61–70 | — | capstone: سَـ-future + انتظر + قَبْلَ |

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

Levels 31–40 deliberately avoid the suffix-conjugation trap above:
negation (لَمْ for past, لَنْ for future, level 32) pairs with the
*present*-tense verb forms already in the vocab pool rather than minting
new suffixed forms, so it introduces the grammar with only 2 new vocab
items (the particles themselves) and zero new collision risk. The two new
verbs this batch (عمل "work" level 33, كتب "write" level 34) are taught in
the present tense only — past tense is mentioned in the grammar note as a
recognition exercise, not drilled with new vocab, since by verb #5 the
suffix pattern is thoroughly established and doesn't need re-teaching.

This batch also hit a *different* kind of collision, worth flagging for
future levels: `مِنْ` ("than", needed for comparatives in level 37) strips
to the identical text `من` as the already-taught `مَنْ` ("who", level 6) —
the same vowel-only-diacritic problem as the past tense, but between two
otherwise-unrelated words rather than two forms of the same verb. There's
no way to "merge" a question word and a preposition into one sensible
vocab entry the way homograph verb forms get merged, so level 37 simply
never gives `مِنْ` its own vocab entry — it appears only inside pattern/
exercise prose (tested via whole-sentence multiple-choice), never as a
flashcard that could collide with `مَنْ` in a distractor pool. General
lesson: *any* new word's `arabicNoDiacritics` needs checking against the
*entire* existing vocab pool, not just other forms of the same verb.

Levels 31–40 also pick up three grammar points that were explicitly
deferred from earlier batches — idafa/construct phrases (31, "the man's
house" with no word for "of"), negating a verb rather than just a nominal
sentence (32), and the dual (38, kept deliberately light: nominative
-َانِ only, no dual pronouns/verbs, no accusative/genitive -َيْنِ) — plus
comparative/superlative adjectives (37, reusing the level-16 أَفْعَل
pattern) and two vocabulary-driven levels motivated by a real use case
(ordinal numbers in 35 exist specifically to enable telling time in 36;
masculine ordinals are taught first, feminine second, since time-telling
requires the feminine form and that ordering makes the "why feminine?"
grammar note land better than teaching both forms at once).

Levels 41–50 round out the remaining tense/mood gaps and add two more
verbs plus several practical vocab sets. سَـ/سَوْفَ (41, positive future)
completes the three-way future picture alongside لَنْ (level 32); the
imperative (42) introduces commands, built from the same jussive stem
لَمْ already uses, including the well-known irregular exception (أكل →
كُلْ, dropping the prosthetic hamza entirely). سافر ("travel", 43) is the
batch's other notable grammar point: the first verb taught outside the
basic Form I (فَعَلَ) pattern — it's Form III (فَاعَلَ), whose present-tense
prefixes take damma instead of fatha (أُسَافِرُ, not أَسَافِرُ). Both new
verbs this batch (سافر 43, درس 44) are present-tense only, same reasoning
as levels 33/34: past tense doesn't need fresh drilling by verb #8-9.
يستطيع + أَنْ (48, "can") reuses the لَمْ/لَنْ/سَـ trick one more time —
the verb after أَنْ is technically subjunctive, but since that's invisible
without diacritics, it just reuses the existing present-tense vocabulary
rather than minting new subjunctive-form entries. Body parts (45),
prepositions of place (46, explicitly framed as another idafa-like
structure — تَحْتَ الْكِتَابِ literally "the-underside-of the-book"), nisba
adjectives (47, the ـِيّ pattern that builds nationalities, religions, and
professions-from-place alike), and more family/feelings vocab (49) round
out the batch. 50 of 100 levels now authored — the halfway point.

Levels 51–60 pick up three of the "real grammar gaps" explicitly flagged
after level 50: plural pronouns, relative clauses, and conditionals, plus
two more verb forms and a start on numbers past ten. 51 fills in the
plural side of the pronoun table left incomplete since level 7 — أَنْتُمْ
and هُنَّ join هُمْ (vocab-only until now) with their own present-tense verb
endings (ـُونَ, echoing the level-19 sound-plural noun ending, and ـْنَ).
أَنْتُنَّ ("you", fem. plural) is deliberately left out, the same "kept
light" call made for the dual in level 38. 52–53 begin numbers past ten —
teens 11–19 as indeclinable compounds ([units]+عَشَرَ), then 20 as the
first of the "tens" family — but stop there rather than pushing through
to 100 in one batch, the same incremental approach past tense and present
tense took across levels 12–29; full gender-polarity agreement for 3–19
and the 30–100 tens are left for a future batch, flagged explicitly
rather than silently dropped.

54 and 56 add the batch's two new verb forms — عَلَّمَ ("to teach", Form II,
doubled middle root letter) and أَرْسَلَ ("to send", Form IV, hamza-prefixed
past stem) — both taking damma-prefixed present tense like Form III
(سافر, level 43), rounding out three of the ten forms covered outside the
base Form I. **A collision was caught and avoided while choosing the Form
II verb**: دَرَّسَ ("to teach", also root د-ر-س) was the obvious first
choice given level 44 already taught دَرَسَ ("to study", root د-ر-س,
Form I) — but its present tense يُدَرِّسُ strips to identical text as
يَدْرُسُ ("he studies", level 44) once diacritics fade, the shadda being
the only distinguishing mark. عَلَّمَ (root ع-ل-م) was used instead — another
concrete case of the "check the whole vocab pool" lesson from levels
21–30, this time triggered by a *near-homonym root choice*, not a
suffix-conjugation collision. 55 (relative clauses, الَّذِي/الَّتِي) and 57
(conditionals, إِذَا) are the batch's two major syntax additions — both
mint almost no new vocabulary (2 words and 1 word respectively) by design,
reusing existing nouns/verbs as clause content the same way idafa (31) and
negation (32) did. إِذَا specifically reuses the لَمْ/لَنْ/سَـ trick one more
time: MSA conditionals pair إِذَا with a *past*-tense verb even for a
future/hypothetical meaning, so the level-22 past-tense pool is reused
rather than minting new forms. 58 (food/restaurant) and 59
(clothing/everyday items) are vocabulary-only breathers, each combining
new nouns with sentence structures already fully known (أُرِيدُ + object,
هَذَا + definite noun + adjective). 60 of 100 levels now authored.

Levels 61–70 close out numbers entirely and add two more verb forms plus
a real gap flagged after level 60: attached object pronouns. 61 finishes
the numbers system: the tens (30–100, regular -ُونَ pattern, no gender
polarity) plus a grammar note explaining that 21–99 needs no new
vocabulary at all — it's just [unit] + وَ + [ten], reusing level 20's وَ.
Full 3–19 gender-polarity agreement remains the one deliberately deferred
piece, flagged again rather than silently dropped. 62 (تَعَلَّمَ, "to learn",
Form V) and 63 (اِنْتَظَرَ, "to wait", Form VIII) bring the running count of
non-Form-I verb forms to five (II, III, IV, V, VIII) — 62 is built
directly on 54's عَلَّمَ ("to teach"), making the II→V causative/reflexive
relationship (علّم → تعلم) a concrete, memorable pair rather than an
abstract rule. Both levels' grammar notes also correct a rule that could
have been over-generalized from level 43: only Forms II, III, and IV take
a damma-prefixed present tense — V and beyond (including X, already met
via يستطيع in level 48) take fatha instead, because their extra prefix
consonant is now part of the stem itself.

64 covers attached object pronouns (أُعَلِّمُهُ "I teach him", يُعَلِّمُنِي "he
teaches me") — the same possessive suffix set from level 9, reused in a
new syntactic role, with one deliberate exception flagged: "me" as an
object is -نِي, not the possessive -ي, a genuine distinction Arabic makes
that would otherwise sound identical. 65 (months), 68 (transportation),
and 69 (household/furniture) are vocabulary-only levels reusing fully
established sentence structures. 66 (نَامَ, "to sleep") is deliberately
NOT a new verb form — it's the second hollow (weak-middle-radical) verb
after أَرَادَ (level 15), included specifically to reinforce that pattern
rather than adding new grammar, and its grammar note flags that hollow
verbs keep an individually-memorized vowel rather than following one
predictable rule. 67 (قَبْلَ/بَعْدَ, "before"/"after") extends level 46's
idafa-like preposition pattern to time, and reuses level 36's
telling-time construction in its example sentence. 70 of 100 levels now
authored.

## Exercises in the JSON files

Each level file has a small hand-authored core set (the flagship
sentence-build/matching/typing exercises that show off a level's grammar
point) plus generated coverage exercises ensuring every letter and vocab
word gets at least one dedicated question — see
`scripts/generate-exercises.mjs`, an idempotent script safe to re-run after
authoring new levels. As of level 70: 431 content items, 1029 exercises
total. The generator is diacritics-aware — it renders Arabic text stripped
for levels where `diacriticsLevel === "none"` so generated and
hand-authored exercises never mix styles within the same level.
