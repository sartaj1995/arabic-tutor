import Dexie, { type Table } from "dexie";
import type { SRSItemState } from "../types/content";

// Schema only for the SRS side — the scheduling algorithm (SM-2 style, per
// docs/content-model.md) is a separate follow-up, not part of the app shell.
export interface LevelProgress {
  levelNumber: number;
  completed: boolean;
  completedAt: string | null;
  lastScore?: number;
  lastScoreTotal?: number;
}

class ArabicTutorDB extends Dexie {
  srsItems!: Table<SRSItemState, string>;
  levelProgress!: Table<LevelProgress, number>;

  constructor() {
    super("arabic-tutor");
    this.version(1).stores({
      srsItems: "itemId, itemType, dueDate",
      levelProgress: "levelNumber",
    });
  }
}

export const db = new ArabicTutorDB();
