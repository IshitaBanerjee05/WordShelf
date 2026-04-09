import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}
