import type { FeedVideo } from '@/types';

/** Bottom-left overlay: title, description, category chip, Free/Premium badge. */
export default function VideoOverlay({ video }: { video: FeedVideo }) {
  const isPremium = video.type === 'guided';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-6 pt-16">
      <div className="pointer-events-auto max-w-[78%] space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              isPremium ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
            }`}
          >
            {isPremium ? 'Premium' : 'Free'}
          </span>
          {video.category && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90">
              {video.category}
            </span>
          )}
        </div>
        <h2 className="text-base font-semibold leading-snug">{video.title}</h2>
        {video.description && (
          <p className="line-clamp-2 text-xs text-white/70">{video.description}</p>
        )}
      </div>
    </div>
  );
}
