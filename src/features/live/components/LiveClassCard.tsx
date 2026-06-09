import type { LiveClassPublic, LiveStatus } from '@/types';

interface LiveClassCardProps {
  liveClass: LiveClassPublic;
  onJoin: (liveClass: LiveClassPublic) => void;
}

const STATUS_STYLES: Record<LiveStatus, { label: string; className: string }> = {
  live: { label: '● LIVE', className: 'bg-red-500 text-white' },
  scheduled: { label: 'Upcoming', className: 'bg-white/15 text-white/80' },
  ended: { label: 'Ended', className: 'bg-white/10 text-white/40' },
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function LiveClassCard({ liveClass, onJoin }: LiveClassCardProps) {
  const status = STATUS_STYLES[liveClass.status];
  const isLive = liveClass.status === 'live';

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
        >
          {status.label}
        </span>
        <span className="text-xs text-white/40">{formatWhen(liveClass.scheduled_at)}</span>
      </div>

      <h3 className="text-base font-semibold leading-snug">{liveClass.title}</h3>
      {liveClass.description && (
        <p className="mt-1 line-clamp-2 text-sm text-white/60">{liveClass.description}</p>
      )}

      {isLive ? (
        <button
          type="button"
          onClick={() => onJoin(liveClass)}
          className="mt-3 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500"
        >
          Join now
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 w-full rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white/40"
        >
          {liveClass.status === 'scheduled' ? 'Starts soon' : 'Class ended'}
        </button>
      )}
    </div>
  );
}
