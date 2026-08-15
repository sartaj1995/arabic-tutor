import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { computeProgressStats, type ProgressStats } from "../lib/progress";

export default function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    computeProgressStats().then(setStats);
  }, []);

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
    </div>
  );
}
