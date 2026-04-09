import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Bookshelf from "./pages/Bookshelf";
import Vocabulary from "./pages/Vocabulary";
import Flashcards from "./pages/Flashcards";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Protected routes — redirect to /auth if not logged in */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bookshelf" element={<Bookshelf />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="*" element={<div className="p-8"><h2 className="text-2xl font-bold">Coming Soon</h2></div>} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
