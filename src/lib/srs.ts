import type { Level, SRSItemState, SRSItemType } from "../types/content";
import { db } from "./db";

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

/** A freshly-learned item is due immediately — its first review is "now". */
export function createSRSItem(itemId: string, itemType: SRSItemType): SRSItemState {
  return {
    itemId,
    itemType,
    interval: 0,
    ease: DEFAULT_EASE,
    repetitions: 0,
    dueDate: new Date().toISOString(),
    lastReviewed: null,
  };
}

/**
 * Lightweight SM-2 variant. Correct answers grow the interval (1 day, then
 * 6 days, then interval * ease, similar to Anki's default). Any miss resets
 * repetitions and schedules the item for immediate re-review rather than
 * waiting a full day, so mistakes get another shot soon.
 */
export function applyReview(item: SRSItemState, correct: boolean): SRSItemState {
  const now = new Date();
  let { interval, ease, repetitions } = item;

  if (correct) {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
    ease = Math.min(MAX_EASE, ease + 0.1);
  } else {
    repetitions = 0;
    interval = 0;
    ease = Math.max(MIN_EASE, ease - 0.2);
  }

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ...item,
    interval,
    ease,
    repetitions,
    dueDate: dueDate.toISOString(),
    lastReviewed: now.toISOString(),
  };
}

/**
 * The latest `dueDate` that still counts as due: the end of today, local time.
 *
 * Reviews are due by calendar day, not to the minute. applyReview schedules
 * `now + interval` days, so without this a word reviewed at 9pm stayed locked
 * until 9pm the next day while the Progress page already listed it as "due
 * today". The review queue and every due count compare against this one
 * cutoff, as ISO strings, which is also how Dexie's dueDate index compares
 * them. `daysAhead` moves it to the end of a later day, for forecasts.
 */
export function dueCutoff(now: Date = new Date(), daysAhead = 0): string {
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

/** Calendar days from today until `dueDate`: 0 today, 1 tomorrow. */
export function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // Rounded, since a day that crosses a daylight-saving change is 23 or 25 hours.
  return Math.round((startOfDay(new Date(dueDate)) - startOfDay(now)) / 86_400_000);
}

/**
 * Called when a level's exercises are all completed. Adds an SRS record for
 * every letter/vocab/pattern the level introduces — but only if one doesn't
 * already exist, so replaying a level never resets review progress.
 */
export async function seedLevelSRSItems(level: Level): Promise<void> {
  const entries: { id: string; type: SRSItemType }[] = [
    ...level.letters.map((l) => ({ id: l.id, type: "letter" as const })),
    ...level.vocab.map((v) => ({ id: v.id, type: "vocab" as const })),
    ...level.patterns.map((p) => ({ id: p.id, type: "pattern" as const })),
  ];

  for (const { id, type } of entries) {
    const existing = await db.srsItems.get(id);
    if (!existing) {
      await db.srsItems.put(createSRSItem(id, type));
    }
  }
}
