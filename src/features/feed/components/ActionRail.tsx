import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  MutedIcon,
  SpeakerIcon,
} from '@/components/icons';
import type { VideoStats } from '../hooks/useInteractions';

interface ActionRailProps {
  stats?: VideoStats;
  muted: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onToggleMute: () => void;
}

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

/** Right-side vertical action rail: like, comment, save, mute. */
export default function ActionRail({
  stats,
  muted,
  onLike,
  onSave,
  onComment,
  onToggleMute,
}: ActionRailProps) {
  const liked = stats?.liked ?? false;
  const saved = stats?.saved ?? false;

  return (
    <div className="absolute bottom-28 right-3 z-20 flex flex-col items-center gap-5">
      <RailButton label={compact(stats?.likeCount ?? 0)} onClick={onLike}>
        <HeartIcon
          filled={liked}
          className={`h-7 w-7 ${liked ? 'text-red-500' : 'text-white'}`}
        />
      </RailButton>

      <RailButton label={compact(stats?.commentCount ?? 0)} onClick={onComment}>
        <CommentIcon className="h-7 w-7 text-white" />
      </RailButton>

      <RailButton label={saved ? 'Saved' : 'Save'} onClick={onSave}>
        <BookmarkIcon
          filled={saved}
          className={`h-7 w-7 ${saved ? 'text-brand-400' : 'text-white'}`}
        />
      </RailButton>

      <RailButton label={muted ? 'Muted' : 'Sound'} onClick={onToggleMute}>
        {muted ? (
          <MutedIcon className="h-6 w-6 text-white" />
        ) : (
          <SpeakerIcon className="h-6 w-6 text-white" />
        )}
      </RailButton>
    </div>
  );
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:scale-90"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-black/30 backdrop-blur-sm">
        {children}
      </span>
      <span className="text-[11px] font-medium text-white drop-shadow">{label}</span>
    </button>
  );
}
