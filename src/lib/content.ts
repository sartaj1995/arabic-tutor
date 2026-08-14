import type { Level, Letter, VocabWord, SentencePattern, SRSItemType } from "../types/content";

const modules = import.meta.glob("/content/levels/*.json", {
  eager: true,
}) as Record<string, { default: Level }>;

export const levels: Level[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.number - b.number);

export function getLevel(number: number): Level | undefined {
  return levels.find((level) => level.number === number);
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
