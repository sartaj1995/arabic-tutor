import type { Level, Letter, VocabWord, SentencePattern, SRSItemType, Exercise } from "../types/content";

const modules = import.meta.glob("/content/levels/*.json", {
  eager: true,
}) as Record<string, { default: Level }>;

export const levels: Level[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.number - b.number);

export function getLevel(number: number): Level | undefined {
  return levels.find((level) => level.number === number);
}

// Speaking exercises are self-check only and excluded from scoring — see
// LevelDetail. Shared here so a saved score's total can be validated
// against the level's *current* exercise set, not just trusted blindly:
// content (like the exercise-depth pass) can change the count after a
// completion record was already saved.
export function scoreableExercises(level: Level): Exercise[] {
  return level.exercises.filter((e) => e.type !== "speaking");
}

// Flattened across every level — spaced-repetition review spans everything
// the learner has completed so far, not just the level currently being viewed.
export const allLetters: Letter[] = levels.flatMap((level) => level.letters);
export const allVocab: VocabWord[] = levels.flatMap((level) => level.vocab);
export const allPatterns: SentencePattern[] = levels.flatMap((level) => level.patterns);

export function findItem(
  itemId: string,
  itemType: SRSItemType,
): Letter | VocabWord | SentencePattern | undefined {
  if (itemType === "letter") return allLetters.find((l) => l.id === itemId);
  if (itemType === "vocab") return allVocab.find((v) => v.id === itemId);
  return allPatterns.find((p) => p.id === itemId);
}
