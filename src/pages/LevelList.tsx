import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { levels, scoreableExercises } from "../lib/content";
import { db, type LevelProgress } from "../lib/db";
import { useHasArabicVoice } from "../lib/speech";
import ArabicText from "../components/ArabicText";
import LevelIcon from "../components/LevelIcon";

const TOTAL_PLANNED_LEVELS = 100;

// Every batch of 10 levels is authored around one theme — naming the group
// makes the level list read like a curriculum's table of contents instead
// of a flat checklist. Units beyond what's named here (as more levels get
// authored) fall back to a generic "Unit N" label rather than crashing.
const UNIT_THEMES: { title: string; arabic: string }[] = [
  { title: "Foundations", arabic: "الأساسيات" },
  { title: "Verbs & Grammar", arabic: "الأفعال" },
  { title: "Past Tense & Plurals", arabic: "الماضي" },
  { title: "Everyday Structures", arabic: "الحياة اليومية" },
  { title: "Real-World Arabic", arabic: "الحياة العملية" },
  { title: "Complex Sentences", arabic: "الجمل المركبة" },
  { title: "Daily Life Expanded", arabic: "الحياة اليومية الموسعة" },
  { title: "Practical Fluency", arabic: "الطلاقة العملية" },
  { title: "Everyday Fluency", arabic: "الطلاقة اليومية" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 9a6 6 0 0 1 10.2-4.2M4 9V4.8M4 9h4.2M16 11a6 6 0 0 1-10.2 4.2M16 11v4.2M16 11h-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 4.5c1.6-.8 3.6-1 5.5-.3 1 .35 1.5.9 1.5 1.5v9.8c0-.6-.5-1.15-1.5-1.5-1.9-.7-3.9-.5-5.5.3v-9.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M17 4.5c-1.6-.8-3.6-1-5.5-.3-1 .35-1.5.9-1.5 1.5v9.8c0-.6.5-1.15 1.5-1.5 1.9-.7 3.9-.5 5.5.3v-9.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 7.5h2.8L10 4v12l-4.2-3.5H3v-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M13 7l4 6M17 7l-4 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function chunkIntoUnits<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

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

  function isComplete(level: (typeof levels)[number]) {
    const record = progress[level.number];
    return !!record?.completed && record.lastScoreTotal === scoreableExercises(level).length;
  }

  const completedCount = levels.filter(isComplete).length;
  const nextLevel = levels.find((level) => !isComplete(level));
  const units = chunkIntoUnits(levels, 10);
  const activeUnitIndex = nextLevel ? Math.floor((nextLevel.number - 1) / 10) : -1;

  return (
    <div className="level-list">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow-row">
            <ArabicText className="hero-arabic">تعلم العربية</ArabicText>
          </div>
          <h1 className="hero-title">Arabic Tutor</h1>
          <p className="hero-tagline">
            Learn Modern Standard Arabic — script, vocabulary, and sentence-building — one level at
            a time.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-icon">
                <BookIcon />
              </span>
              <span>
                <span className="hero-stat-value">
                  {completedCount} / {levels.length}
                </span>
                <span className="hero-stat-label">levels completed</span>
              </span>
            </div>
            {dueCount !== null && dueCount > 0 ? (
              <Link to="/review" className="hero-stat is-review">
                <span className="hero-stat-icon">
                  <RepeatIcon />
                </span>
                <span>
                  <span className="hero-stat-value">{dueCount}</span>
                  <span className="hero-stat-label">item{dueCount === 1 ? "" : "s"} to review</span>
                </span>
              </Link>
            ) : (
              <div className="hero-stat is-review">
                <span className="hero-stat-icon">
                  <RepeatIcon />
                </span>
                <span>
                  <span className="hero-stat-value">0</span>
                  <span className="hero-stat-label">reviews due right now</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {!hasVoice && (
        <p className="voice-warning">
          <MuteIcon />
          No Arabic voice found in this browser, so 🔊 buttons won't play anything. Try Chrome, or
          check your OS's language/speech settings for an Arabic voice.
        </p>
      )}

      <p className="level-list-intro">
        {levels.length} of {TOTAL_PLANNED_LEVELS} levels authored so far.
      </p>

      {units.map((unitLevels, unitIndex) => {
        const theme = UNIT_THEMES[unitIndex] ?? { title: `Unit ${unitIndex + 1}`, arabic: "" };
        const unitCompleted = unitLevels.filter(isComplete).length;
        const unitPercent = Math.round((unitCompleted / unitLevels.length) * 100);
        const unitComplete = unitCompleted === unitLevels.length;
        return (
          <details
            className={`unit-section${unitComplete ? " is-unit-complete" : ""}`}
            key={unitIndex}
            open={unitIndex === activeUnitIndex}
          >
            <summary className="unit-summary">
              <span className="unit-chevron">
                <ChevronIcon />
              </span>
              <span className="unit-header-main">
                <span className="unit-title-row">
                  <span className="unit-eyebrow">Unit {unitIndex + 1}</span>
                  {theme.arabic && (
                    <ArabicText className="unit-arabic">{theme.arabic}</ArabicText>
                  )}
                </span>
                <span className="unit-title">{theme.title}</span>
              </span>
              <span className="unit-progress">
                <span className="unit-progress-bar">
                  <span className="unit-progress-fill" style={{ width: `${unitPercent}%` }} />
                </span>
                <span className="unit-progress-label">
                  {unitCompleted}/{unitLevels.length}
                </span>
              </span>
            </summary>

            <ol className="level-grid">
              {unitLevels.map((level) => {
                const complete = isComplete(level);
                const record = progress[level.number];
                const isNext = !complete && level.number === nextLevel?.number;
                return (
                  <li key={level.number}>
                    <Link
                      to={`/level/${level.number}`}
                      className={`level-card${complete ? " is-complete" : ""}${isNext ? " is-current" : ""}`}
                    >
                      <div className="level-card-top">
                        <span className="level-icon-chip">
                          <LevelIcon title={level.title} />
                        </span>
                        <span className="level-number">{level.number}</span>
                      </div>
                      <span className="level-title">{level.title}</span>
                      <div className="level-card-footer">
                        {complete ? (
                          <span className="level-badge">
                            <CheckIcon />
                            {record?.lastScore}/{record?.lastScoreTotal}
                          </span>
                        ) : isNext ? (
                          <span className="level-status-current">Continue →</span>
                        ) : (
                          <span className="level-status-todo">Not started</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
