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
  const files = readdirSync(LEVELS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

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
    const genId = nextExerciseIdFactory(level);
    const newExercises = [];

    const uncoveredVocab = level.vocab.filter((v) => !coveredVocab.has(v.id));
    const uncoveredLetters = level.letters.filter((l) => !coveredLetters.has(l.id));
    const uncoveredPatterns = level.patterns.filter((p) => !coveredPatterns.has(p.id));

    uncoveredVocab.forEach((word, index) => {
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
        prompt: `What does '${word.arabic}' mean?`,
        options: shuffle([word.english, ...meaningDistractors]),
        answer: word.english,
      });

      // ...plus a second, production-oriented question, alternating between
      // recall (pick the Arabic word) and typing it out, for variety.
      if (index % 2 === 0) {
        const recallDistractors = pickDistractors(
          vocabSoFar.map((v) => v.arabic),
          word.arabic,
          3,
        );
        newExercises.push({
          id: genId(),
          type: "multiple-choice",
          refIds: [word.id],
          prompt: `Which word means '${word.english}'?`,
          options: shuffle([word.arabic, ...recallDistractors]),
          answer: word.arabic,
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
        prompt: `Which letter is this? ${letter.forms.isolated}`,
        options: shuffle([letter.name, ...distractors]),
        answer: letter.name,
      });
    }

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
        prompt: `What does this mean? ${pattern.exampleArabic}`,
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
      const closeMarker = "\n  ]\n}";
      const idx = raw.lastIndexOf(closeMarker);
      if (idx === -1) {
        throw new Error(`Could not find exercises array close in ${file} — aborting to avoid corrupting it.`);
      }
      const before = raw.slice(0, idx);
      const newBlocks = newExercises.map(formatExercise).join(",\n");
      const updated = `${before},\n${newBlocks}${closeMarker}\n`;
      writeFileSync(filePath, updated, "utf8");
    }
  }

  console.log(`\n${DRY_RUN ? "Would add" : "Added"} ${totalAdded} exercises total.`);
}

main();
