import { describe, expect, it } from "vitest";
import {
  filterGlossary,
  foldLatin,
  glossaryEntries,
  glossaryKindCounts,
  glossaryTags,
} from "./glossary";
import { allLetters, allVocab, allPatterns } from "./content";

describe("foldLatin", () => {
  it("strips the transliteration scheme's diacritics", () => {
    // Without this the glossary is barely usable: nobody types ṣadīqun.
    expect(foldLatin("ṣadīqun")).toBe("sadiqun");
    expect(foldLatin("as-salāmu ʿalaykum")).toBe("as-salamu alaykum");
    expect(foldLatin("ḥaqībatun")).toBe("haqibatun");
    expect(foldLatin("ṭāʾiratun")).toBe("tairatun");
    expect(foldLatin("ẓuhr")).toBe("zuhr");
    expect(foldLatin("ḍaghṭ")).toBe("daght");
  });

  it("lowercases so search is case-insensitive", () => {
    expect(foldLatin("Bāʾ")).toBe("ba");
  });

  it("leaves plain ASCII alone", () => {
    expect(foldLatin("a friend")).toBe("a friend");
  });
});

describe("glossary entries", () => {
  it("covers every letter, word and pattern exactly once", () => {
    expect(glossaryEntries).toHaveLength(
      allLetters.length + allVocab.length + allPatterns.length,
    );
    const ids = glossaryEntries.map((e) => `${e.kind}:${e.id}`);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is ordered by the level that teaches each entry", () => {
    const levelsInOrder = glossaryEntries.map((e) => e.level);
    expect([...levelsInOrder].sort((a, b) => a - b)).toEqual(levelsInOrder);
  });

  it("gives every entry something to search and something to speak", () => {
    for (const entry of glossaryEntries) {
      expect(entry.search.length, `${entry.id} has no search text`).toBeGreaterThan(0);
      expect(entry.audioText.length, `${entry.id} has no audio text`).toBeGreaterThan(0);
    }
  });

  it("only tags vocabulary, since the content model has no tags elsewhere", () => {
    for (const entry of glossaryEntries) {
      if (entry.kind !== "vocab") expect(entry.tags, `${entry.id}`).toEqual([]);
    }
    expect(glossaryTags.length).toBeGreaterThan(0);
  });
});

describe("filterGlossary", () => {
  const noFilters = { query: "", kind: null, unitIndex: null, tag: null };

  it("returns everything when nothing is set", () => {
    expect(filterGlossary(noFilters)).toHaveLength(glossaryEntries.length);
  });

  it("finds an accented transliteration from an unaccented query", () => {
    const hits = filterGlossary({ ...noFilters, query: "sadiq" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((e) => e.transliteration.includes("ṣadīq"))).toBe(true);
  });

  it("searches the English gloss too", () => {
    const hits = filterGlossary({ ...noFilters, query: "coffee" });
    expect(hits.some((e) => e.english === "coffee")).toBe(true);
  });

  it("narrows rather than widens with multiple terms", () => {
    const go = filterGlossary({ ...noFilters, query: "go" });
    const both = filterGlossary({ ...noFilters, query: "go school" });
    expect(both.length).toBeLessThan(go.length);
    for (const entry of both) {
      expect(entry.search).toContain("go");
      expect(entry.search).toContain("school");
    }
  });

  it("ignores surrounding whitespace", () => {
    expect(filterGlossary({ ...noFilters, query: "  coffee  " })).toEqual(
      filterGlossary({ ...noFilters, query: "coffee" }),
    );
  });

  it("limits a unit to its ten levels", () => {
    const unit = filterGlossary({ ...noFilters, unitIndex: 9 });
    expect(unit.length).toBeGreaterThan(0);
    for (const entry of unit) {
      expect(entry.level).toBeGreaterThanOrEqual(91);
      expect(entry.level).toBeLessThanOrEqual(100);
    }
  });

  it("returns only vocabulary when a tag is chosen", () => {
    const tagged = filterGlossary({ ...noFilters, tag: "food" });
    expect(tagged.length).toBeGreaterThan(0);
    for (const entry of tagged) {
      expect(entry.kind).toBe("vocab");
      expect(entry.tags).toContain("food");
    }
  });

  it("composes filters", () => {
    const combined = filterGlossary({ query: "", kind: null, unitIndex: 9, tag: "verb" });
    for (const entry of combined) {
      expect(entry.kind).toBe("vocab");
      expect(entry.tags).toContain("verb");
      expect(entry.level).toBeGreaterThanOrEqual(91);
    }
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(filterGlossary({ ...noFilters, query: "zzzznomatch" })).toEqual([]);
  });

  it("narrows to one kind, and the kinds partition the whole glossary", () => {
    // The primary filter has to be exhaustive: every entry belongs to exactly
    // one of the three buttons, or "All" would show more than they sum to.
    let total = 0;
    for (const kind of ["letter", "vocab", "pattern"] as const) {
      const only = filterGlossary({ ...noFilters, kind });
      expect(only.length, kind).toBe(glossaryKindCounts[kind]);
      for (const entry of only) expect(entry.kind).toBe(kind);
      total += only.length;
    }
    expect(total).toBe(glossaryEntries.length);
  });

  it("composes the kind filter with the others", () => {
    const patterns = filterGlossary({ ...noFilters, kind: "pattern", unitIndex: 0 });
    expect(patterns.length).toBeGreaterThan(0);
    for (const entry of patterns) {
      expect(entry.kind).toBe("pattern");
      expect(entry.level).toBeLessThanOrEqual(10);
    }
  });

  it("yields nothing when a tag is combined with a kind that carries no tags", () => {
    // The page prevents this pairing by clearing the tag when a non-word kind
    // is chosen; the filter itself still has to answer it honestly.
    expect(filterGlossary({ ...noFilters, kind: "letter", tag: "food" })).toEqual([]);
  });
});
