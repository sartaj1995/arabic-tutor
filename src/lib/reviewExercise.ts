import type { Exercise, SRSItemState, Letter, VocabWord, SentencePattern } from "../types/content";
import { allLetters, allVocab, allPatterns, findItem } from "./content";
import { shuffle } from "./random";

function pickDistractors(pool: string[], exclude: string, count: number): string[] {
  const candidates = pool.filter((value) => value !== exclude);
  return shuffle(candidates).slice(0, count);
}

/**
 * Turns a due SRS item into a synthetic multiple-choice Exercise, reusing
 * the existing ExerciseCard/ChoiceExercise UI instead of building a
 * separate review-only component. Distractors are drawn from the global
 * pool of the same item type (all letters learned so far, all vocab, etc.),
 * degrading gracefully to fewer options if the pool is still small early on.
 */
export function buildReviewExercise(due: SRSItemState): Exercise | null {
  const item = findItem(due.itemId, due.itemType);
  if (!item) return null;

  let prompt: string;
  let answer: string;
  let distractorPool: string[];

  if (due.itemType === "letter") {
    const letter = item as Letter;
    prompt = `Which letter is this? ${letter.forms.isolated}`;
    answer = letter.name;
    distractorPool = allLetters.map((l) => l.name);
  } else if (due.itemType === "vocab") {
    const word = item as VocabWord;
    prompt = `What does '${word.arabic}' mean?`;
    answer = word.english;
    distractorPool = allVocab.map((v) => v.english);
  } else {
    const pattern = item as SentencePattern;
    prompt = `What does this mean? ${pattern.exampleArabic}`;
    answer = pattern.exampleEnglish;
    distractorPool = allPatterns.map((p) => p.exampleEnglish);
  }

  const distractors = pickDistractors(distractorPool, answer, 3);
  const options = shuffle([answer, ...distractors]);

  return {
    id: `review-${due.itemType}-${due.itemId}`,
    type: "multiple-choice",
    refIds: [due.itemId],
    prompt,
    options,
    answer,
  };
}
