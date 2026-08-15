import { db } from "./db";
import { levels } from "./content";

const TOTAL_PLANNED_LEVELS = 100;
// Mastery follows repetitions rather than a raw interval cutoff, since it
// maps directly onto the SM-2 algorithm in srs.ts: 0 = never answered
// correctly, 1-2 = still short-interval "learning", 3+ = the interval has
// compounded (interval * ease) at least once, i.e. genuinely retained.
const MASTERED_AT_REPETITIONS = 3;

export interface ProgressStats {
  levelsCompletedCount: number;
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

  const completedRecords = levelRecords.filter((r) => r.completed);

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
  for (const record of completedRecords) {
    if (record.completedAt) activityDates.add(dateKey(new Date(record.completedAt)));
  }

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const reviewForecast = { dueToday: 0, dueThisWeek: 0, dueLater: 0 };
  for (const item of srsItems) {
    const due = new Date(item.dueDate);
    if (due <= endOfToday) reviewForecast.dueToday++;
    else if (due <= endOfWeek) reviewForecast.dueThisWeek++;
    else reviewForecast.dueLater++;
  }

  return {
    levelsCompletedCount: completedRecords.length,
    levelsAuthoredCount: levels.length,
    totalPlannedLevels: TOTAL_PLANNED_LEVELS,
    averageScorePercent,
    itemsLearned,
    mastery,
    streakDays: computeStreak(activityDates),
    reviewForecast,
  };
}
