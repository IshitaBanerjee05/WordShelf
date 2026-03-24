import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'
import AppLayout from './layout/AppLayout'

/**
 * Wraps all protected routes.
 * - Shows loader while auth state is being restored from localStorage
 * - Redirects to /login if not authenticated (preserves intended URL)
 * - Renders <AppLayout> (sidebar + navbar) around page content
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
