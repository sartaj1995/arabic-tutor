import { db, type LevelProgress } from "./db";
import type { SRSItemState } from "../types/content";

const BACKUP_VERSION = 1;

export interface ProgressBackup {
  version: number;
  exportedAt: string;
  srsItems: SRSItemState[];
  levelProgress: LevelProgress[];
}

function isSRSItemState(x: unknown): x is SRSItemState {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.itemId === "string" &&
    typeof r.itemType === "string" &&
    typeof r.interval === "number" &&
    typeof r.ease === "number" &&
    typeof r.dueDate === "string" &&
    (r.lastReviewed === null || typeof r.lastReviewed === "string") &&
    typeof r.repetitions === "number"
  );
}

function isLevelProgress(x: unknown): x is LevelProgress {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.levelNumber === "number" && typeof r.completed === "boolean";
}

export async function buildBackup(): Promise<ProgressBackup> {
  const [srsItems, levelProgress] = await Promise.all([
    db.srsItems.toArray(),
    db.levelProgress.toArray(),
  ]);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    srsItems,
    levelProgress,
  };
}

export async function exportProgress(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateStamp = backup.exportedAt.slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arabic-tutor-progress-${dateStamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export class InvalidBackupError extends Error {}

function parseBackup(raw: string): ProgressBackup {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new InvalidBackupError("That file isn't valid JSON.");
  }
  if (typeof data !== "object" || data === null) {
    throw new InvalidBackupError("That file doesn't look like a progress backup.");
  }
  const r = data as Record<string, unknown>;
  if (!Array.isArray(r.srsItems) || !Array.isArray(r.levelProgress)) {
    throw new InvalidBackupError("That file doesn't look like a progress backup.");
  }
  if (!r.srsItems.every(isSRSItemState) || !r.levelProgress.every(isLevelProgress)) {
    throw new InvalidBackupError("That file's contents don't match the expected format.");
  }
  return {
    version: typeof r.version === "number" ? r.version : 1,
    exportedAt: typeof r.exportedAt === "string" ? r.exportedAt : new Date().toISOString(),
    srsItems: r.srsItems,
    levelProgress: r.levelProgress,
  };
}

export interface ImportResult {
  srsCount: number;
  levelCount: number;
}

// Replaces all current progress with the backup's contents — callers must
// confirm with the user first, since this is destructive to current state.
export async function importProgress(file: File): Promise<ImportResult> {
  const raw = await file.text();
  const backup = parseBackup(raw);

  await db.transaction("rw", db.srsItems, db.levelProgress, async () => {
    await db.srsItems.clear();
    await db.levelProgress.clear();
    if (backup.srsItems.length > 0) await db.srsItems.bulkPut(backup.srsItems);
    if (backup.levelProgress.length > 0) await db.levelProgress.bulkPut(backup.levelProgress);
  });

  return { srsCount: backup.srsItems.length, levelCount: backup.levelProgress.length };
}
