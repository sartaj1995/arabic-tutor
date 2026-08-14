import { Routes, Route, Link } from "react-router-dom";
import LevelList from "./pages/LevelList";
import LevelDetail from "./pages/LevelDetail";
import Review from "./pages/Review";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Arabic Tutor
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LevelList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/level/:number" element={<LevelDetail />} />
        </Routes>
      </main>
    </div>
  );
}
