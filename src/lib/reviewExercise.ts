import type {
  DiacriticsLevel,
  Exercise,
  SRSItemState,
  Letter,
  VocabWord,
  SentencePattern,
} from "../types/content";
import { allLetters, allVocab, allPatterns, findItem, levels } from "./content";
import { stripDiacritics } from "./arabic";
import { shuffle } from "./random";

/**
 * Review used to ask exactly one question per item — "what does <arabic>
 * mean?" — forever. That made reviews systematically easier than the level
 * the item came from (recognition only, never production or listening), and
 * because the question never changed you could end up memorising the
 * question/answer pair rather than the word.
 *
 * Instead, the mode is chosen from the item's `repetitions` count, so
 * difficulty tracks mastery. Modes cycle rather than escalating to a single
 * hardest mode: a lapse resets `repetitions` to 0 (see applyReview) and so
 * naturally re-teaches from the easy end, mature items get varied retrieval
 * practice rather than the same drill forever, and typing — by far the
 * slowest to answer — stays a predictable fraction of any session.
 *
 * Speaking is deliberately never used here: it reports "unscored", and
 * Review.tsx grades with `result === "correct"`, so a speaking exercise in
 * the queue would be recorded as a miss.
 */

const VOCAB_MODES = ["recognition", "recall", "audio", "typing"] as const;
const LETTER_MODES = ["recognition", "initial", "medial", "final"] as const;
const PATTERN_MODES = ["recognition", "build"] as const;

/** Longest sentence worth rebuilding tile-by-tile before it turns into a chore. */
const MAX_BUILD_TILES = 8;

const diacriticsByLevel = new Map<number, DiacriticsLevel>(
  levels.map((level) => [level.number, level.diacriticsLevel]),
);

/**
 * Renders Arabic the way the level that introduced the item rendered it, so
 * review never shows more vowel marks than the learner was reading at the
 * time. Applied to distractors as well as answers — mixing styles inside one
 * options list would make the odd one out visually obvious.
 */
function displayArabic(text: string, introducedInLevel: number): string {
  return diacriticsByLevel.get(introducedInLevel) === "none" ? stripDiacritics(text) : text;
}

/**
 * Distractors must differ from the answer *as rendered*, not just as stored:
 * stripping diacritics collapses genuine homographs (أَنْتَ / أَنْتِ both render
 * as أنت), and two identical-looking options would make the question
 * unanswerable. Duplicates within the pool are dropped for the same reason.
 */
function pickDistractors(pool: string[], answer: string, count: number): string[] {
  const seen = new Set<string>([answer]);
  const unique: string[] = [];
  for (const value of pool) {
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return shuffle(unique).slice(0, count);
}

function choice(
  id: string,
  type: Exercise["type"],
  itemId: string,
  prompt: string,
  answer: string,
  pool: string[],
): Exercise {
  const distractors = pickDistractors(pool, answer, 3);
  return {
    id,
    type,
    refIds: [itemId],
    prompt,
    options: shuffle([answer, ...distractors]),
    answer,
  };
}

function buildVocabExercise(word: VocabWord, mode: (typeof VOCAB_MODES)[number]): Exercise {
  const id = `review-vocab-${word.id}-${mode}`;
  const arabic = displayArabic(word.arabic, word.introducedInLevel);
  const arabicPool = allVocab.map((v) => displayArabic(v.arabic, word.introducedInLevel));

  switch (mode) {
    case "recall":
      return choice(
        id,
        "multiple-choice",
        word.id,
        `Which word means '${word.english}'?`,
        arabic,
        arabicPool,
      );
    case "audio":
      return choice(
        id,
        "audio-recognition",
        word.id,
        "Listen and pick the word you hear.",
        arabic,
        arabicPool,
      );
    case "typing":
      return {
        id,
        type: "typing",
        refIds: [word.id],
        prompt: `Type the Arabic word for '${word.english}'.`,
        answer: word.arabicNoDiacritics,
      };
    case "recognition":
    default:
      return choice(
        id,
        "multiple-choice",
        word.id,
        `What does '${arabic}' mean?`,
        word.english,
        allVocab.map((v) => v.english),
      );
  }
}

function buildLetterExercise(letter: Letter, mode: (typeof LETTER_MODES)[number]): Exercise {
  const id = `review-letter-${letter.id}-${mode}`;

  if (mode === "recognition") {
    return choice(
      id,
      "letter-recognition",
      letter.id,
      `Which letter is this? ${letter.forms.isolated}`,
      letter.name,
      allLetters.map((l) => l.name),
    );
  }

  // Production direction, rotating through the joining forms — the shapes a
  // learner actually has to recognise in running text.
  return choice(
    id,
    "letter-writing",
    letter.id,
    `Which is the correct ${mode} form of the letter ${letter.name}?`,
    letter.forms[mode],
    allLetters.map((l) => l.forms[mode]),
  );
}

function buildPatternExercise(
  pattern: SentencePattern,
  mode: (typeof PATTERN_MODES)[number],
): Exercise {
  const id = `review-pattern-${pattern.id}-${mode}`;
  const arabic = displayArabic(pattern.exampleArabic, pattern.introducedInLevel);
  const tiles = arabic.split(/\s+/).filter(Boolean);

  // Falls back to recognition for anything too short to be a puzzle or long
  // enough to be tedious (level 99's reading passage is three sentences).
  if (mode === "build" && tiles.length >= 2 && tiles.length <= MAX_BUILD_TILES) {
    return {
      id,
      type: "sentence-build",
      refIds: [pattern.id],
      prompt: `Arrange the tiles to say '${pattern.exampleEnglish}'`,
      options: shuffle(tiles),
      answer: arabic,
    };
  }

  return choice(
    id,
    "multiple-choice",
    pattern.id,
    `What does this mean? ${arabic}`,
    pattern.exampleEnglish,
    allPatterns.map((p) => p.exampleEnglish),
  );
}

/**
 * Turns a due SRS item into a synthetic Exercise, reusing the existing
 * ExerciseCard UI rather than building review-only components.
 */
export function buildReviewExercise(due: SRSItemState): Exercise | null {
  const item = findItem(due.itemId, due.itemType);
  if (!item) return null;

  const pick = <T,>(modes: readonly T[]): T => modes[due.repetitions % modes.length];

  if (due.itemType === "letter") return buildLetterExercise(item as Letter, pick(LETTER_MODES));
  if (due.itemType === "vocab") return buildVocabExercise(item as VocabWord, pick(VOCAB_MODES));
  return buildPatternExercise(item as SentencePattern, pick(PATTERN_MODES));
}
