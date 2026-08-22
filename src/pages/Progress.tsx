import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { computeProgressStats, type ProgressStats } from "../lib/progress";
import { exportProgress, importProgress, InvalidBackupError } from "../lib/backup";

export default function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; isError: boolean } | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    computeProgressStats().then(setStats);
  }, []);

  async function handleExport() {
    setBackupMessage(null);
    try {
      await exportProgress();
    } catch {
      setBackupMessage({ text: "Couldn't export progress. Please try again.", isError: true });
    }
  }

  function handleImportClick() {
    setBackupMessage(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const confirmed = window.confirm(
      "Importing will replace all current progress on this device with the contents of this file. Continue?",
    );
    if (!confirmed) return;

    setIsBusy(true);
    try {
      const result = await importProgress(file);
      setBackupMessage({
        text: `Imported ${result.srsCount} learned items and ${result.levelCount} level records.`,
        isError: false,
      });
      setStats(await computeProgressStats());
    } catch (err) {
      const text =
        err instanceof InvalidBackupError ? err.message : "Import failed. Please try again.";
      setBackupMessage({ text, isError: true });
    } finally {
      setIsBusy(false);
    }
  }

  if (!stats) {
    return (
      <div className="progress-page">
        <Link to="/" className="back-link">
          &larr; All levels
        </Link>
        <h2>Progress</h2>
      </div>
    );
  }

  const { itemsLearned, mastery, reviewForecast } = stats;
  const masteryTotal = mastery.new + mastery.learning + mastery.mastered;

  return (
    <div className="progress-page">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>Progress</h2>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">
            {stats.levelsCompletedCount} / {stats.levelsAuthoredCount}
          </div>
          <div className="stat-label">Levels completed ({stats.totalPlannedLevels} planned)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.averageScorePercent != null ? `${stats.averageScorePercent}%` : "—"}
          </div>
          <div className="stat-label">Average score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{itemsLearned.total}</div>
          <div className="stat-label">
            Items learned — {itemsLearned.letters} letters, {itemsLearned.vocab} vocab,{" "}
            {itemsLearned.patterns} patterns
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.streakDays > 0 ? `🔥 ${stats.streakDays}` : "0"}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </div>

      <section>
        <h3>Mastery</h3>
        {masteryTotal === 0 ? (
          <p className="progress-empty">Complete a level to start tracking mastery.</p>
        ) : (
          <>
            <div className="mastery-bar">
              {mastery.new > 0 && (
                <div className="mastery-segment mastery-new" style={{ flex: mastery.new }} />
              )}
              {mastery.learning > 0 && (
                <div
                  className="mastery-segment mastery-learning"
                  style={{ flex: mastery.learning }}
                />
              )}
              {mastery.mastered > 0 && (
                <div
                  className="mastery-segment mastery-mastered"
                  style={{ flex: mastery.mastered }}
                />
              )}
            </div>
            <ul className="mastery-legend">
              <li>
                <span className="dot mastery-new" /> New: {mastery.new}
              </li>
              <li>
                <span className="dot mastery-learning" /> Learning: {mastery.learning}
              </li>
              <li>
                <span className="dot mastery-mastered" /> Mastered: {mastery.mastered}
              </li>
            </ul>
          </>
        )}
      </section>

      <section>
        <h3>Review Forecast</h3>
        <ul className="forecast-list">
          <li>
            <strong>{reviewForecast.dueToday}</strong> due today
          </li>
          <li>
            <strong>{reviewForecast.dueThisWeek}</strong> due this week
          </li>
          <li>
            <strong>{reviewForecast.dueLater}</strong> due later
          </li>
        </ul>
      </section>

      <section>
        <h3>Backup</h3>
        <p className="progress-empty">
          Progress is stored only in this browser. Export it to keep a copy, or import a
          previous export to restore it — e.g. after clearing browser data or on a new device.
        </p>
        <div className="backup-actions">
          <button type="button" className="reset-btn" onClick={handleExport} disabled={isBusy}>
            Export progress
          </button>
          <button type="button" className="reset-btn" onClick={handleImportClick} disabled={isBusy}>
            Import progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={handleFileSelected}
          />
        </div>
        {backupMessage && (
          <p className={backupMessage.isError ? "backup-message-error" : "backup-message-ok"}>
            {backupMessage.text}
          </p>
        )}
      </section>
    </div>
  );
}
