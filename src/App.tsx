import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigationType } from "react-router-dom";
import LevelList from "./pages/LevelList";
import LevelDetail from "./pages/LevelDetail";
import Review from "./pages/Review";
import Progress from "./pages/Progress";
import Glossary from "./pages/Glossary";
import Settings from "./pages/Settings";
import { computeProgressStats } from "./lib/progress";

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 16.5V9M10 16.5V3.5M16 16.5v-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 4.8c1.5-.8 3.4-1 5-.3 1 .4 1.4.9 1.4 1.4v9.5c0-.5-.4-1-1.4-1.4-1.6-.7-3.5-.5-5 .3V4.8ZM16 4.8c-1.5-.8-3.4-1-5-.3-1 .4-1.4.9-1.4 1.4v9.5c0-.5.4-1 1.4-1.4 1.6-.7 3.5-.5 5 .3V4.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M15.83 8.22L18.08 8.58L18.08 11.42L15.83 11.78L15.39 12.86L16.72 14.70L14.70 16.72L12.86 15.39L11.78 15.83L11.42 18.08L8.58 18.08L8.22 15.83L7.14 15.39L5.30 16.72L3.28 14.70L4.61 12.86L4.17 11.78L1.92 11.42L1.92 8.58L4.17 8.22L4.61 7.14L3.28 5.30L5.30 3.28L7.14 4.61L8.22 4.17L8.58 1.92L11.42 1.92L11.78 4.17L12.86 4.61L14.70 3.28L16.72 5.30L15.39 7.14Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 17.2c3.2 0 5.2-2 5.2-4.8 0-2.3-1.3-3.6-2.2-5-.2 1.4-1 2.3-1.8 2.8.2-1.9-.6-4-2.2-5.4-.3 2-1 3-2.2 4.3C5.5 10.4 4.8 11.5 4.8 13c0 2.6 2 4.2 5.2 4.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isCurrent = (path: string) => location.pathname === path;
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [nextLevelNumber, setNextLevelNumber] = useState<number | null | undefined>(undefined);
  const mainRef = useRef<HTMLElement>(null);
  // The history entry the app first loaded on. Compared by key rather than
  // with a "first render" flag, because StrictMode runs effects twice on
  // mount and a flag would mistake the initial load for a navigation.
  const initialLocationKey = useRef(location.key);

  useEffect(() => {
    computeProgressStats().then((stats) => {
      setStreakDays(stats.streakDays);
      setNextLevelNumber(stats.nextLevelNumber);
    });
  }, [location.pathname]);

  // BrowserRouter leaves the window's scroll position alone, so opening a
  // level from low down the home page used to land mid-page with the title
  // off-screen. New pages now open at the top, and focus moves into them so a
  // screen reader announces the page instead of staying on a link that no
  // longer exists. Back and forward (POP) are left to the browser, which puts
  // the learner back where they were.
  useEffect(() => {
    if (location.key === initialLocationKey.current || navigationType === "POP") return;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location.key, navigationType]);

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Arabic Tutor
        </Link>
        <div className="app-header-right">
          {/* Status and navigation are two different kinds of thing, so they
              read as two groups separated by a rule rather than one run of
              text the eye has to parse apart. */}
          <div className="header-meta">
            {/* The actual next level, not "completed count + 1": those differ as
                soon as a learner skips ahead and comes back. */}
            {nextLevelNumber !== undefined && (
              <span className="header-level-indicator">
                {nextLevelNumber === null ? "All 100 levels done" : `Level ${nextLevelNumber} of 100`}
              </span>
            )}
            {streakDays !== null && streakDays > 0 && (
              <span className="header-streak" title={`${streakDays}-day streak`}>
                <FlameIcon />
                <span aria-hidden="true">{streakDays}</span>
                <span className="visually-hidden">{streakDays}-day streak</span>
              </span>
            )}
          </div>
          <nav className="app-nav" aria-label="Sections">
            <Link
              to="/glossary"
              className={`app-nav-link${isCurrent("/glossary") ? " is-active" : ""}`}
              aria-current={isCurrent("/glossary") ? "page" : undefined}
            >
              <BookIcon />
              Glossary
            </Link>
            <Link
              to="/progress"
              className={`app-nav-link${isCurrent("/progress") ? " is-active" : ""}`}
              aria-current={isCurrent("/progress") ? "page" : undefined}
            >
              <ChartIcon />
              Progress
            </Link>
          </nav>
        </div>
        {/* Icon-only, since it's a utility rather than a section of the course.
            The label is what screen readers announce; the title is a hover hint. */}
        <Link
          to="/settings"
          className={`app-settings-link${isCurrent("/settings") ? " is-active" : ""}`}
          aria-label="Settings"
          title="Settings"
          aria-current={isCurrent("/settings") ? "page" : undefined}
        >
          <GearIcon />
        </Link>
      </header>
      <main className="app-main" ref={mainRef} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/level/:number" element={<LevelDetail />} />
        </Routes>
      </main>
    </div>
  );
}
