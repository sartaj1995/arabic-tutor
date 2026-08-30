import { allLetters, allVocab, allPatterns } from "./content";

export type GlossaryKind = "letter" | "vocab" | "pattern";

export interface GlossaryEntry {
  id: string;
  kind: GlossaryKind;
  level: number;
  /** Arabic to render RTL — a glyph, a word, or a whole example sentence. */
  arabic: string;
  transliteration: string;
  /** Primary English gloss. */
  english: string;
  /** Secondary line: part of speech, the letter's sound, or the pattern shape. */
  detail: string;
  tags: string[];
  /** Text for the 🔊 button to speak. */
  audioText: string;
  /** Pre-folded haystack of gloss + transliteration, built once at load. */
  search: string;
}

/**
 * Folds a Latin-script string for searching: strips the diacritics used by the
 * transliteration scheme so "sadiq" finds "ṣadīqun" and "salam" finds
 * "as-salāmu". NFD splits ā/ī/ū/ḥ/ṣ/ṭ/ḍ/ẓ into a base letter plus a combining
 * mark; ʿ and ʾ are standalone characters rather than marks, so they need
 * removing separately.
 */
export function foldLatin(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʿʾʻʼ`´'’]/g, "")
    .toLowerCase();
}

// Letters and patterns carry no tags in the content model — only vocab does —
// so a tag filter necessarily narrows to vocabulary. That's the honest
// behaviour rather than inventing tags the content doesn't have.
const entries: GlossaryEntry[] = [
  ...allLetters.map<GlossaryEntry>((l) => ({
    id: l.id,
    kind: "letter",
    level: l.introducedInLevel,
    arabic: l.forms.isolated,
    transliteration: l.name,
    english: l.sound,
    detail: `letter · ${l.transliteration}`,
    tags: [],
    audioText: l.audio.text,
    search: foldLatin(`${l.name} ${l.sound} ${l.transliteration}`),
  })),
  ...allVocab.map<GlossaryEntry>((v) => ({
    id: v.id,
    kind: "vocab",
    level: v.introducedInLevel,
    arabic: v.arabic,
    transliteration: v.transliteration,
    english: v.english,
    detail: v.partOfSpeech,
    tags: v.tags ?? [],
    audioText: v.audio.text,
    search: foldLatin(`${v.english} ${v.transliteration}`),
  })),
  ...allPatterns.map<GlossaryEntry>((p) => ({
    id: p.id,
    kind: "pattern",
    level: p.introducedInLevel,
    arabic: p.exampleArabic,
    transliteration: p.exampleTransliteration,
    english: p.exampleEnglish,
    detail: p.pattern,
    tags: [],
    audioText: p.audio.text,
    search: foldLatin(`${p.exampleEnglish} ${p.exampleTransliteration}`),
  })),
];

const KIND_ORDER: Record<GlossaryKind, number> = { letter: 0, vocab: 1, pattern: 2 };

/** Everything in the curriculum, ordered the way it was taught. */
export const glossaryEntries: GlossaryEntry[] = entries.sort(
  (a, b) => a.level - b.level || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.id.localeCompare(b.id),
);

/** Every tag in use, most common first — the content model has no fixed list. */
export const glossaryTags: string[] = (() => {
  const counts = new Map<string, number>();
  for (const entry of glossaryEntries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
})();

export interface GlossaryFilters {
  query: string;
  /** 0-based unit index, or null for every level. */
  unitIndex: number | null;
  tag: string | null;
}

export function filterGlossary(filters: GlossaryFilters): GlossaryEntry[] {
  const needle = foldLatin(filters.query.trim());
  const terms = needle ? needle.split(/\s+/) : [];

  return glossaryEntries.filter((entry) => {
    if (filters.tag && !entry.tags.includes(filters.tag)) return false;
    if (filters.unitIndex !== null) {
      const first = filters.unitIndex * 10 + 1;
      if (entry.level < first || entry.level > first + 9) return false;
    }
    // Every term must match, so "go school" narrows rather than widens.
    return terms.every((term) => entry.search.includes(term));
  });
}
