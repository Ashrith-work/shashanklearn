import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FeedVideo } from '@/types';
import Logo from '@/components/Logo';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useFeedStore } from '@/store/feedStore';
import { useFeed } from '../hooks/useFeed';
import { useInteractions } from '../hooks/useInteractions';
import { useScrollLogger } from '../hooks/useScrollLogger';
import VideoCard from '../components/VideoCard';
import CommentsSheet from '../components/CommentsSheet';
import QuizModal from '@/features/quiz/components/QuizModal';

/** How many cards on each side of the active one to keep loaded. */
const PRELOAD_AHEAD = 2;
const PRELOAD_BEHIND = 1;

export default function FeedPage() {
  const { videos, loading, error } = useFeed();
  const { isAdmin } = useAuth();
  const activeIndex = useFeedStore((s) => s.activeIndex);
  const setActiveIndex = useFeedStore((s) => s.setActiveIndex);

  const videoIds = useMemo(() => videos.map((v) => v.id), [videos]);
  const { stats, toggleLike, toggleSave, addComment } = useInteractions(videoIds);
  const { markActive } = useScrollLogger();

  const [commentsFor, setCommentsFor] = useState<FeedVideo | null>(null);
  const [quizFor, setQuizFor] = useState<FeedVideo | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // A guided video finishing pops its quiz (free videos never have one).
  function handleVideoEnded(video: FeedVideo) {
    if (video.type === 'guided') setQuizFor(video);
  }

  // Detect the active card via IntersectionObserver (most-visible wins).
  useEffect(() => {
    if (!videos.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { threshold: [0.6] }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [videos.length, setActiveIndex]);

  // Log view duration whenever the active video changes.
  useEffect(() => {
    const v = videos[activeIndex];
    markActive(v ? v.id : null);
  }, [activeIndex, videos, markActive]);

  if (loading) return <Spinner fullScreen label="Loading your feed…" />;

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 px-6 text-center">
        <p className="text-sm text-red-300">Couldn't load the feed: {error}</p>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 px-6 text-center">
        <p className="text-sm text-white/50">No videos yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* Top overlay bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-3">
        <Logo />
        <nav className="pointer-events-auto flex items-center gap-4 text-sm font-medium text-white/80">
          <Link to="/live" className="hover:text-white">
            Live
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-white">
              Admin
            </Link>
          )}
          <Link to="/profile" className="hover:text-white">
            Profile
          </Link>
        </nav>
      </div>

      {/* Snap-scroll feed */}
      <div className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((video, index) => {
          const shouldPreload =
            index >= activeIndex - PRELOAD_BEHIND &&
            index <= activeIndex + PRELOAD_AHEAD;
          return (
            <div
              key={video.id}
              data-index={index}
              ref={(el) => (cardRefs.current[index] = el)}
              className="h-full w-full"
            >
              <VideoCard
                video={video}
                isActive={index === activeIndex}
                shouldPreload={shouldPreload}
                stats={stats[video.id]}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
                onOpenComments={setCommentsFor}
                onEnded={handleVideoEnded}
              />
            </div>
          );
        })}
      </div>

      {commentsFor && (
        <CommentsSheet
          video={commentsFor}
          onClose={() => setCommentsFor(null)}
          onAddComment={addComment}
        />
      )}

      {quizFor && (
        <QuizModal videoId={quizFor.id} onClose={() => setQuizFor(null)} />
      )}
    </div>
  );
}
