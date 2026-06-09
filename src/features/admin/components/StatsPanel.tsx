import { useEffect, useState } from 'react';
import Spinner from '@/components/Spinner';
import StatCard from '@/features/profile/components/StatCard';
import { getStats, type PlatformStats } from '../api';

export default function StatsPanel() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="py-10">
        <Spinner label="Loading stats…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total users" value={String(stats.users)} />
        <StatCard
          label="Premium users"
          value={String(stats.premium)}
          hint={stats.users ? `${Math.round((stats.premium / stats.users) * 100)}% of users` : undefined}
        />
        <StatCard label="Videos" value={String(stats.videos)} />
        <StatCard label="Live classes" value={String(stats.liveClasses)} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Top videos by likes</h2>
        {stats.topVideos.length === 0 ? (
          <p className="text-sm text-white/30">No likes yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.topVideos.map((v, i) => (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-800 p-3"
              >
                <span className="w-5 text-center text-sm font-bold text-white/40">{i + 1}</span>
                <p className="min-w-0 flex-1 truncate text-sm">{v.title}</p>
                <span className="text-sm text-brand-300">♥ {v.likes}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
