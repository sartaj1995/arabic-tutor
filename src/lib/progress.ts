import { db } from "./db";
import { levels } from "./content";
import { indexByLevel, isLevelComplete, nextIncompleteLevel } from "./completion";
import { dueCutoff } from "./srs";

const TOTAL_PLANNED_LEVELS = 100;
// Mastery follows repetitions rather than a raw interval cutoff, since it
// maps directly onto the SM-2 algorithm in srs.ts: 0 = never answered
// correctly, 1-2 = still short-interval "learning", 3+ = the interval has
// compounded (interval * ease) at least once, i.e. genuinely retained.
const MASTERED_AT_REPETITIONS = 3;

export interface ProgressStats {
  levelsCompletedCount: number;
  /** The level the learner should do next; null once every level is complete. */
  nextLevelNumber: number | null;
  levelsAuthoredCount: number;
  totalPlannedLevels: number;
  averageScorePercent: number | null;
  itemsLearned: { letters: number; vocab: number; patterns: number; total: number };
  mastery: { new: number; learning: number; mastered: number };
  streakDays: number;
  reviewForecast: { dueToday: number; dueThisWeek: number; dueLater: number };
}

// Local-time date key (not UTC) — a "day" for streak purposes should match
// the user's own calendar day, not shift at UTC midnight.
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function classifyMastery(repetitions: number): "new" | "learning" | "mastered" {
  if (repetitions === 0) return "new";
  if (repetitions < MASTERED_AT_REPETITIONS) return "learning";
  return "mastered";
}

function computeStreak(activityDates: Set<string>): number {
  const cursor = new Date();
  // If nothing happened yet today, the streak (if any) still counts through
  // yesterday — don't zero it out just because today isn't over.
  if (!activityDates.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (activityDates.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function computeProgressStats(): Promise<ProgressStats> {
  const [levelRecords, srsItems] = await Promise.all([
    db.levelProgress.toArray(),
    db.srsItems.toArray(),
  ]);

  // Completion goes through the same rule the home page and level page use,
  // so the header, this page and the level list can't disagree about it.
  const progressByLevel = indexByLevel(levelRecords);
  const completedRecords = levels
    .filter((level) => isLevelComplete(progressByLevel[level.number], level))
    .map((level) => progressByLevel[level.number]!);

  const scorePercents = completedRecords
    .filter((r) => r.lastScoreTotal != null && r.lastScoreTotal > 0)
    .map((r) => ((r.lastScore ?? 0) / r.lastScoreTotal!) * 100);
  const averageScorePercent =
    scorePercents.length > 0
      ? Math.round(scorePercents.reduce((a, b) => a + b, 0) / scorePercents.length)
      : null;

  const itemsLearned = { letters: 0, vocab: 0, patterns: 0, total: srsItems.length };
  const mastery = { new: 0, learning: 0, mastered: 0 };
  const activityDates = new Set<string>();

  for (const item of srsItems) {
    if (item.itemType === "letter") itemsLearned.letters++;
    else if (item.itemType === "vocab") itemsLearned.vocab++;
    else itemsLearned.patterns++;

    mastery[classifyMastery(item.repetitions)]++;

    if (item.lastReviewed) activityDates.add(dateKey(new Date(item.lastReviewed)));
  }
  // Every finish counts toward the streak, including levels whose exercises
  // have changed since: the streak records days the learner studied, which
  // later content changes don't undo.
  for (const record of levelRecords) {
    if (record.completed && record.completedAt) {
      activityDates.add(dateKey(new Date(record.completedAt)));
    }
  }

  // "Due today" uses the same cutoff as the review queue, so this page can't
  // promise reviews that the Review page then won't show.
  const now = new Date();
  const todayCutoff = dueCutoff(now);
  const weekCutoff = dueCutoff(now, 7);

  const reviewForecast = { dueToday: 0, dueThisWeek: 0, dueLater: 0 };
  for (const item of srsItems) {
    if (item.dueDate <= todayCutoff) reviewForecast.dueToday++;
    else if (item.dueDate <= weekCutoff) reviewForecast.dueThisWeek++;
    else reviewForecast.dueLater++;
  }

  return {
    levelsCompletedCount: completedRecords.length,
    nextLevelNumber: nextIncompleteLevel(progressByLevel)?.number ?? null,
    levelsAuthoredCount: levels.length,
    totalPlannedLevels: TOTAL_PLANNED_LEVELS,
    averageScorePercent,
    itemsLearned,
    mastery,
    streakDays: computeStreak(activityDates),
    reviewForecast,
  };
}
