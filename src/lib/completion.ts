import type { Level } from "../types/content";
import type { LevelProgress } from "./db";
import { levels, scoreableExercises } from "./content";

/**
 * Whether a level counts as complete: the single definition behind the home
 * page, the level page, the header's "Level N of 100" and the Progress page.
 *
 * They used to disagree. The home page only accepted a completion earned
 * against the level's *current* exercise set, while the header and Progress
 * accepted any saved completion. So whenever content changed a level's
 * exercise count, as the level 58 expansion did, one learner could see
 * "Level 59 of 100" in the header and level 58 as "Continue →" on the home
 * page at the same time.
 *
 * `record.lastScoreTotal` is how many scoreable exercises the level had when
 * the learner finished it; `scoreableExercises(level).length` is how many it
 * has now.
 */
export function isLevelComplete(record: LevelProgress | undefined, level: Level): boolean {
  // A completion counts only if it was earned against the level's current
  // exercise set, so when content adds or removes exercises the learner is
  // asked to finish the level again. This was the home page's rule and is now
  // the rule everywhere. The alternative, keeping a level complete across
  // content changes, would never hide progress but could let new exercises go
  // unseen.
  return !!record?.completed && record.lastScoreTotal === scoreableExercises(level).length;
}

/** The first level, in course order, that isn't complete; undefined once all are. */
export function nextIncompleteLevel(
  progressByLevel: Partial<Record<number, LevelProgress>>,
): Level | undefined {
  return levels.find((level) => !isLevelComplete(progressByLevel[level.number], level));
}

/** Indexes saved progress rows by level number, the shape the helpers above take. */
export function indexByLevel(rows: LevelProgress[]): Partial<Record<number, LevelProgress>> {
  const byLevel: Partial<Record<number, LevelProgress>> = {};
  for (const row of rows) byLevel[row.levelNumber] = row;
  return byLevel;
}
