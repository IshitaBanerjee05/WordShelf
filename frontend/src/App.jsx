import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Bookshelf from "./pages/Bookshelf";
import Vocabulary from "./pages/Vocabulary";
import Flashcards from "./pages/Flashcards";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
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
