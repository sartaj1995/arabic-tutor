import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  filterGlossary,
  glossaryEntries,
  glossaryTags,
  type GlossaryEntry,
} from "../lib/glossary";
import { UNIT_THEMES, unitLevelRange, unitTheme } from "../lib/units";
import ArabicText from "../components/ArabicText";
import PlayAudioButton from "../components/PlayAudioButton";

const KIND_LABEL: Record<GlossaryEntry["kind"], string> = {
  letter: "Letter",
  vocab: "Word",
  pattern: "Pattern",
};

export default function Glossary() {
  const [query, setQuery] = useState("");
  const [unitIndex, setUnitIndex] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const results = useMemo(
    () => filterGlossary({ query, unitIndex, tag }),
    [query, unitIndex, tag],
  );

  const isFiltered = query.trim() !== "" || unitIndex !== null || tag !== null;

  return (
    <div className="glossary-page">
      <Link to="/" className="back-link">
        &larr; All levels
      </Link>
      <h2>Glossary</h2>
      <p className="glossary-intro">
        Every letter, word, and sentence pattern in the course — {glossaryEntries.length} entries
        in all. Search by English meaning or transliteration; accents are optional, so
        &ldquo;sadiq&rdquo; finds &ldquo;ṣadīqun&rdquo;.
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

      {/* Tags exist only on vocabulary in the content model, so choosing one
          necessarily narrows the list to words. Called out below rather than
          silently returning no letters or patterns. */}
      <div className="glossary-tags">
        <button
          type="button"
          className={`tag-chip${tag === null ? " is-active" : ""}`}
          onClick={() => setTag(null)}
          aria-pressed={tag === null}
        >
          All types
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

      <p className="glossary-count" role="status">
        {results.length === glossaryEntries.length
          ? `Showing all ${results.length} entries.`
          : `${results.length} of ${glossaryEntries.length} entries.`}
        {tag !== null && " Tags apply to words only, so letters and patterns are excluded."}
      </p>

      {results.length === 0 ? (
        <p className="glossary-empty">
          Nothing matches those filters.{" "}
          {isFiltered && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setQuery("");
                setUnitIndex(null);
                setTag(null);
              }}
            >
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
