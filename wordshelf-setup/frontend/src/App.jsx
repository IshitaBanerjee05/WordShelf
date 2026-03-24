import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import PageLoader        from './components/ui/PageLoader'
import { Suspense, lazy } from 'react'

// ── Lazy-loaded pages (code splitting) ───────────────────────
// Public
const Landing        = lazy(() => import('./pages/Landing'))
const Login          = lazy(() => import('./pages/Auth/Login'))
const SignUp         = lazy(() => import('./pages/Auth/SignUp'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword  = lazy(() => import('./pages/Auth/ResetPassword'))

// Protected
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Bookshelf      = lazy(() => import('./pages/Bookshelf'))
const BookDetail     = lazy(() => import('./pages/Bookshelf/BookDetail'))
const Vocabulary     = lazy(() => import('./pages/Vocabulary'))
const WordDetail     = lazy(() => import('./pages/Vocabulary/WordDetail'))
const Revision       = lazy(() => import('./pages/Revision'))
const Flashcards     = lazy(() => import('./pages/Revision/Flashcards'))
const SessionSummary = lazy(() => import('./pages/Revision/SessionSummary'))
const Analytics      = lazy(() => import('./pages/Analytics'))
const RISPage        = lazy(() => import('./pages/Analytics/RISPage'))
const Profile        = lazy(() => import('./pages/Profile'))

// Error / Fallback
const NotFound       = lazy(() => import('./pages/NotFound'))

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Public routes ── */}
              <Route path="/"                  element={<Landing />} />
              <Route path="/login"             element={<Login />} />
              <Route path="/signup"            element={<SignUp />} />
              <Route path="/forgot-password"   element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* ── Protected routes ── */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard"            element={<Dashboard />} />
                <Route path="/bookshelf"            element={<Bookshelf />} />
                <Route path="/bookshelf/:id"        element={<BookDetail />} />
                <Route path="/vocabulary"           element={<Vocabulary />} />
                <Route path="/vocabulary/:wordId"   element={<WordDetail />} />
                <Route path="/revision"             element={<Revision />} />
                <Route path="/revision/flashcards"  element={<Flashcards />} />
                <Route path="/revision/summary"     element={<SessionSummary />} />
                <Route path="/analytics"            element={<Analytics />} />
                <Route path="/analytics/ris"        element={<RISPage />} />
                <Route path="/profile"              element={<Profile />} />
              </Route>

              {/* ── Fallbacks ── */}
              <Route path="/404"  element={<NotFound />} />
              <Route path="*"     element={<Navigate to="/404" replace />} />

            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
