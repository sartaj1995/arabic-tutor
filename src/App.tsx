import { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import LevelList from "./pages/LevelList";
import LevelDetail from "./pages/LevelDetail";
import Review from "./pages/Review";
import Progress from "./pages/Progress";
import Glossary from "./pages/Glossary";
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
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    computeProgressStats().then((stats) => {
      setStreakDays(stats.streakDays);
      setCompletedCount(stats.levelsCompletedCount);
    });
  }, [location.pathname]);

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Arabic Tutor
        </Link>
        <div className="app-header-right">
          {completedCount !== null && (
            <span className="header-level-indicator">
              Level {Math.min(completedCount + 1, 100)} of 100
            </span>
          )}
          {streakDays !== null && streakDays > 0 && (
            <span className="header-streak">
              <FlameIcon />
              {streakDays}
            </span>
          )}
          <nav className="app-nav">
            <Link to="/glossary" className="app-nav-link">
              <BookIcon />
              Glossary
            </Link>
            <Link to="/progress" className="app-nav-link">
              <ChartIcon />
              Progress
            </Link>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/level/:number" element={<LevelDetail />} />
        </Routes>
      </main>
    </div>
  );
}
