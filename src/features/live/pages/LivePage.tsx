import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LiveClassPublic } from '@/types';
import Spinner from '@/components/Spinner';
import { LockIcon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useLiveClasses } from '../hooks/useLiveClasses';
import LiveClassCard from '../components/LiveClassCard';
import LiveRoom from '../components/LiveRoom';

export default function LivePage() {
  const { profile } = useAuth();
  const { isPremium, goPremium } = usePremiumGate();
  const { grouped, loading, error } = useLiveClasses();
  const [active, setActive] = useState<LiveClassPublic | null>(null);

  const displayName = profile?.name ?? 'Learner';

  // Non-premium users see the classes locked behind the paywall.
  if (!isPremium) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 px-6 text-center">
        <div className="max-w-sm space-y-4">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-400/20">
            <LockIcon className="h-7 w-7 text-amber-300" />
          </span>
          <h1 className="text-xl font-bold">Live classes are Premium</h1>
          <p className="text-sm text-white/60">
            Join instructors in real time, ask questions, and learn live.
          </p>
          <button
            type="button"
            onClick={goPremium}
            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-black hover:bg-amber-300"
          >
            Go Premium
          </button>
          <Link to="/feed" className="block text-sm text-brand-400 hover:underline">
            ← Back to feed
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner fullScreen label="Loading live classes…" />;

  return (
    <div className="min-h-screen bg-ink-900 pb-10">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-bold">Live classes</h1>
        <Link to="/feed" className="text-sm text-brand-400 hover:underline">
          ← Feed
        </Link>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-5">
        {error && <p className="text-sm text-red-300">Couldn't load classes: {error}</p>}

        <Section title="Live now" items={grouped.live} onJoin={setActive} emptyHint="No classes live right now." />
        <Section title="Upcoming" items={grouped.upcoming} onJoin={setActive} />
        <Section title="Past" items={grouped.past} onJoin={setActive} />

        {!grouped.live.length && !grouped.upcoming.length && !grouped.past.length && (
          <p className="pt-10 text-center text-sm text-white/40">
            No live classes scheduled yet.
          </p>
        )}
      </div>

      {active && (
        <LiveRoom
          liveClass={active}
          displayName={displayName}
          onLeave={() => setActive(null)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  onJoin,
  emptyHint,
}: {
  title: string;
  items: LiveClassPublic[];
  onJoin: (c: LiveClassPublic) => void;
  emptyHint?: string;
}) {
  if (!items.length && !emptyHint) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</h2>
      {items.length ? (
        items.map((c) => <LiveClassCard key={c.id} liveClass={c} onJoin={onJoin} />)
      ) : (
        <p className="text-sm text-white/30">{emptyHint}</p>
      )}
    </section>
  );
}
