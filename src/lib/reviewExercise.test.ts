import { describe, expect, it } from "vitest";
import { buildReviewExercise } from "./reviewExercise";
import { createSRSItem } from "./srs";
import { allVocab, levels } from "./content";
import { stripDiacritics } from "./arabic";
import type { SRSItemState, SRSItemType } from "../types/content";

function due(itemId: string, itemType: SRSItemType, repetitions: number): SRSItemState {
  return { ...createSRSItem(itemId, itemType), repetitions };
}

/** Every review exercise the curriculum can currently produce. */
function everyExercise() {
  const out = [];
  for (const level of levels) {
    for (const [items, type] of [
      [level.letters, "letter"],
      [level.vocab, "vocab"],
      [level.patterns, "pattern"],
    ] as const) {
      for (const item of items) {
        // 6 covers a full cycle of every mode list (4, 4 and 2 long).
        for (let reps = 0; reps < 6; reps++) {
          const exercise = buildReviewExercise(due(item.id, type, reps));
          if (exercise) out.push({ exercise, item, type, reps });
        }
      }
    }
  }
  return out;
}

describe("mode selection", () => {
  it("cycles vocabulary through recognition, recall, audio and typing", () => {
    const modes = [0, 1, 2, 3].map((r) => buildReviewExercise(due("qahwa", "vocab", r))!);
    expect(modes.map((e) => e.type)).toEqual([
      "multiple-choice",
      "multiple-choice",
      "audio-recognition",
      "typing",
    ]);
    // The two multiple-choice modes ask opposite directions.
    expect(modes[0].prompt).toContain("mean");
    expect(modes[1].prompt).toContain("Which word means");
  });

  it("wraps back to the start after a full cycle", () => {
    const first = buildReviewExercise(due("qahwa", "vocab", 0))!;
    const fifth = buildReviewExercise(due("qahwa", "vocab", 4))!;
    expect(fifth.type).toBe(first.type);
    expect(fifth.prompt).toBe(first.prompt);
  });

  it("returns a lapsed item to the easiest mode", () => {
    // applyReview zeroes repetitions on a miss, so this is what a learner
    // actually sees the next time a forgotten word comes round.
    expect(buildReviewExercise(due("qahwa", "vocab", 0))!.type).toBe("multiple-choice");
  });

  it("rotates letters through the joining forms", () => {
    const prompts = [0, 1, 2, 3].map((r) => buildReviewExercise(due("ba", "letter", r))!.prompt);
    expect(prompts[0]).toContain("Which letter is this?");
    expect(prompts[1]).toContain("initial");
    expect(prompts[2]).toContain("medial");
    expect(prompts[3]).toContain("final");
  });

  it("returns null for an id the content no longer has", () => {
    expect(buildReviewExercise(due("no-such-item", "vocab", 0))).toBeNull();
  });
});

describe("invariants across every generated exercise", () => {
  const all = everyExercise();

  it("generates something for every item at every point in its cycle", () => {
    expect(all.length).toBeGreaterThan(3000);
  });

  it("never produces a speaking exercise", () => {
    // Speaking reports "unscored", and Review grades with result === "correct",
    // so a speaking exercise in the queue would be recorded as a miss and
    // wrongly tank the item's ease. Guarded here rather than by comment alone.
    expect(all.filter(({ exercise }) => exercise.type === "speaking")).toEqual([]);
  });

  it("always offers the answer among the options, with no duplicates", () => {
    const problems: string[] = [];
    for (const { exercise } of all) {
      if (!exercise.options || exercise.type === "sentence-build") continue;
      if (!exercise.options.includes(exercise.answer)) {
        problems.push(`${exercise.id}: answer missing from options`);
      }
      if (new Set(exercise.options).size !== exercise.options.length) {
        // Stripping diacritics collapses homographs, so distractors must be
        // deduped as rendered or a question becomes unanswerable.
        problems.push(`${exercise.id}: duplicate options ${JSON.stringify(exercise.options)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("always references the item under review", () => {
    for (const { exercise, item } of all) expect(exercise.refIds).toContain(item.id);
  });

  it("builds sentence-build tiles that reassemble into the answer", () => {
    // Compared as a multiset, not in order: review deliberately shuffles the
    // tray, so the tiles must be exactly the answer's words in *some* order.
    const problems: string[] = [];
    for (const { exercise } of all) {
      if (exercise.type !== "sentence-build") continue;
      const tiles = [...(exercise.options ?? [])].sort();
      const words = exercise.answer.split(/\s+/).sort();
      if (tiles.join("|") !== words.join("|")) {
        problems.push(`${exercise.id}: tiles ${tiles.join(" ")} ≠ answer words`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("diacritics follow the introducing level", () => {
  it("shows no tashkeel for vocabulary taught after the fade-out", () => {
    // Review used to render word.arabic verbatim, which meant a learner
    // trained on bare text got the vowelled form back — easier than the level
    // it came from.
    const late = allVocab.find((v) => v.introducedInLevel >= 16 && v.arabic !== stripDiacritics(v.arabic))!;
    const exercise = buildReviewExercise(due(late.id, "vocab", 1))!;
    expect(exercise.answer).toBe(stripDiacritics(late.arabic));
  });

  it("keeps tashkeel for vocabulary taught while it was still shown", () => {
    const early = allVocab.find((v) => v.introducedInLevel <= 8 && v.arabic !== stripDiacritics(v.arabic))!;
    const exercise = buildReviewExercise(due(early.id, "vocab", 1))!;
    expect(exercise.answer).toBe(early.arabic);
  });

  it("renders distractors in the same style as the answer", () => {
    // Mixing styles would make the odd one out visually obvious.
    const late = allVocab.find((v) => v.introducedInLevel >= 16)!;
    const exercise = buildReviewExercise(due(late.id, "vocab", 1))!;
    for (const option of exercise.options!) {
      expect(option, `"${option}" should carry no tashkeel`).toBe(stripDiacritics(option));
    }
  });
});
