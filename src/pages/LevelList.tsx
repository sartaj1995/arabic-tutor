import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { levels, scoreableExercises } from "../lib/content";
import { db, type LevelProgress } from "../lib/db";
import { useHasArabicVoice } from "../lib/speech";

const TOTAL_PLANNED_LEVELS = 100;

export default function LevelList() {
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({});
  const [dueCount, setDueCount] = useState<number | null>(null);
  const hasVoice = useHasArabicVoice();

  useEffect(() => {
    db.levelProgress.toArray().then((rows) => {
      const map: Record<number, LevelProgress> = {};
      for (const row of rows) map[row.levelNumber] = row;
      setProgress(map);
    });
    db.srsItems
      .where("dueDate")
      .belowOrEqual(new Date().toISOString())
      .count()
      .then(setDueCount);
  }, []);

  return (
    <div className="level-list">
      {!hasVoice && (
        <p className="voice-warning">
          🔇 No Arabic voice found in this browser, so 🔊 buttons won't play anything. Try Chrome,
          or check your OS's language/speech settings for an Arabic voice.
        </p>
      )}
      <div className="review-banner">
        {dueCount !== null &&
          (dueCount > 0 ? (
            <Link to="/review" className="review-cta">
              🔁 Review {dueCount} item{dueCount === 1 ? "" : "s"}
            </Link>
          ) : (
            <p className="review-cta-empty">No reviews due right now.</p>
          ))}
      </div>
      <p className="level-list-intro">
        {levels.length} of {TOTAL_PLANNED_LEVELS} levels authored so far.
      </p>
      <ol className="level-grid">
        {levels.map((level) => {
          const record = progress[level.number];
          return (
            <li key={level.number}>
              <Link to={`/level/${level.number}`} className="level-card">
                <span className="level-number">{level.number}</span>
                <span className="level-title">{level.title}</span>
                {record?.completed && record.lastScoreTotal === scoreableExercises(level).length && (
                  <span className="level-badge">
                    ✓ {record.lastScore}/{record.lastScoreTotal}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
