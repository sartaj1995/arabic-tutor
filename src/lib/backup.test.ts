// Dexie needs an IndexedDB implementation; this shim installs one globally and
// must be imported before anything that touches the database.
import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBackup, importProgress, InvalidBackupError } from "./backup";
import { db } from "./db";
import type { SRSItemState } from "../types/content";

function srsRow(itemId: string, overrides: Partial<SRSItemState> = {}): SRSItemState {
  return {
    itemId,
    itemType: "vocab",
    interval: 6,
    ease: 2.6,
    dueDate: "2026-09-05T00:00:00.000Z",
    lastReviewed: "2026-08-30T00:00:00.000Z",
    repetitions: 2,
    ...overrides,
  };
}

function backupFile(contents: unknown): File {
  const text = typeof contents === "string" ? contents : JSON.stringify(contents);
  return new File([text], "backup.json", { type: "application/json" });
}

beforeEach(async () => {
  await db.srsItems.clear();
  await db.levelProgress.clear();
});

describe("buildBackup", () => {
  it("captures both stores", async () => {
    await db.srsItems.bulkPut([srsRow("qahwa"), srsRow("alif", { itemType: "letter" })]);
    await db.levelProgress.put({
      levelNumber: 1,
      completed: true,
      completedAt: "2026-08-30T00:00:00.000Z",
      lastScore: 8,
      lastScoreTotal: 10,
    });

    const backup = await buildBackup();
    expect(backup.version).toBe(1);
    expect(backup.srsItems).toHaveLength(2);
    expect(backup.levelProgress).toHaveLength(1);
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("is valid when there is nothing to back up", async () => {
    const backup = await buildBackup();
    expect(backup.srsItems).toEqual([]);
    expect(backup.levelProgress).toEqual([]);
  });
});

describe("importProgress", () => {
  it("round-trips an export without losing anything", async () => {
    // The whole point of the feature: progress lives only in one browser, so
    // export → wipe → import has to reproduce it exactly.
    await db.srsItems.bulkPut([srsRow("qahwa"), srsRow("shay", { repetitions: 5 })]);
    await db.levelProgress.put({
      levelNumber: 3,
      completed: true,
      completedAt: "2026-08-30T00:00:00.000Z",
      lastScore: 12,
      lastScoreTotal: 12,
    });
    const exported = await buildBackup();

    await db.srsItems.clear();
    await db.levelProgress.clear();
    expect(await db.srsItems.count()).toBe(0);

    const result = await importProgress(backupFile(exported));
    expect(result).toEqual({ srsCount: 2, levelCount: 1 });
    expect((await db.srsItems.toArray()).sort((a, b) => a.itemId.localeCompare(b.itemId))).toEqual(
      exported.srsItems.sort((a, b) => a.itemId.localeCompare(b.itemId)),
    );
    expect(await db.levelProgress.toArray()).toEqual(exported.levelProgress);
  });

  it("replaces existing progress rather than merging into it", async () => {
    await db.srsItems.bulkPut([srsRow("stale-a"), srsRow("stale-b")]);
    await importProgress(
      backupFile({ version: 1, exportedAt: "", srsItems: [srsRow("fresh")], levelProgress: [] }),
    );

    expect((await db.srsItems.toArray()).map((r) => r.itemId)).toEqual(["fresh"]);
  });

  it("rejects a file that is not JSON", async () => {
    await expect(importProgress(backupFile("not json at all"))).rejects.toBeInstanceOf(
      InvalidBackupError,
    );
  });

  it("rejects JSON that is not a backup", async () => {
    await expect(importProgress(backupFile({ hello: "world" }))).rejects.toBeInstanceOf(
      InvalidBackupError,
    );
  });

  it("rejects a backup whose rows are the wrong shape", async () => {
    await expect(
      importProgress(
        backupFile({ version: 1, srsItems: [{ itemId: "x" }], levelProgress: [] }),
      ),
    ).rejects.toBeInstanceOf(InvalidBackupError);
  });

  it("leaves existing progress untouched when a file is rejected", async () => {
    // A failed import must not be destructive — the user still has their data.
    await db.srsItems.bulkPut([srsRow("keep-me")]);
    await expect(importProgress(backupFile("}{"))).rejects.toBeInstanceOf(InvalidBackupError);
    expect((await db.srsItems.toArray()).map((r) => r.itemId)).toEqual(["keep-me"]);
  });
});

describe("exportProgress", () => {
  it("names the download by date and revokes the object URL", async () => {
    // jsdom-free: stub just the DOM surface exportProgress touches.
    const createObjectURL = vi.fn(() => "blob:stub");
    const revokeObjectURL = vi.fn();
    const anchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: () => anchor,
      body: { appendChild: vi.fn() },
    });

    const { exportProgress } = await import("./backup");
    await exportProgress();

    expect(anchor.download).toMatch(/^arabic-tutor-progress-\d{4}-\d{2}-\d{2}\.json$/);
    expect(anchor.click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:stub");
    vi.unstubAllGlobals();
  });
});
