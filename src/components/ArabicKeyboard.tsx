// On-screen Arabic keyboard for typing exercises. English speakers rarely
// have Arabic input already set up, so this is a supplement to (not a
// replacement for) typing directly into the input via native IME.
//
// Bare, undiacritized letters only — typing exercises are graded leniently
// via normalizeArabic() (src/lib/arabic.ts), which strips tashkeel anyway,
// so there's no need for diacritic keys here.

const LETTERS = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش",
  "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي",
];

const EXTRA = ["أ", "إ", "آ", "ؤ", "ئ", "ء", "ة"];

interface ArabicKeyboardProps {
  onInsert: (char: string) => void;
  onBackspace: () => void;
}

export default function ArabicKeyboard({ onInsert, onBackspace }: ArabicKeyboardProps) {
  return (
    <div className="arabic-keyboard">
      <div className="keyboard-row">
        {LETTERS.map((ch) => (
          <button key={ch} type="button" className="key-btn" onClick={() => onInsert(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <div className="keyboard-row">
        {EXTRA.map((ch) => (
          <button key={ch} type="button" className="key-btn" onClick={() => onInsert(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <div className="keyboard-row keyboard-controls">
        <button type="button" className="key-btn key-space" onClick={() => onInsert(" ")}>
          space
        </button>
        <button
          type="button"
          className="key-btn key-backspace"
          onClick={onBackspace}
          aria-label="Backspace"
          title="Backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
