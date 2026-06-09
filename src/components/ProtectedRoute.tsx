import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Spinner from './Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Require an admin profile (role === 'admin'). */
  requireAdmin?: boolean;
}

/**
 * Gate a route behind authentication. Redirects unauthenticated users to
 * /login (preserving the attempted path for post-login return). Optionally
 * enforces admin role.
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner fullScreen label="Loading…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
