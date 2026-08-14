import { useEffect, useState } from "react";

// Voices load asynchronously — often not yet populated on the very first
// getVoices() call, especially right after page load. The 'voiceschanged'
// event is supposed to fire once they're ready, but it's unreliable on some
// browsers/OSes, so we also poll for a few seconds as a fallback.
let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  cachedVoices = window.speechSynthesis.getVoices();
}

function currentVoices(): SpeechSynthesisVoice[] {
  // Always ask the browser fresh if our cache looks empty — cheap, and
  // avoids ever getting stuck on a stale empty list.
  if (cachedVoices.length === 0) refreshVoices();
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);

  // Belt-and-suspenders poll: some browsers never fire 'voiceschanged'.
  let attempts = 0;
  const pollId = window.setInterval(() => {
    attempts += 1;
    refreshVoices();
    if (cachedVoices.length > 0 || attempts >= 10) {
      window.clearInterval(pollId);
    }
  }, 300);
}

function pickArabicVoice(): SpeechSynthesisVoice | undefined {
  // ar-SA is the closest widely-available match to Modern Standard Arabic;
  // fall back to any Arabic voice the browser/OS offers.
  const voices = currentVoices();
  return voices.find((v) => v.lang === "ar-SA") ?? voices.find((v) => v.lang.startsWith("ar"));
}

export function hasArabicVoice(): boolean {
  return !!pickArabicVoice();
}

/** Lists every voice the browser currently reports, for debugging. */
export function listVoices(): { lang: string; name: string }[] {
  return currentVoices().map((v) => ({ lang: v.lang, name: v.name }));
}

/** Speaks Arabic text aloud. Returns false (and does nothing) if no Arabic voice is available. */
export function speak(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voice = pickArabicVoice();
  if (!voice) return false;

  window.speechSynthesis.cancel(); // don't stack overlapping utterances
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.9; // slightly slower for a learner
  window.speechSynthesis.speak(utterance);
  return true;
}

/** Tracks Arabic voice availability, updating as the browser's voice list loads in. */
export function useHasArabicVoice(): boolean {
  const [has, setHas] = useState(hasArabicVoice());

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => setHas(hasArabicVoice());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    // Mirror the module-level poll so this hook's state doesn't get stuck
    // showing "no voice" if voiceschanged never fires.
    const pollId = window.setInterval(update, 300);
    const stopPollId = window.setTimeout(() => window.clearInterval(pollId), 3000);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      window.clearInterval(pollId);
      window.clearTimeout(stopPollId);
    };
  }, []);

  return has;
}
