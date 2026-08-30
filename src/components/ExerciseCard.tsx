import { useState } from "react";
import type { Exercise } from "../types/content";
import { containsArabic, normalizeArabic } from "../lib/arabic";
import PlayAudioButton from "./PlayAudioButton";
import ArabicKeyboard from "./ArabicKeyboard";

export type AnswerResult = "correct" | "incorrect" | "unscored";

/** Tags Arabic strings so assistive tech reads them with an Arabic voice. */
function langOf(text: string): "ar" | undefined {
  return containsArabic(text) ? "ar" : undefined;
}

/**
 * Answer feedback, announced to screen readers. role="status" carries an
 * implicit aria-live="polite", so the result is read out without interrupting
 * whatever the user is currently hearing.
 */
function Feedback({ correct, answer }: { correct: boolean; answer?: string }) {
  return (
    <p className={`feedback ${correct ? "correct" : "incorrect"}`} role="status">
      {correct ? (
        "Correct!"
      ) : answer ? (
        <>
          Not quite — correct answer:{" "}
          <span dir="auto" lang={langOf(answer)} className="arabic">
            {answer}
          </span>
        </>
      ) : (
        "Not quite."
      )}
    </p>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswer: (result: AnswerResult) => void;
  /** Maps a content item id (letter/vocab/pattern id) to the Arabic text its audio should speak. */
  audioIndex?: Record<string, string>;
}

const CHOICE_TYPES = new Set<Exercise["type"]>([
  "multiple-choice",
  "matching",
  "audio-recognition",
  "letter-recognition",
  "letter-writing",
]);

export default function ExerciseCard({ exercise, onAnswer, audioIndex }: ExerciseCardProps) {
  const targetAudioText = exercise.refIds[0] ? audioIndex?.[exercise.refIds[0]] : undefined;

  return (
    <li className="exercise-card">
      <p className="exercise-type">{exercise.type}</p>
      <p className="exercise-prompt" dir="auto">
        {exercise.prompt}
      </p>
      {exercise.type === "audio-recognition" && targetAudioText && (
        <PlayAudioButton text={targetAudioText} label="Listen" className="listen-btn" />
      )}
      {CHOICE_TYPES.has(exercise.type) && exercise.options && (
        <ChoiceExercise exercise={exercise} onAnswer={onAnswer} />
      )}
      {exercise.type === "sentence-build" && exercise.options && (
        <SentenceBuildExercise exercise={exercise} onAnswer={onAnswer} />
      )}
      {exercise.type === "typing" && <TypingExercise exercise={exercise} onAnswer={onAnswer} />}
      {exercise.type === "speaking" && (
        <SpeakingExercise onAnswer={onAnswer} targetAudioText={targetAudioText} />
      )}
    </li>
  );
}

function ChoiceExercise({ exercise, onAnswer }: ExerciseCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    onAnswer(option === exercise.answer ? "correct" : "incorrect");
  }

  return (
    <>
      <ul className="exercise-options">
        {exercise.options!.map((option) => {
          let stateClass = "";
          if (selected) {
            if (option === exercise.answer) stateClass = "correct";
            else if (option === selected) stateClass = "incorrect";
          }
          return (
            <li key={option}>
              <button
                type="button"
                dir="auto"
                lang={langOf(option)}
                className={`option-btn ${stateClass}`}
                onClick={() => handleSelect(option)}
                disabled={!!selected}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
      {/* Until this existed, answering a multiple-choice question changed
          nothing but a CSS class: the result was conveyed by colour alone, so
          screen reader users got no signal at all and colour-blind users got
          only a faint tint. */}
      {selected && <Feedback correct={selected === exercise.answer} answer={exercise.answer} />}
    </>
  );
}

function SentenceBuildExercise({ exercise, onAnswer }: ExerciseCardProps) {
  const [tray, setTray] = useState<string[]>(exercise.options ?? []);
  const [built, setBuilt] = useState<string[]>([]);
  const [status, setStatus] = useState<"unanswered" | "correct" | "incorrect">("unanswered");

  function moveToBuilt(index: number) {
    if (status !== "unanswered") return;
    const word = tray[index];
    setTray(tray.filter((_, i) => i !== index));
    setBuilt([...built, word]);
  }

  function moveToTray(index: number) {
    if (status !== "unanswered") return;
    const word = built[index];
    setBuilt(built.filter((_, i) => i !== index));
    setTray([...tray, word]);
  }

  function check() {
    const correct = normalizeArabic(built.join(" ")) === normalizeArabic(exercise.answer);
    setStatus(correct ? "correct" : "incorrect");
    onAnswer(correct ? "correct" : "incorrect");
  }

  return (
    <div className="sentence-build">
      <div className="sentence-build-slot" dir="rtl">
        {built.length === 0 && (
          <span className="sentence-build-placeholder">Tap words below, in order…</span>
        )}
        {built.map((word, i) => (
          <button
            key={`built-${i}`}
            type="button"
            className="tile tile-built"
            onClick={() => moveToTray(i)}
            disabled={status !== "unanswered"}
          >
            {word}
          </button>
        ))}
      </div>
      <div className="sentence-build-tray" dir="rtl">
        {tray.map((word, i) => (
          <button
            key={`tray-${i}`}
            type="button"
            className="tile"
            onClick={() => moveToBuilt(i)}
            disabled={status !== "unanswered"}
          >
            {word}
          </button>
        ))}
      </div>
      {status === "unanswered" ? (
        <button type="button" className="check-btn" onClick={check} disabled={tray.length > 0}>
          Check
        </button>
      ) : (
        <p className={`feedback ${status}`} role="status">
          {status === "correct" ? (
            "Correct!"
          ) : (
            <>
              Not quite — correct order:{" "}
              <span dir="rtl" lang="ar" className="arabic">
                {exercise.answer}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function TypingExercise({ exercise, onAnswer }: ExerciseCardProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"unanswered" | "correct" | "incorrect">("unanswered");

  function check() {
    const correct = normalizeArabic(value) === normalizeArabic(exercise.answer);
    setStatus(correct ? "correct" : "incorrect");
    onAnswer(correct ? "correct" : "incorrect");
  }

  return (
    <div className="typing-exercise">
      <div className="typing-input-row">
        <input
          type="text"
          dir="rtl"
          lang="ar"
          className="typing-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && status === "unanswered" && value.trim()) check();
          }}
          disabled={status !== "unanswered"}
          placeholder="اكتب هنا..."
        />
        {status === "unanswered" && (
          <button type="button" className="check-btn" onClick={check} disabled={!value.trim()}>
            Check
          </button>
        )}
      </div>
      {status === "unanswered" && (
        <ArabicKeyboard
          onInsert={(ch) => setValue((v) => v + ch)}
          onBackspace={() => setValue((v) => v.slice(0, -1))}
        />
      )}
      {status !== "unanswered" && (
        <Feedback correct={status === "correct"} answer={exercise.answer} />
      )}
    </div>
  );
}

function SpeakingExercise({
  onAnswer,
  targetAudioText,
}: {
  onAnswer: (result: AnswerResult) => void;
  targetAudioText?: string;
}) {
  const [practiced, setPracticed] = useState(false);

  return (
    <div className="speaking-exercise">
      {targetAudioText && (
        <PlayAudioButton text={targetAudioText} label="Hear pronunciation" className="listen-btn" />
      )}
      <button
        type="button"
        className="check-btn"
        onClick={() => {
          setPracticed(true);
          onAnswer("unscored");
        }}
        disabled={practiced}
      >
        {practiced ? "Marked as practiced ✓" : "I said it out loud"}
      </button>
      <p className="speaking-note">
        Self-check only — listen to the reference audio, repeat it out loud, then mark it practiced.
      </p>
    </div>
  );
}
