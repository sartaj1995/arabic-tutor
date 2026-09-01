import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  filterGlossary,
  glossaryEntries,
  glossaryKindCounts,
  glossaryTags,
  type GlossaryEntry,
  type GlossaryKind,
} from "../lib/glossary";
import { UNIT_THEMES, unitLevelRange, unitTheme } from "../lib/units";
import ArabicText from "../components/ArabicText";
import PlayAudioButton from "../components/PlayAudioButton";

const KIND_LABEL: Record<GlossaryEntry["kind"], string> = {
  letter: "Letter",
  vocab: "Word",
  pattern: "Pattern",
};

/**
 * The primary filter. "Is this a letter, a word, or a sentence pattern?" is
 * the first question a learner asks of an entry, and it's the one thing every
 * entry answers — unlike tags, which exist on vocabulary only. Ordered the way
 * the course teaches them: script, then words, then sentences.
 */
const KIND_OPTIONS: { value: GlossaryKind | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "letter", label: "Letters" },
  { value: "vocab", label: "Words" },
  { value: "pattern", label: "Patterns" },
];

export default function Glossary() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<GlossaryKind | null>(null);
  const [unitIndex, setUnitIndex] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const results = useMemo(
    () => filterGlossary({ query, kind, unitIndex, tag }),
    [query, kind, unitIndex, tag],
  );

  // Counts on the type buttons reflect every *other* active filter, so the row
  // doubles as a preview: searching "school" shows how many letters, words and
  // patterns that word actually reaches before you commit to one of them.
  const kindCounts = useMemo(() => {
    const matches = filterGlossary({ query, kind: null, unitIndex, tag });
    const counts: Record<GlossaryKind, number> = { letter: 0, vocab: 0, pattern: 0 };
    for (const entry of matches) counts[entry.kind] += 1;
    return { all: matches.length, ...counts };
  }, [query, unitIndex, tag]);

  // Only vocabulary carries tags, so the topic row is meaningless once letters
  // or patterns are asked for — hidden rather than left sitting there matching
  // nothing. Choosing a non-word type also drops any topic already picked, so
  // the two filters can never contradict each other into an empty list.
  const topicsApply = kind === null || kind === "vocab";

  function chooseKind(next: GlossaryKind | null) {
    setKind(next);
    if (next !== null && next !== "vocab") setTag(null);
  }

  const isFiltered = query.trim() !== "" || kind !== null || unitIndex !== null || tag !== null;

  function clearFilters() {
    setQuery("");
    setKind(null);
    setUnitIndex(null);
    setTag(null);
  }

  return (
    <div className="glossary-page">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>Glossary</h2>
      <p className="glossary-intro">
        Every letter, word, and sentence pattern in the course — {glossaryEntries.length} entries
        in all: {glossaryKindCounts.letter} letters, {glossaryKindCounts.vocab} words and{" "}
        {glossaryKindCounts.pattern} patterns. Search by English meaning or transliteration;
        accents are optional, so &ldquo;sadiq&rdquo; finds &ldquo;ṣadīqun&rdquo;.
      </p>

      <div className="glossary-controls">
        <label className="glossary-search">
          <span className="visually-hidden">Search by meaning or transliteration</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meaning or transliteration…"
            autoComplete="off"
          />
        </label>

        <label className="glossary-select">
          <span className="visually-hidden">Filter by unit</span>
          <select
            value={unitIndex ?? ""}
            onChange={(e) => setUnitIndex(e.target.value === "" ? null : Number(e.target.value))}
          >
            <option value="">All levels</option>
            {UNIT_THEMES.map((_, i) => {
              const { first, last } = unitLevelRange(i);
              return (
                <option key={i} value={i}>
                  Levels {first}–{last} · {unitTheme(i).title}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <div className="glossary-facet">
        <span className="facet-label" id="facet-type">
          Type
        </span>
        <div className="kind-segment" role="group" aria-labelledby="facet-type">
          {KIND_OPTIONS.map((option) => {
            const active = kind === option.value;
            const count = option.value === null ? kindCounts.all : kindCounts[option.value];
            return (
              <button
                key={option.label}
                type="button"
                className={`kind-btn${active ? " is-active" : ""}`}
                onClick={() => chooseKind(option.value)}
                aria-pressed={active}
              >
                {option.label}
                <span className="kind-btn-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {topicsApply ? (
        <div className="glossary-facet is-secondary">
          <span className="facet-label" id="facet-topic">
            Topic
          </span>
          <div className="glossary-tags" role="group" aria-labelledby="facet-topic">
            <button
              type="button"
              className={`tag-chip${tag === null ? " is-active" : ""}`}
              onClick={() => setTag(null)}
              aria-pressed={tag === null}
            >
              All topics
            </button>
            {glossaryTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-chip${tag === t ? " is-active" : ""}`}
                onClick={() => setTag(tag === t ? null : t)}
                aria-pressed={tag === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="facet-note">
          Topics describe vocabulary, so they don&rsquo;t apply to{" "}
          {kind === "letter" ? "letters" : "patterns"}.
        </p>
      )}

      <p className="glossary-count" role="status">
        {results.length === glossaryEntries.length
          ? `Showing all ${results.length} entries.`
          : `${results.length} of ${glossaryEntries.length} entries.`}
        {tag !== null &&
          kind === null &&
          " Topics apply to words only, so letters and patterns are excluded."}
      </p>

      {results.length === 0 ? (
        <p className="glossary-empty">
          Nothing matches those filters.{" "}
          {isFiltered && (
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </p>
      ) : (
        <ul className="glossary-list">
          {results.map((entry) => (
            <li key={`${entry.kind}-${entry.id}`} className="glossary-row">
              <div className="glossary-arabic-cell">
                <PlayAudioButton text={entry.audioText} label={`Play ${entry.transliteration}`} />
                <ArabicText className="glossary-arabic">{entry.arabic}</ArabicText>
              </div>
              <div className="glossary-gloss-cell">
                <span className="glossary-english">{entry.english}</span>
                <span className="glossary-translit">{entry.transliteration}</span>
                <span className="glossary-detail">{entry.detail}</span>
              </div>
              <div className="glossary-meta-cell">
                <span className={`glossary-kind kind-${entry.kind}`}>{KIND_LABEL[entry.kind]}</span>
                <Link to={`/level/${entry.level}`} className="glossary-level-link">
                  Level {entry.level}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
