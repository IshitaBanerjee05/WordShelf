import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Bookshelf from "./pages/Bookshelf";
import Vocabulary from "./pages/Vocabulary";
import Flashcards from "./pages/Flashcards";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Protected Routes (Mocked for demo) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookshelf" element={<Bookshelf />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="*" element={<div className="p-8"><h2 className="text-2xl font-bold">Coming Soon</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
