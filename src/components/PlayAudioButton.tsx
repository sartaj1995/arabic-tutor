import type { MouseEvent } from "react";

interface PlayAudioButtonProps {
  audioId: string;
  label?: string;
  className?: string;
}

export default function PlayAudioButton({
  audioId,
  label = "Play audio",
  className,
}: PlayAudioButtonProps) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    const audio = new Audio(`/audio/${audioId}.mp3`);
    audio.addEventListener("error", () => {
      console.debug(`No audio file for "${audioId}" yet — run npm run generate-audio.`);
    });
    audio.play().catch(() => {
      // Autoplay-policy or missing-file rejection — fail quietly, not worth
      // interrupting the learner over.
    });
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
