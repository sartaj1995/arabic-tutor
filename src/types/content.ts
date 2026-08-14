// Core content data model for the Arabic tutor app.
// See docs/content-model.md for the design rationale behind this shape.

export type ExerciseType =
  | "letter-recognition" // see/hear a letter, identify its name or sound
  | "letter-writing" // pick/trace the correct written form of a letter
  | "multiple-choice" // word/phrase -> meaning, or meaning -> word/phrase
  | "matching" // match pairs (e.g. word <-> picture, word <-> meaning)
  | "audio-recognition" // hear audio, pick the matching word/phrase
  | "typing" // type the Arabic word/phrase using the on-screen keyboard
  | "speaking" // record yourself, compare to reference audio (self-check only)
  | "sentence-build"; // arrange words/tiles into the correct sentence order

export interface AudioRef {
  /** Unique key. Maps to a pre-generated static file at /audio/{id}.mp3 */
  id: string;
  /** The exact Arabic text (with diacritics) the TTS pipeline should speak. */
  text: string;
}

export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface Letter {
  id: string; // e.g. "alif", "ba", "tha"
  forms: LetterForms;
  name: string; // transliterated name, e.g. "Bāʾ"
  sound: string; // plain-English description of the sound
  transliteration: string; // e.g. "b"
  shapeFamily: string; // group id, e.g. "ba-family" — letters that share a skeleton
  audio: AudioRef;
  introducedInLevel: number;
}

export interface VocabWord {
  id: string;
  arabic: string; // fully diacritized (tashkeel)
  arabicNoDiacritics: string;
  transliteration: string;
  english: string;
  partOfSpeech: string;
  audio: AudioRef;
  introducedInLevel: number;
  /**
   * "core" = high-frequency survival word taught by whole-word audio
   * recognition even if it uses letters not yet formally covered.
   * Letter literacy and vocabulary are deliberately separate, converging
   * tracks — see docs/content-model.md.
   */
  tags?: string[];
}

export interface SentencePattern {
  id: string;
  pattern: string; // e.g. "[Demonstrative] + [Noun]"
  exampleArabic: string;
  exampleTransliteration: string;
  exampleEnglish: string;
  grammarNote: string;
  audio: AudioRef;
  introducedInLevel: number;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  /** ids of letters/vocab/patterns this exercise draws on */
  refIds: string[];
  prompt: string;
  options?: string[]; // for multiple-choice / matching
  answer: string;
}

export type DiacriticsLevel = "full" | "partial" | "none";

export interface Level {
  number: number;
  title: string;
  newLetters: string[]; // Letter ids introduced this level
  newVocab: string[]; // VocabWord ids introduced this level
  newPatterns: string[]; // SentencePattern ids introduced this level
  /**
   * How much tashkeel (vowel diacritics) is shown by default this level.
   * Fades from "full" toward "none" over the course of the curriculum so
   * reading ability transfers to real, undiacritized Arabic text.
   */
  diacriticsLevel: DiacriticsLevel;
  exercises: Exercise[];
  letters: Letter[];
  vocab: VocabWord[];
  patterns: SentencePattern[];
}

// --- Spaced repetition (runtime state, not authored content) ---

export type SRSItemType = "letter" | "vocab" | "pattern";

export interface SRSItemState {
  itemId: string;
  itemType: SRSItemType;
  interval: number; // days until next review
  ease: number; // ease factor, SM-2 style
  dueDate: string; // ISO date
  lastReviewed: string | null;
  repetitions: number;
}
