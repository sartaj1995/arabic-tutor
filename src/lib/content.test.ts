import { describe, expect, it } from "vitest";
import { levels, allLetters, allVocab, allPatterns } from "./content";
import { stripDiacritics } from "./arabic";

/**
 * Structural checks over the authored curriculum. These ran as an ad-hoc
 * script during every authoring batch and caught a real bug each time; now
 * that all 100 levels are written the content can only regress, so they run
 * with the rest of the suite.
 */

const TOTAL_LEVELS = 100;

/**
 * Vowel-only distinctions that genuinely collapse to the same letters once
 * tashkeel is stripped. Unavoidable in undiacritized Arabic and documented in
 * docs/content-model.md — native readers disambiguate from context. Listed
 * here so the test still catches any *new* collision.
 */
const KNOWN_STRIPPED_COLLISIONS: Record<string, string[]> = {
  أنت: ["anta", "anti"],
  بيتك: ["baytuka", "baytuki"],
  لست: ["lastu", "lasta", "lasti"],
  مدرسة: ["madrasa", "mudarrisa"],
};

describe("level files", () => {
  it("has every level from 1 to 100 exactly once, in order", () => {
    expect(levels).toHaveLength(TOTAL_LEVELS);
    expect(levels.map((l) => l.number)).toEqual(
      Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1),
    );
  });

  it("declares content arrays that match the new* id lists", () => {
    for (const level of levels) {
      expect([...level.newLetters].sort(), `level ${level.number} newLetters`).toEqual(
        level.letters.map((l) => l.id).sort(),
      );
      expect([...level.newVocab].sort(), `level ${level.number} newVocab`).toEqual(
        level.vocab.map((v) => v.id).sort(),
      );
      expect([...level.newPatterns].sort(), `level ${level.number} newPatterns`).toEqual(
        level.patterns.map((p) => p.id).sort(),
      );
    }
  });

  it("stamps every item with the level that introduces it", () => {
    for (const level of levels) {
      for (const item of [...level.letters, ...level.vocab, ...level.patterns]) {
        expect(item.introducedInLevel, `${item.id} in level ${level.number}`).toBe(level.number);
      }
    }
  });

  it("fades diacritics on the documented schedule", () => {
    for (const level of levels) {
      const expected =
        level.number <= 8 ? "full" : level.number <= 15 ? "partial" : "none";
      expect(level.diacriticsLevel, `level ${level.number}`).toBe(expected);
    }
  });
});

describe("content ids", () => {
  it("are unique across every content type", () => {
    // Not merely tidiness: ids are global handles. db.srsItems is keyed by
    // itemId alone, so two items sharing an id means the second never gets
    // its own spaced-repetition record, and Review's audio index would
    // resolve the wrong text for one of them.
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    const record = (id: string, where: string) => {
      const previous = seen.get(id);
      if (previous) duplicates.push(`${id} (${previous} and ${where})`);
      else seen.set(id, where);
    };

    for (const letter of allLetters) record(letter.id, `letter L${letter.introducedInLevel}`);
    for (const word of allVocab) record(word.id, `vocab L${word.introducedInLevel}`);
    for (const pattern of allPatterns) record(pattern.id, `pattern L${pattern.introducedInLevel}`);

    expect(duplicates).toEqual([]);
  });

  it("gives every exercise a unique id within its level", () => {
    for (const level of levels) {
      const ids = level.exercises.map((e) => e.id);
      expect(new Set(ids).size, `level ${level.number} has duplicate exercise ids`).toBe(
        ids.length,
      );
    }
  });
});

describe("exercise references", () => {
  it("only reference content introduced at or before their own level", () => {
    const introducedAt = new Map<string, number>();
    for (const item of [...allLetters, ...allVocab, ...allPatterns]) {
      introducedAt.set(item.id, item.introducedInLevel);
    }

    const problems: string[] = [];
    for (const level of levels) {
      for (const exercise of level.exercises) {
        for (const refId of exercise.refIds) {
          const from = introducedAt.get(refId);
          if (from === undefined) problems.push(`${exercise.id}: unknown refId "${refId}"`);
          else if (from > level.number) {
            problems.push(`${exercise.id}: refs "${refId}" from later level ${from}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("offers the correct answer among the options of every choice exercise", () => {
    const problems: string[] = [];
    for (const level of levels) {
      for (const exercise of level.exercises) {
        // sentence-build is excluded by design: its options are tiles and its
        // answer is the assembled sentence, checked separately below.
        if (!exercise.options || exercise.type === "sentence-build") continue;
        if (!exercise.options.includes(exercise.answer)) {
          problems.push(`${exercise.id}: answer missing from options`);
        }
        if (new Set(exercise.options).size !== exercise.options.length) {
          problems.push(`${exercise.id}: duplicate options`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("builds sentence-build answers exactly from their tiles", () => {
    // ExerciseCard joins the tapped tiles with single spaces and compares, so
    // a tile set that doesn't reassemble into the answer is unanswerable.
    const problems: string[] = [];
    for (const level of levels) {
      for (const exercise of level.exercises) {
        if (exercise.type !== "sentence-build") continue;
        const joined = (exercise.options ?? []).join(" ");
        if (joined !== exercise.answer) {
          problems.push(`${exercise.id}: tiles join to "${joined}" not "${exercise.answer}"`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("undiacritized collisions", () => {
  it("introduces no vocabulary that collides beyond the documented set", () => {
    const byStripped = new Map<string, string[]>();
    for (const word of allVocab) {
      const key = stripDiacritics(word.arabic).trim();
      byStripped.set(key, [...(byStripped.get(key) ?? []), word.id]);
    }

    const collisions: Record<string, string[]> = {};
    for (const [stripped, ids] of byStripped) {
      if (ids.length > 1) collisions[stripped] = ids.sort();
    }

    const expected = Object.fromEntries(
      Object.entries(KNOWN_STRIPPED_COLLISIONS).map(([k, v]) => [k, [...v].sort()]),
    );
    expect(collisions).toEqual(expected);
  });

  it("stores arabicNoDiacritics consistently with arabic", () => {
    // The stripped field is hand-authored and easy to get wrong — most often
    // by writing a bare alif where the diacritized form has أ / إ / آ.
    const problems: string[] = [];
    for (const word of allVocab) {
      const derived = stripDiacritics(word.arabic);
      if (derived !== word.arabicNoDiacritics) {
        problems.push(`${word.id}: stored "${word.arabicNoDiacritics}" but strips to "${derived}"`);
      }
    }
    expect(problems).toEqual([]);
  });
});
