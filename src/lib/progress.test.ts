// Dexie needs an IndexedDB implementation; this shim installs one globally and
// must be imported before anything that touches the database.
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";
import { computeProgressStats } from "./progress";
import { indexByLevel, isLevelComplete, nextIncompleteLevel } from "./completion";
import { levels, scoreableExercises } from "./content";
import { createSRSItem, dueCutoff } from "./srs";
import { db, type LevelProgress } from "./db";

/**
 * These pin down agreement between pages, not any particular completion rule.
 * The header, the home page and Progress each used to compute "complete" and
 * "due" separately, and showed contradictory numbers at the same moment.
 */

const DAY = 86_400_000;

function finished(levelNumber: number, total: number): LevelProgress {
  return {
    levelNumber,
    completed: true,
    completedAt: new Date(Date.now() - DAY).toISOString(),
    lastScore: total,
    lastScoreTotal: total,
  };
}

beforeEach(async () => {
  await db.srsItems.clear();
  await db.levelProgress.clear();
});

describe("completion agrees everywhere", () => {
  it("counts in Progress and the header exactly the levels the home page shows as complete", async () => {
    const [first, second, third] = levels;
    const rows: LevelProgress[] = [
      // Finished against the level's current exercise set.
      finished(first.number, scoreableExercises(first).length),
      // Finished before its exercise set changed, which is where pages diverged.
      finished(second.number, scoreableExercises(second).length + 5),
      // Started but never finished.
      { levelNumber: third.number, completed: false, completedAt: null },
    ];
    await db.levelProgress.bulkPut(rows);

    const byLevel = indexByLevel(rows);
    const homePageCount = levels.filter((l) => isLevelComplete(byLevel[l.number], l)).length;
    const stats = await computeProgressStats();

    expect(stats.levelsCompletedCount).toBe(homePageCount);
    expect(stats.nextLevelNumber).toBe(nextIncompleteLevel(byLevel)?.number ?? null);
  });

  it("treats a level finished against its current exercises as complete", () => {
    const level = levels[0];
    expect(isLevelComplete(finished(level.number, scoreableExercises(level).length), level)).toBe(
      true,
    );
  });

  it("never treats a missing or unfinished record as complete", () => {
    const level = levels[0];
    expect(isLevelComplete(undefined, level)).toBe(false);
    expect(
      isLevelComplete({ levelNumber: level.number, completed: false, completedAt: null }, level),
    ).toBe(false);
  });

  it("points the header at the first level not yet done, not at 'completed count + 1'", async () => {
    // Levels 2 and 3 done but not 1: the old header said "Level 3 of 100".
    const rows = [2, 3].map((n) => finished(n, scoreableExercises(levels[n - 1]).length));
    await db.levelProgress.bulkPut(rows);
    expect((await computeProgressStats()).nextLevelNumber).toBe(1);
  });

  it("reports no next level once every level is done", async () => {
    await db.levelProgress.bulkPut(
      levels.map((l) => finished(l.number, scoreableExercises(l).length)),
    );
    expect((await computeProgressStats()).nextLevelNumber).toBeNull();
  });
});

describe("due counts agree everywhere", () => {
  it("counts as due today exactly what the review queue will show", async () => {
    const now = new Date();
    const endOfToday = new Date(dueCutoff(now));
    // Later today (the case the pages disagreed on), already overdue, and tomorrow.
    const laterToday = new Date(now.getTime() + (endOfToday.getTime() - now.getTime()) / 2);
    await db.srsItems.bulkPut([
      { ...createSRSItem("qahwa", "vocab"), dueDate: laterToday.toISOString() },
      { ...createSRSItem("shay", "vocab"), dueDate: new Date(now.getTime() - DAY).toISOString() },
      { ...createSRSItem("khubz", "vocab"), dueDate: new Date(endOfToday.getTime() + 60_000).toISOString() },
    ]);

    // The query Review and the home page both run.
    const queue = await db.srsItems.where("dueDate").belowOrEqual(dueCutoff()).toArray();
    const stats = await computeProgressStats();

    expect(queue.map((i) => i.itemId).sort()).toEqual(["qahwa", "shay"]);
    expect(stats.reviewForecast.dueToday).toBe(queue.length);
  });
});
