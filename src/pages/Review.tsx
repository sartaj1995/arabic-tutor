import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/db";
import type { Exercise, SRSItemState } from "../types/content";
import { applyReview } from "../lib/srs";
import { buildReviewExercise } from "../lib/reviewExercise";
import { allLetters, allVocab, allPatterns } from "../lib/content";
import { shuffle } from "../lib/random";
import ExerciseCard, { type AnswerResult } from "../components/ExerciseCard";

const SESSION_CAP = 20;

// Maps a content item id to the Arabic its audio button should speak. Built
// across every level (not just one, as LevelDetail does) since a review
// session can pull an item from anywhere in the curriculum.
const audioTextIndex: Record<string, string> = {};
for (const letter of allLetters) audioTextIndex[letter.id] = letter.audio.text;
for (const word of allVocab) audioTextIndex[word.id] = word.audio.text;
for (const pattern of allPatterns) audioTextIndex[pattern.id] = pattern.audio.text;

export default function Review() {
  const [loading, setLoading] = useState(true);
  const [dueItems, setDueItems] = useState<SRSItemState[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});

  useEffect(() => {
    const nowIso = new Date().toISOString();
    db.srsItems
      .where("dueDate")
      .belowOrEqual(nowIso)
      .toArray()
      .then((items) => {
        setTotalDue(items.length);
        setDueItems(shuffle(items).slice(0, SESSION_CAP));
        setLoading(false);
      });
  }, []);

  const queue = useMemo(() => {
    return dueItems
      .map((due) => ({ due, exercise: buildReviewExercise(due) }))
      .filter((entry): entry is { due: SRSItemState; exercise: Exercise } => entry.exercise !== null);
  }, [dueItems]);

  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r === "correct").length;
  const allDone = queue.length > 0 && answeredCount === queue.length;

  function handleAnswer(due: SRSItemState, exerciseId: string, result: AnswerResult) {
    setResults((prev) => ({ ...prev, [exerciseId]: result }));
    db.srsItems.put(applyReview(due, result === "correct"));
  }

  if (loading) {
    return (
      <div className="review-page">
        <Link to="/" className="back-link">
          &larr; All levels
        </Link>
        <h2>Review</h2>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="review-page">
        <Link to="/" className="back-link">
          &larr; All levels
        </Link>
        <h2>Review</h2>
        <p className="review-empty">
          Nothing due for review right now. Finish a level to add its letters, words, and
          patterns here — they'll come back for review on a spaced schedule so you don't
          forget them.
        </p>
      </div>
    );
  }

  return (
    <div className="review-page">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>Review</h2>
      <p className="review-subtitle">
        {totalDue > SESSION_CAP
          ? `${totalDue} items due — showing ${queue.length} this session.`
          : `${queue.length} item${queue.length === 1 ? "" : "s"} due for review.`}
      </p>
      {allDone && (
        <p className="review-summary">
          Session complete: {correctCount} / {queue.length} correct. <Link to="/">Back to levels</Link>
        </p>
      )}
      <ul className="exercise-list">
        {queue.map(({ due, exercise }) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            audioIndex={audioTextIndex}
            onAnswer={(result) => handleAnswer(due, exercise.id, result)}
          />
        ))}
      </ul>
    </div>
  );
}
