import type { MouseEvent } from "react";
import { speak } from "../lib/speech";

interface PlayAudioButtonProps {
  /** The Arabic text to speak (with diacritics where available). */
  text: string;
  label?: string;
  className?: string;
}

export default function PlayAudioButton({ text, label = "Play audio", className }: PlayAudioButtonProps) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    speak(text);
  }

  return (
    <button
      type="button"
      className={`play-audio-btn ${className ?? ""}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      🔊
    </button>
  );
}
