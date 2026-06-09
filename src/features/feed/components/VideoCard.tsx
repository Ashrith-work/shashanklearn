import { useEffect, useRef } from 'react';
import type { FeedVideo } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { LockIcon, PlayIcon } from '@/components/icons';
import { useHlsPlayer } from '../hooks/useHlsPlayer';
import { useResolvedSource } from '../hooks/useResolvedSource';
import { useVideoProgress } from '../hooks/useVideoProgress';
import type { VideoStats } from '../hooks/useInteractions';
import ActionRail from './ActionRail';
import VideoOverlay from './VideoOverlay';

interface VideoCardProps {
  video: FeedVideo;
  isActive: boolean;
  /** Load the HLS source (active card + immediate neighbors). */
  shouldPreload: boolean;
  stats?: VideoStats;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onOpenComments: (video: FeedVideo) => void;
  /** Fired when playback reaches the end (guided videos trigger the quiz). */
  onEnded: (video: FeedVideo) => void;
}

const PROGRESS_SAVE_MS = 5000;

export default function VideoCard({
  video,
  isActive,
  shouldPreload,
  stats,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onEnded,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const muted = usePlayerStore((s) => s.muted);
  const toggleMuted = usePlayerStore((s) => s.toggleMuted);
  const { isLocked: isLockedFn, goPremium } = usePremiumGate();
  const { saveProgress } = useVideoProgress();
  const lastSavedRef = useRef(0);

  // Guided video with no URL => the caller is not premium (URL masked server-side).
  const isLocked = isLockedFn(video);
  // Free videos: direct URL. Guided (premium): sign the private Storage key.
  const { src } = useResolvedSource(video, shouldPreload && !isLocked);

  useHlsPlayer(videoRef, isLocked ? null : src, shouldPreload);

  // Play only the active card; pause everything else.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || isLocked) return;
    if (isActive && shouldPreload) {
      el.play().catch(() => {
        /* autoplay can reject until the user interacts; ignore */
      });
    } else {
      el.pause();
    }
  }, [isActive, shouldPreload, isLocked]);

  // Keep the element's muted flag in sync with the global player store.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const now = performance.now();
    if (now - lastSavedRef.current < PROGRESS_SAVE_MS) return;
    lastSavedRef.current = now;
    const pct = Math.min(100, (el.currentTime / el.duration) * 100);
    saveProgress(video.id, Number(pct.toFixed(2)), pct >= 95);
  }

  function handleEnded() {
    saveProgress(video.id, 100, true);
    // Guided videos trigger the post-video quiz (handled by the feed page).
    onEnded(video);
  }

  return (
    <div className="relative h-full w-full snap-start snap-always overflow-hidden bg-black">
      {/* Poster / thumbnail underlay (shows before/while video loads) */}
      {video.thumbnail_url && (
        <img
          src={video.thumbnail_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {isLocked ? (
        <PaywallOverlay onUpgrade={goPremium} />
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted={muted}
            loop
            preload="none"
            poster={video.thumbnail_url ?? undefined}
            onClick={toggleMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
          {/* Tap hint when muted */}
          {muted && isActive && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/80">
                Tap for sound
              </span>
            </div>
          )}
        </>
      )}

      <VideoOverlay video={video} />

      <ActionRail
        stats={stats}
        muted={muted}
        onLike={() => onToggleLike(video.id)}
        onSave={() => onToggleSave(video.id)}
        onComment={() => onOpenComments(video)}
        onToggleMute={toggleMuted}
      />
    </div>
  );
}

function PaywallOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/60 px-8 text-center backdrop-blur-md">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-amber-400/20">
        <LockIcon className="h-7 w-7 text-amber-300" />
      </span>
      <div className="space-y-1">
        <p className="text-lg font-bold">Premium lesson</p>
        <p className="text-sm text-white/60">
          Unlock guided videos, quizzes, and live classes.
        </p>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-black"
      >
        <PlayIcon className="h-4 w-4" />
        Go Premium
      </button>
    </div>
  );
}
