import { describe, expect, it } from "vitest";
import { containsArabic, normalizeArabic, stripDiacritics } from "./arabic";

describe("stripDiacritics", () => {
  it("removes tashkeel but keeps the letters", () => {
    expect(stripDiacritics("ذَهَبْتُ")).toBe("ذهبت");
    expect(stripDiacritics("مُدَرِّسُونَ")).toBe("مدرسون");
  });

  it("keeps hamza carriers, which are letters rather than marks", () => {
    // The most common authoring slip is writing a bare ا where the
    // diacritized form has أ / إ / آ, so pin the distinction down.
    expect(stripDiacritics("أَنْتَ")).toBe("أنت");
    expect(stripDiacritics("إِلَى")).toBe("إلى");
    expect(stripDiacritics("آخُذُ")).toBe("آخذ");
    expect(stripDiacritics("طَائِرَةٌ")).toBe("طائرة");
  });

  it("collapses the documented homographs", () => {
    // Vowel-only distinctions really are identical once stripped — this is
    // why several past-tense forms share a single vocab entry.
    expect(stripDiacritics("أَنْتَ")).toBe(stripDiacritics("أَنْتِ"));
    expect(stripDiacritics("لَسْتُ")).toBe(stripDiacritics("لَسْتِ"));
  });

  it("strips tatweel", () => {
    expect(stripDiacritics("كــتــاب")).toBe("كتاب");
  });
});

describe("normalizeArabic", () => {
  it("strips diacritics, trims, and collapses whitespace for lenient grading", () => {
    expect(normalizeArabic("  ذَهَبْتُ   إِلَى  ")).toBe("ذهبت إلى");
  });

  it("treats a typed bare answer as equal to the diacritized target", () => {
    expect(normalizeArabic("قهوة")).toBe(normalizeArabic("قَهْوَةٌ"));
  });
});

describe("containsArabic", () => {
  it("detects Arabic script and ignores plain English", () => {
    expect(containsArabic("قهوة")).toBe(true);
    expect(containsArabic("coffee")).toBe(false);
    // Mixed strings count as Arabic — used to decide lang="ar".
    expect(containsArabic("What does 'ذهبت' mean?")).toBe(true);
  });
});
