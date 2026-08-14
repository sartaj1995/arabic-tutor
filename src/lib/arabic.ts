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
