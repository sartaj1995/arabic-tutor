// One-time (idempotent) content-generation pass: ensures every letter and
// vocab word a level introduces has at least one exercise directly testing
// it, on top of the hand-authored "flagship" exercises. Coverage is
// determined by scanning existing exercises' `answer` fields against the
// level's content, so re-running after adding new levels only fills real
// gaps — already-covered items are left alone, exercises are never
// duplicated.
//
// New exercises are spliced into each level.json's existing "exercises"
// array as raw text (matching the file's existing formatting) rather than
// re-serializing the whole file, so the diff only shows what's actually new.
//
// Usage:
//   npm run generate-exercises              write changes to content/levels/*.json
//   npm run generate-exercises -- --dry-run  report what would be added, no writes

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVELS_DIR = path.join(ROOT, "content", "levels");

const DRY_RUN = process.argv.includes("--dry-run");

// Same diacritics ranges as src/lib/arabic.ts's normalizeArabic — kept as a
// separate copy since this is a plain Node script, not bundled with the app.
const DIACRITICS_REGEX =
  /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;

function stripDiacritics(text) {
  return text.replace(DIACRITICS_REGEX, "");
}

// Renders Arabic text the way this level wants it shown: levels whose
// diacriticsLevel is "none" get plain text (matching the fade-out design —
// see docs/content-model.md), everything else keeps full diacritics as
// authored. Applies to distractors too, even ones sourced from an earlier
// (still-diacritized) level, so a single exercise never mixes styles.
function displayArabic(text, level) {
  return level.diacriticsLevel === "none" ? stripDiacritics(text) : text;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(pool, exclude, count) {
  const candidates = pool.filter((value) => value !== exclude);
  return shuffle(candidates).slice(0, count);
}

function jsonArray(arr) {
  return "[" + arr.map((v) => JSON.stringify(v)).join(", ") + "]";
}

function formatExercise(ex) {
  const lines = ["    {"];
  lines.push(`      "id": ${JSON.stringify(ex.id)},`);
  lines.push(`      "type": ${JSON.stringify(ex.type)},`);
  lines.push(`      "refIds": ${jsonArray(ex.refIds)},`);
  lines.push(`      "prompt": ${JSON.stringify(ex.prompt)},`);
  if (ex.options) {
    lines.push(`      "options": ${jsonArray(ex.options)},`);
  }
  lines.push(`      "answer": ${JSON.stringify(ex.answer)}`);
  lines.push("    }");
  return lines.join("\n");
}

// Speaking coverage is tracked separately from findCoveredIds: a word can
// already be "covered" by a multiple-choice/typing exercise (which is what
// findCoveredIds checks, via matching answer text) while still lacking any
// pronunciation-practice exercise of its own, so this looks for an existing
// exercise of type "speaking" that references the word's id directly.
function findSpeakingCoverage(level) {
  const covered = new Set();
  for (const ex of level.exercises) {
    if (ex.type !== "speaking") continue;
    for (const refId of ex.refIds) covered.add(refId);
  }
  return covered;
}

// Letter-writing coverage, tracked the same way as speaking coverage above
// (separately from findCoveredIds): a letter is already "covered" in the
// generic sense by its letter-recognition exercise (glyph -> name), but that
// leaves the reverse, production direction (name -> glyph) — and the
// initial/medial/final positional forms specifically — untested. So this
// looks for an existing "letter-writing" exercise referencing the letter's
// id directly, rather than reusing the name-matching coveredLetters set.
function findLetterWritingCoverage(level) {
  const covered = new Set();
  for (const ex of level.exercises) {
    if (ex.type !== "letter-writing") continue;
    for (const refId of ex.refIds) covered.add(refId);
  }
  return covered;
}

const POSITIONAL_FORMS = [
  { key: "initial", label: "initial" },
  { key: "medial", label: "medial" },
  { key: "final", label: "final" },
];

function findCoveredIds(level) {
  const coveredVocab = new Set();
  const coveredLetters = new Set();
  const coveredPatterns = new Set();

  for (const ex of level.exercises) {
    const answer = ex.answer;
    const vocabMatch = level.vocab.find(
      (v) => v.english === answer || v.arabic === answer || v.arabicNoDiacritics === answer,
    );
    if (vocabMatch) coveredVocab.add(vocabMatch.id);

    const letterMatch = level.letters.find((l) => l.name === answer);
    if (letterMatch) coveredLetters.add(letterMatch.id);

    const patternMatch = level.patterns.find(
      (p) => p.exampleEnglish === answer || p.exampleArabic === answer,
    );
    if (patternMatch) coveredPatterns.add(patternMatch.id);
  }

  return { coveredVocab, coveredLetters, coveredPatterns };
}

function nextExerciseIdFactory(level) {
  let max = 0;
  for (const ex of level.exercises) {
    const m = /-ex(\d+)$/.exec(ex.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return () => `l${level.number}-ex${++max}`;
}

function main() {
  // Numeric sort, not string sort — "level-100.json" would otherwise land
  // right after "level-10.json" (plain string comparison puts "100" before
  // "11"), breaking the cumulative-pool ordering below the moment the
  // course passed 99 levels.
  const files = readdirSync(LEVELS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  // Cumulative pools: everything introduced at or before the level being
  // processed, so distractors never reference content not yet learned.
  let vocabSoFar = [];
  let lettersSoFar = [];
  let patternsSoFar = [];
  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(LEVELS_DIR, file);
    const raw = readFileSync(filePath, "utf8");
    const level = JSON.parse(raw);

    vocabSoFar = [...vocabSoFar, ...level.vocab];
    lettersSoFar = [...lettersSoFar, ...level.letters];
    patternsSoFar = [...patternsSoFar, ...level.patterns];

    const { coveredVocab, coveredLetters, coveredPatterns } = findCoveredIds(level);
    const speakingCovered = findSpeakingCoverage(level);
    const letterWritingCovered = findLetterWritingCoverage(level);
    const genId = nextExerciseIdFactory(level);
    const newExercises = [];

    const uncoveredVocab = level.vocab.filter((v) => !coveredVocab.has(v.id));
    const uncoveredLetters = level.letters.filter((l) => !coveredLetters.has(l.id));
    const uncoveredPatterns = level.patterns.filter((p) => !coveredPatterns.has(p.id));

    uncoveredVocab.forEach((word, index) => {
      const wordArabicDisplay = displayArabic(word.arabic, level);

      // Every uncovered word gets a meaning-recognition question...
      const meaningDistractors = pickDistractors(
        vocabSoFar.map((v) => v.english),
        word.english,
        3,
      );
      newExercises.push({
        id: genId(),
        type: "multiple-choice",
        refIds: [word.id],
        prompt: `What does '${wordArabicDisplay}' mean?`,
        options: shuffle([word.english, ...meaningDistractors]),
        answer: word.english,
      });

      // ...plus a second, production-oriented question, alternating between
      // recall (pick the Arabic word) and typing it out, for variety.
      if (index % 2 === 0) {
        const arabicPoolDisplay = vocabSoFar.map((v) => displayArabic(v.arabic, level));
        const recallDistractors = pickDistractors(arabicPoolDisplay, wordArabicDisplay, 3);
        newExercises.push({
          id: genId(),
          type: "multiple-choice",
          refIds: [word.id],
          prompt: `Which word means '${word.english}'?`,
          options: shuffle([wordArabicDisplay, ...recallDistractors]),
          answer: wordArabicDisplay,
        });
      } else {
        newExercises.push({
          id: genId(),
          type: "typing",
          refIds: [word.id],
          prompt: `Type the Arabic word for '${word.english}'.`,
          answer: word.arabicNoDiacritics,
        });
      }
    });

    for (const word of level.vocab) {
      if (speakingCovered.has(word.id)) continue;
      const wordArabicDisplay = displayArabic(word.arabic, level);
      newExercises.push({
        id: genId(),
        type: "speaking",
        refIds: [word.id],
        prompt: `Practice saying '${wordArabicDisplay}' (${word.english}) out loud.`,
        answer: word.arabicNoDiacritics,
      });
    }

    for (const letter of uncoveredLetters) {
      const distractors = pickDistractors(
        lettersSoFar.map((l) => l.name),
        letter.name,
        3,
      );
      newExercises.push({
        id: genId(),
        type: "letter-recognition",
        refIds: [letter.id],
        prompt: `Which letter is this? ${displayArabic(letter.forms.isolated, level)}`,
        options: shuffle([letter.name, ...distractors]),
        answer: letter.name,
      });
    }

    // Every letter gets a production-direction exercise too (name -> glyph,
    // mirroring letter-recognition's glyph -> name), rotating through the
    // initial/medial/final positional forms so a letter's joining shapes get
    // exercised, not just its isolated form.
    level.letters.forEach((letter, index) => {
      if (letterWritingCovered.has(letter.id)) return;
      const { key: formKey, label: formLabel } = POSITIONAL_FORMS[index % POSITIONAL_FORMS.length];
      const correctForm = displayArabic(letter.forms[formKey], level);
      const distractors = pickDistractors(
        lettersSoFar.map((l) => displayArabic(l.forms[formKey], level)),
        correctForm,
        3,
      );
      newExercises.push({
        id: genId(),
        type: "letter-writing",
        refIds: [letter.id],
        prompt: `Which is the correct ${formLabel} form of the letter ${letter.name}?`,
        options: shuffle([correctForm, ...distractors]),
        answer: correctForm,
      });
    });

    for (const pattern of uncoveredPatterns) {
      const distractors = pickDistractors(
        patternsSoFar.map((p) => p.exampleEnglish),
        pattern.exampleEnglish,
        3,
      );
      newExercises.push({
        id: genId(),
        type: "multiple-choice",
        refIds: [pattern.id],
        prompt: `What does this mean? ${displayArabic(pattern.exampleArabic, level)}`,
        options: shuffle([pattern.exampleEnglish, ...distractors]),
        answer: pattern.exampleEnglish,
      });
    }

    if (newExercises.length === 0) {
      console.log(`${file}: already fully covered, nothing to add.`);
      continue;
    }

    console.log(
      `${file}: +${newExercises.length} exercises (${level.exercises.length} -> ${
        level.exercises.length + newExercises.length
      })`,
    );
    totalAdded += newExercises.length;

    if (!DRY_RUN) {
      // Files may be checked out with CRLF line endings (Windows
      // core.autocrlf) even though this script always composes new content
      // with plain "\n" — detect the file's actual line ending so the
      // splice marker and appended text both match it, rather than assuming LF.
      const nl = raw.includes("\r\n") ? "\r\n" : "\n";
      const closeMarker = `${nl}  ]${nl}}`;
      const idx = raw.lastIndexOf(closeMarker);
      if (idx === -1) {
        throw new Error(`Could not find exercises array close in ${file} — aborting to avoid corrupting it.`);
      }
      const before = raw.slice(0, idx);
      // formatExercise always joins with plain "\n" internally; normalize to
      // the file's actual line ending in one pass, after joining, so an "\r"
      // we just inserted never gets matched and doubled by this same replace.
      const newBlocks = newExercises
        .map(formatExercise)
        .join(",\n")
        .replace(/\n/g, nl);
      const updated = `${before},${nl}${newBlocks}${closeMarker}${nl}`;
      writeFileSync(filePath, updated, "utf8");
    }
  }

  console.log(`\n${DRY_RUN ? "Would add" : "Added"} ${totalAdded} exercises total.`);
}

main();
