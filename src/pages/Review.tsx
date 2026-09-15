import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/db";
import type { Exercise, SRSItemState } from "../types/content";
import { applyReview, daysUntilDue, dueCutoff } from "../lib/srs";
import { buildReviewExercise } from "../lib/reviewExercise";
import { hasArabicVoice, whenVoicesKnown } from "../lib/speech";
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

/** "tomorrow", "in 3 days", or a date once it's more than a week off. */
function describeNextReview(dueDate: string): string {
  const days = daysUntilDue(dueDate);
  if (days <= 1) return "tomorrow";
  if (days <= 7) return `in ${days} days`;
  return `on ${new Date(dueDate).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
}

export default function Review() {
  const [loading, setLoading] = useState(true);
  const [dueItems, setDueItems] = useState<SRSItemState[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [nextDueDate, setNextDueDate] = useState<string | null>(null);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [results, setResults] = useState<Record<string, AnswerResult>>({});

  useEffect(() => {
    const cutoff = dueCutoff();
    Promise.all([
      db.srsItems.where("dueDate").belowOrEqual(cutoff).toArray(),
      // The earliest item scheduled after today, for the "all caught up" message.
      db.srsItems.where("dueDate").above(cutoff).first(),
      whenVoicesKnown(),
    ]).then(([items, nextScheduled]) => {
      // Decided once, before the queue is built: switching questions when a
      // voice finished loading mid-session would replace ones already answered.
      setAudioAvailable(hasArabicVoice());
      setTotalDue(items.length);
      setDueItems(shuffle(items).slice(0, SESSION_CAP));
      setNextDueDate(nextScheduled?.dueDate ?? null);
      setLoading(false);
    });
  }, []);

  const queue = useMemo(() => {
    return dueItems
      .map((due) => ({ due, exercise: buildReviewExercise(due, { audioAvailable }) }))
      .filter((entry): entry is { due: SRSItemState; exercise: Exercise } => entry.exercise !== null);
  }, [dueItems, audioAvailable]);

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
        {/* Told apart because the old single message ("finish a level to add
            items") was wrong for anyone who had already finished levels. */}
        {nextDueDate === null ? (
          <p className="review-empty">
            Nothing to review yet. Finish a level to add its letters, words, and patterns here —
            they'll come back for review on a spaced schedule so you don't forget them.
          </p>
        ) : (
          <p className="review-empty">
            You're all caught up. Your next review is due {describeNextReview(nextDueDate)}.
          </p>
        )}
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
