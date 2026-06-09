import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';

/**
 * Landing route for OAuth (Google) and magic-link returns. The Supabase client
 * (detectSessionInUrl: true) parses the tokens from the URL automatically; we
 * just wait for the auth bootstrap to settle, then route accordingly.
 */
export default function AuthCallbackPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen label="Signing you in…" />;
  }

  return <Navigate to={isAuthenticated ? '/feed' : '/login'} replace />;
}
