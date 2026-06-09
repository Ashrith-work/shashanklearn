import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthBootstrap } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/features/auth/pages/LoginPage';
import AuthCallbackPage from '@/features/auth/pages/AuthCallbackPage';
import FeedPage from '@/features/feed/pages/FeedPage';
import LivePage from '@/features/live/pages/LivePage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import AdminPage from '@/features/admin/pages/AdminPage';
import UpgradeModal from '@/features/premium/components/UpgradeModal';
import { DEMO } from '@/demo/demo';

export default function App() {
  // Initialize auth session + profile once at the app root.
  useAuthBootstrap();

  return (
    <>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedRoute>
            <LivePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>

    {/* Global premium upgrade modal — openable from any "Go Premium" CTA. */}
    <UpgradeModal />

    {DEMO && (
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
        Demo mode · sample data, resets on reload
      </div>
    )}
    </>
  );
}
