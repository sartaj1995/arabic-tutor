// Maps a level's title to a small representative icon so cards are easier
// to scan at a glance (verb levels look different from vocab levels, etc.)
// rather than all 40+ cards looking visually identical. Order matters below:
// more specific keywords are checked before generic ones (e.g. "Past Tense"
// before the "Review" fallback, since level 30/40 titles only contain
// "Review" once nothing more specific has already matched).

function SpeechBubble() {
  return (
    <path
      d="M3 5.5A2 2 0 0 1 5 3.5h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-6Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  );
}

function People() {
  return (
    <>
      <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 16.5c.5-2.8 2-4.3 4-4.3s3.5 1.5 4 4.3M11.5 16.5c.4-2.2 1.6-3.4 3-3.4s2.6 1.2 3 3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  );
}

function Cube() {
  return (
    <path
      d="M10 3.5 16.5 7v6L10 16.5 3.5 13V7L10 3.5Zm0 0v6.5m0 0L3.7 7M10 10l6.3-3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Tag() {
  return (
    <>
      <path
        d="M10.5 3.5H4A.5.5 0 0 0 3.5 4v6.5a.5.5 0 0 0 .15.35l7 7a.5.5 0 0 0 .7 0l6.5-6.5a.5.5 0 0 0 0-.7l-7-7a.5.5 0 0 0-.35-.15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="7.2" cy="7.2" r="1" fill="currentColor" />
    </>
  );
}

function Target() {
  return (
    <>
      <circle cx="10" cy="10" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
    </>
  );
}

function QuestionMark() {
  return (
    <>
      <path
        d="M7.6 7.4a2.4 2.4 0 1 1 3.5 2.1c-.8.5-1.1.9-1.1 1.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14.5" r="0.95" fill="currentColor" />
    </>
  );
}

function UserIcon() {
  return (
    <>
      <circle cx="10" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.2 16.3c.7-3.3 2.6-5 5.8-5s5.1 1.7 5.8 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  );
}

function Hash() {
  return (
    <path
      d="M7.5 3.5 5.8 16.5M14.2 3.5l-1.7 13M3.7 8h13M2.9 12.7h13"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  );
}

function KeyIcon() {
  return (
    <>
      <circle cx="6.2" cy="10" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 10h8M13.5 10v2.6M16.2 10v2.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  );
}

function MinusCircle() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function Brackets() {
  return (
    <path
      d="M8 3.8H6a1.8 1.8 0 0 0-1.8 1.8v8.8A1.8 1.8 0 0 0 6 16.2h2M12 3.8h2a1.8 1.8 0 0 1 1.8 1.8v8.8a1.8 1.8 0 0 1-1.8 1.8h-2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  );
}

function VerbAction() {
  return (
    <path
      d="M3.5 6.5 8 10l-4.5 3.5M9.5 6.5 14 10l-4.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Palette() {
  return (
    <>
      <path
        d="M10 3.5a6.5 6.5 0 1 0 0 13c1 0 1.4-.6 1.4-1.2s-.3-.9-.3-1.5c0-.7.5-1.1 1.2-1.1h1.6a2.6 2.6 0 0 0 2.6-2.6C16.5 6.5 13.6 3.5 10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="8" r="0.9" fill="currentColor" />
      <circle cx="10.3" cy="6.3" r="0.9" fill="currentColor" />
      <circle cx="6.6" cy="11.5" r="0.9" fill="currentColor" />
    </>
  );
}

function Calendar() {
  return (
    <>
      <rect x="3.5" y="4.5" width="13" height="11.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 8h13M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Layers() {
  return (
    <path
      d="M10 3.8 16.5 7 10 10.2 3.5 7 10 3.8Zm-6.5 5L10 12l6.5-3.2M3.5 12 10 15.2 16.5 12"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function LinkIcon() {
  return (
    <path
      d="M8.3 11.7 11.7 8.3M7.6 5.8 9 4.4a2.6 2.6 0 0 1 3.7 3.7l-1.4 1.4M12.4 14.2 11 15.6a2.6 2.6 0 0 1-3.7-3.7l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function ClockBack() {
  return (
    <>
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 7v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M3.8 6.5 3.3 9M3.3 9l2.4.7M3.3 9c1-2.7 3.5-4.5 6.3-4.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function ClockForward() {
  return (
    <>
      <circle cx="10" cy="10" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.3V10l2.8 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Scale() {
  return (
    <path
      d="M10 3.8v12.4M6 16.2h8M4 6.2h4.3M11.7 6.2H16M4 6.2 2 10.3a2 2 0 0 0 4 0L4 6.2Zm12 0-2 4.1a2 2 0 0 0 4 0l-2-4.1Z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function TwoCircles() {
  return (
    <>
      <circle cx="7.6" cy="10" r="4.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12.4" cy="10" r="4.3" stroke="currentColor" strokeWidth="1.4" />
    </>
  );
}

function Cloud() {
  return (
    <path
      d="M6.2 14.5a3.2 3.2 0 0 1-.4-6.4 4.2 4.2 0 0 1 8-1.4 3.4 3.4 0 0 1-.6 7.8H6.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  );
}

function Flag() {
  return (
    <path
      d="M5 16.5V4M5 4h9l-2.2 3L14 10H5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function BookIcon() {
  return (
    <path
      d="M4 4.8c1.5-.8 3.4-1 5-.3 1 .4 1.4.9 1.4 1.4v9.5c0-.5-.4-1-1.4-1.4-1.6-.7-3.5-.5-5 .3V4.8ZM16 4.8c-1.5-.8-3.4-1-5-.3-1 .4-1.4.9-1.4 1.4v9.5c0-.5.4-1 1.4-1.4 1.6-.7 3.5-.5 5 .3V4.8Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  );
}

function Exclamation() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.5v4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="13.3" r="0.95" fill="currentColor" />
    </>
  );
}

function HandIcon() {
  return (
    <path
      d="M8 9.5V4.3a1 1 0 0 1 2 0V9M10 9V3.6a1 1 0 0 1 2 0V9M12 9.2V5a1 1 0 0 1 2 0v6.5c0 3-2 5.5-4.8 5.5-2 0-3-.7-4-2L4.7 11a1.1 1.1 0 0 1 1.7-1.4L8 11.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Compass() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12.5 7.5 11 11l-3.5 1.5L9 9l3.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </>
  );
}

function Globe() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 10h13M10 3.5c2.2 1.7 2.2 11.3 0 13M10 3.5c-2.2 1.7-2.2 11.3 0 13"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  );
}

function CapabilityIcon() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M7 10.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function Fork() {
  return (
    <path
      d="M10 3.5v4M10 7.5c0 2.5-3.3 2.5-3.3 5v3M10 7.5c0 2.5 3.3 2.5 3.3 5v3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Utensils() {
  return (
    <path
      d="M5.3 3.5v6.3M4 3.5v4.5a1.3 1.3 0 0 0 2.6 0V3.5M5.3 9.8v6.7M14.7 3.5c-1.4 0-2.3 1.6-2.3 4s.9 3.3 2.3 3.3v6"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Shirt() {
  return (
    <path
      d="M7 3.8 10 5l3-1.2 3 2.7-2 2-1-.8v7.8H7V7.7l-1 .8-2-2 3-2.7Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  );
}

function Ball() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 3.5c2 2 2 11 0 13M4.3 7c2.2 1.3 9.2 1.3 11.4 0M4.3 13c2.2-1.3 9.2-1.3 11.4 0"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </>
  );
}

function MedicalCross() {
  return (
    <>
      <rect x="3.5" y="3.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.5v7M6.5 10h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

function Coin() {
  return (
    <>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 6.3v7.4M12 7.6c-.5-.5-1.3-.8-2.1-.8-1.3 0-2.3.7-2.3 1.7s1 1.4 2.3 1.7c1.4.3 2.3.7 2.3 1.7s-1 1.7-2.3 1.7c-.9 0-1.7-.3-2.2-.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  );
}

function Vehicle() {
  return (
    <>
      <path
        d="M3.5 12.5V8.8a1.5 1.5 0 0 1 1.5-1.5h6l3 3v2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 12.5h13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6.3" cy="13.8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13.3" cy="13.8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </>
  );
}

const RULES: Array<[string, () => JSX.Element]> = [
  ["Past Tense", ClockBack],
  ["Verbs", VerbAction],
  ["Negat", MinusCircle],
  ["Definite Article", Brackets],
  ["Idafa", Brackets],
  ["Greetings", SpeechBubble],
  ["Family", People],
  ["Everyday Objects", Cube],
  ["Descriptions", Tag],
  ["Demonstratives", Target],
  ["Questions", QuestionMark],
  ["Pronouns", UserIcon],
  ["Numbers", Hash],
  ["Possession", KeyIcon],
  ["Colors", Palette],
  ["Days of the Week", Calendar],
  ["Plurals", Layers],
  ['"And"', LinkIcon],
  ["Future Tense", ClockForward],
  ["Telling Time", ClockForward],
  ["Imperative", Exclamation],
  ["Body Parts", HandIcon],
  ["Prepositions of Place", Compass],
  ["Nisba", Globe],
  ["To Be Able To", CapabilityIcon],
  ["Comparatives", Scale],
  ["Dual", TwoCircles],
  ["Weather", Cloud],
  ["Relative Clauses", LinkIcon],
  ["Conditionals", Fork],
  ["Food", Utensils],
  ["Clothing", Shirt],
  ["Months", Calendar],
  ["Prepositions of Time", Compass],
  ["Transportation", Vehicle],
  ["Household", Cube],
  ["Directions", Compass],
  ["Money & Shopping", Coin],
  ["Adjectives", Tag],
  ["Comparison", Scale],
  ["More Prepositions", Compass],
  ["Sports & Hobbies", Ball],
  ["Health & Illness", MedicalCross],
  ["Weeks", Calendar],
  ["Want To", Brackets],
  ["Essential Expressions", SpeechBubble],
  ["Reading Passage", BookIcon],
  ["Review", Flag],
];

function iconFor(title: string): () => JSX.Element {
  for (const [keyword, Icon] of RULES) {
    if (title.includes(keyword)) return Icon;
  }
  return BookIcon;
}

export default function LevelIcon({ title }: { title: string }) {
  const Icon = iconFor(title);
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <Icon />
    </svg>
  );
}
