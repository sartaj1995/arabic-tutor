import { afterEach, describe, expect, it, vi } from "vitest";
import { applyReview, createSRSItem, daysUntilDue, dueCutoff } from "./srs";
import type { SRSItemState } from "../types/content";

function item(overrides: Partial<SRSItemState> = {}): SRSItemState {
  return { ...createSRSItem("test", "vocab"), ...overrides };
}

/** Whole days between an ISO date and now. Normalises -0, which a due-now
 *  item produces and which Object.is treats as distinct from 0. */
function daysFromNow(iso: string): number {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return days === 0 ? 0 : days;
}

describe("createSRSItem", () => {
  it("starts a new item due immediately and unreviewed", () => {
    const fresh = createSRSItem("qahwa", "vocab");
    expect(fresh).toMatchObject({ itemId: "qahwa", itemType: "vocab", interval: 0, repetitions: 0 });
    expect(fresh.lastReviewed).toBeNull();
    expect(daysFromNow(fresh.dueDate)).toBe(0);
  });
});

describe("applyReview — correct answers", () => {
  it("walks the interval up 1 → 6 → interval × ease", () => {
    const first = applyReview(item(), true);
    expect(first.repetitions).toBe(1);
    expect(first.interval).toBe(1);
    expect(daysFromNow(first.dueDate)).toBe(1);

    const second = applyReview(first, true);
    expect(second.repetitions).toBe(2);
    expect(second.interval).toBe(6);

    // ease has grown to 2.7 by now, so 6 × 2.7 = 16.2 → 16
    const third = applyReview(second, true);
    expect(third.repetitions).toBe(3);
    expect(third.interval).toBe(Math.round(6 * second.ease));
  });

  it("raises ease but never past the ceiling", () => {
    let state = item({ ease: 2.95 });
    state = applyReview(state, true);
    expect(state.ease).toBeCloseTo(3.0, 5);
    state = applyReview(state, true);
    expect(state.ease).toBeCloseTo(3.0, 5);
  });

  it("records when it was reviewed", () => {
    expect(applyReview(item(), true).lastReviewed).not.toBeNull();
  });
});

describe("applyReview — lapses", () => {
  it("resets progress and schedules immediate re-review", () => {
    // A mature item that is then missed. reviewExercise keys its question mode
    // off repetitions, so this reset is also what drops a lapsed item back to
    // the easiest recognition prompt.
    const mature = item({ interval: 15, ease: 2.8, repetitions: 4 });
    const lapsed = applyReview(mature, false);

    expect(lapsed.repetitions).toBe(0);
    expect(lapsed.interval).toBe(0);
    expect(daysFromNow(lapsed.dueDate)).toBe(0);
  });

  it("lowers ease but never past the floor", () => {
    let state = item({ ease: 1.4 });
    state = applyReview(state, false);
    expect(state.ease).toBeCloseTo(1.3, 5);
    state = applyReview(state, false);
    expect(state.ease).toBeCloseTo(1.3, 5);
  });

  it("keeps the item's identity intact", () => {
    const state = applyReview(item({ itemId: "alif", itemType: "letter" }), false);
    expect(state).toMatchObject({ itemId: "alif", itemType: "letter" });
  });
});

describe("dueCutoff", () => {
  // Built from local-time parts, since "today" is the learner's own calendar day.
  const nineAm = new Date(2026, 8, 16, 9, 0);

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts anything due later today as due", () => {
    expect(new Date(2026, 8, 16, 21, 0).toISOString() <= dueCutoff(nineAm)).toBe(true);
    expect(new Date(2026, 8, 16, 23, 59).toISOString() <= dueCutoff(nineAm)).toBe(true);
  });

  it("does not count tomorrow, even just after midnight", () => {
    expect(new Date(2026, 8, 17, 0, 1).toISOString() <= dueCutoff(nineAm)).toBe(false);
  });

  it("extends to the end of a later day for forecasts", () => {
    expect(new Date(2026, 8, 23, 22, 0).toISOString() <= dueCutoff(nineAm, 7)).toBe(true);
    expect(new Date(2026, 8, 24, 0, 1).toISOString() <= dueCutoff(nineAm, 7)).toBe(false);
  });

  it("makes a word reviewed last night reviewable the next morning", () => {
    // The reported bug: reviewed at 9pm with a one-day interval, the word was
    // locked until 9pm the next day, while Progress listed it as due today.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 15, 21, 0));
    const reviewed = applyReview(createSRSItem("qahwa", "vocab"), true);

    vi.setSystemTime(nineAm);
    expect(reviewed.dueDate <= new Date().toISOString()).toBe(false); // the old rule
    expect(reviewed.dueDate <= dueCutoff()).toBe(true);
  });
});

describe("daysUntilDue", () => {
  const now = new Date(2026, 8, 16, 23, 30);

  it("counts calendar days, not 24-hour periods", () => {
    // Half an hour away, but tomorrow.
    expect(daysUntilDue(new Date(2026, 8, 17, 0, 0).toISOString(), now)).toBe(1);
    expect(daysUntilDue(new Date(2026, 8, 16, 8, 0).toISOString(), now)).toBe(0);
    expect(daysUntilDue(new Date(2026, 8, 19, 12, 0).toISOString(), now)).toBe(3);
  });
});
