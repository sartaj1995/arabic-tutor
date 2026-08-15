import { Routes, Route, Link } from "react-router-dom";
import LevelList from "./pages/LevelList";
import LevelDetail from "./pages/LevelDetail";
import Review from "./pages/Review";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Arabic Tutor
        </Link>
        <nav className="app-nav">
          <Link to="/progress" className="app-nav-link">
            📊 Progress
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/level/:number" element={<LevelDetail />} />
        </Routes>
      </main>
    </div>
  );
}
