import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLevel } from "../lib/content";
import { db } from "../lib/db";
import { seedLevelSRSItems } from "../lib/srs";
import ArabicText from "../components/ArabicText";
import PlayAudioButton from "../components/PlayAudioButton";
import ExerciseCard, { type AnswerResult } from "../components/ExerciseCard";

export default function LevelDetail() {
  const { number } = useParams();
  const level = getLevel(Number(number));

  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [resetCount, setResetCount] = useState(0);
  const [savedProgress, setSavedProgress] = useState<{ score: number; total: number } | null>(
    null,
  );

  // Route params don't remount this component, so reset local exercise state
  // whenever the level actually changes (e.g. navigating level 5 -> level 6).
  useEffect(() => {
    setResults({});
    setResetCount((c) => c + 1);
    if (!level) {
      setSavedProgress(null);
      return;
    }
    db.levelProgress.get(level.number).then((record) => {
      if (record?.completed && record.lastScoreTotal != null) {
        setSavedProgress({ score: record.lastScore ?? 0, total: record.lastScoreTotal });
      } else {
        setSavedProgress(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level?.number]);

  const scoreable = level?.exercises.filter((e) => e.type !== "speaking") ?? [];
  const answeredScoreable = scoreable.filter(
    (e) => results[e.id] === "correct" || results[e.id] === "incorrect",
  );
  const correctCount = scoreable.filter((e) => results[e.id] === "correct").length;
  const allAnswered = scoreable.length > 0 && answeredScoreable.length === scoreable.length;

  useEffect(() => {
    if (!level || !allAnswered) return;
    db.levelProgress.put({
      levelNumber: level.number,
      completed: true,
      completedAt: new Date().toISOString(),
      lastScore: correctCount,
      lastScoreTotal: scoreable.length,
    });
    setSavedProgress({ score: correctCount, total: scoreable.length });
    seedLevelSRSItems(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered, correctCount]);

  if (!level) {
    return (
      <div className="level-detail">
        <p>Level not found.</p>
        <Link to="/">&larr; All levels</Link>
      </div>
    );
  }

  const audioIndex: Record<string, string> = {};
  for (const letter of level.letters) audioIndex[letter.id] = letter.audio.id;
  for (const word of level.vocab) audioIndex[word.id] = word.audio.id;
  for (const pattern of level.patterns) audioIndex[pattern.id] = pattern.audio.id;

  function handleAnswer(exerciseId: string, result: AnswerResult) {
    setResults((prev) => ({ ...prev, [exerciseId]: result }));
  }

  function handleReset() {
    setResults({});
    setResetCount((c) => c + 1);
  }

  return (
    <div className="level-detail">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>
        Level {level.number}: {level.title}
      </h2>

      {level.letters.length > 0 && (
        <section>
          <h3>New Letters</h3>
          <ul className="letter-grid">
            {level.letters.map((letter) => (
              <li key={letter.id} className="letter-card">
                <ArabicText className="letter-glyph">{letter.forms.isolated}</ArabicText>
                <div className="letter-name">{letter.name}</div>
                <div className="letter-sound">{letter.sound}</div>
                <PlayAudioButton audioId={letter.audio.id} label={`Play ${letter.name}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {level.vocab.length > 0 && (
        <section>
          <h3>New Vocabulary</h3>
          <ul className="vocab-list">
            {level.vocab.map((word) => (
              <li key={word.id} className="vocab-row">
                <span className="vocab-arabic-cell">
                  <PlayAudioButton audioId={word.audio.id} label={`Play ${word.transliteration}`} />
                  <ArabicText className="vocab-arabic">{word.arabic}</ArabicText>
                </span>
                <span className="vocab-translit">{word.transliteration}</span>
                <span className="vocab-english">{word.english}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {level.patterns.length > 0 && (
        <section>
          <h3>Sentence Pattern</h3>
          {level.patterns.map((pattern) => (
            <div key={pattern.id} className="pattern-card">
              <span className="pattern-example-row">
                <ArabicText className="pattern-example">{pattern.exampleArabic}</ArabicText>
                <PlayAudioButton audioId={pattern.audio.id} label="Play example sentence" />
              </span>
              <p className="pattern-translit">{pattern.exampleTransliteration}</p>
              <p className="pattern-english">{pattern.exampleEnglish}</p>
              <p className="pattern-note">{pattern.grammarNote}</p>
            </div>
          ))}
        </section>
      )}

      {level.exercises.length > 0 && (
        <section>
          <div className="exercise-header">
            <h3>Exercises</h3>
            <div className="exercise-header-right">
              {scoreable.length > 0 && (
                <span className="exercise-score">
                  Score: {correctCount} / {scoreable.length}
                  {allAnswered && correctCount === scoreable.length && " 🎉"}
                </span>
              )}
              <button type="button" className="reset-btn" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
          {savedProgress && (
            <p className="saved-progress-note">
              Last completed: {savedProgress.score} / {savedProgress.total}
            </p>
          )}
          <ul className="exercise-list">
            {level.exercises.map((exercise) => (
              <ExerciseCard
                key={`${exercise.id}-${resetCount}`}
                exercise={exercise}
                audioIndex={audioIndex}
                onAnswer={(result) => handleAnswer(exercise.id, result)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
