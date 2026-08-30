// Arabic diacritics (tashkeel: fatha, damma, kasra, sukun, shadda, tanwin,
// dagger alif, Quranic annotation marks) plus tatweel (kashida) — stripped
// out so typed/assembled answers can be compared leniently against the
// fully-diacritized answer strings stored in content JSON.
const DIACRITICS_REGEX =
  /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;

export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICS_REGEX, "");
}

export function normalizeArabic(text: string): string {
  return stripDiacritics(text).trim().replace(/\s+/g, " ");
}

/**
 * Whether a string contains Arabic script, used to tag elements with
 * lang="ar" so screen readers switch to an Arabic voice instead of reading
 * the letters through an English one. Exercise options and answers are
 * wholly one language or the other, so a simple presence check is enough.
 */
export function containsArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}
