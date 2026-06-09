import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '@/components/Spinner';
import { signOut, useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useProfileStats } from '../hooks/useProfileStats';
import StatCard from '../components/StatCard';
import VideoThumbList from '../components/VideoThumbList';

// Code-split recharts into its own chunk.
const ProfileCharts = lazy(() => import('../components/ProfileCharts'));

function formatWatchTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function ProfilePage() {
  const { profile, isPremium } = useAuth();
  const email = useAuthStore((s) => s.session?.user.email);
  const { goPremium } = usePremiumGate();
  const { stats, loading, error } = useProfileStats();

  const hasCharts =
    !!stats && (stats.quizByCategory.length > 0 || stats.viewsByCategory.length > 0);

  return (
    <div className="min-h-screen bg-ink-900 pb-12">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-bold">Profile</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/feed" className="text-brand-400 hover:underline">
            ← Feed
          </Link>
          <button onClick={signOut} className="text-white/60 hover:text-white">
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-5">
        {/* Identity */}
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-xl font-bold">
              {(profile?.name ?? 'U').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{profile?.name ?? 'Learner'}</p>
            {email && <p className="truncate text-sm text-white/50">{email}</p>}
          </div>
        </div>

        {/* Premium status */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-700 p-4">
          {isPremium ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-300">★ Premium member</p>
                {profile?.premium_expires_at && (
                  <p className="text-xs text-white/50">
                    Renews / expires{' '}
                    {new Date(profile.premium_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">You're on the Free plan</p>
                <p className="text-xs text-white/50">Unlock guided lessons, quizzes & live.</p>
              </div>
              <button
                type="button"
                onClick={goPremium}
                className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-300">Couldn't load stats: {error}</p>}

        {loading || !stats ? (
          <div className="py-10">
            <Spinner label="Crunching your stats…" />
          </div>
        ) : (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Videos viewed" value={String(stats.totalViewed)} />
              <StatCard label="Watch time" value={formatWatchTime(stats.totalWatchSec)} />
              <StatCard
                label="Quizzes taken"
                value={String(stats.quizTotal)}
                hint={`${stats.quizCorrect} correct`}
              />
              <StatCard label="Quiz accuracy" value={`${stats.accuracy}%`} />
            </div>

            {/* Charts (lazy) */}
            {hasCharts && (
              <Suspense
                fallback={
                  <div className="py-6">
                    <Spinner label="Loading charts…" />
                  </div>
                }
              >
                <ProfileCharts
                  quizByCategory={stats.quizByCategory}
                  viewsByCategory={stats.viewsByCategory}
                />
              </Suspense>
            )}

            {/* Lists */}
            <VideoThumbList
              title="Liked"
              videos={stats.liked}
              emptyHint="Videos you like will appear here."
            />
            <VideoThumbList
              title="Saved"
              videos={stats.saved}
              emptyHint="Save videos to revisit them later."
            />

            {/* Comments */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">
                Your comments <span className="text-white/40">· {stats.comments.length}</span>
              </h2>
              {stats.comments.length === 0 ? (
                <p className="text-sm text-white/30">You haven't commented yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.comments.map((c) => (
                    <div key={c.id} className="rounded-xl border border-white/10 bg-ink-800 p-3">
                      <p className="text-sm text-white/85">{c.text}</p>
                      {c.video && (
                        <p className="mt-1 text-xs text-white/40">on “{c.video.title}”</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
