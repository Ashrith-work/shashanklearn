import type { VideoLite } from '../hooks/useProfileStats';

interface VideoThumbListProps {
  title: string;
  videos: VideoLite[];
  emptyHint: string;
}

/** Horizontal scroller of video thumbnails (liked / saved lists). */
export default function VideoThumbList({ title, videos, emptyHint }: VideoThumbListProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">
        {title} <span className="text-white/40">· {videos.length}</span>
      </h2>
      {videos.length === 0 ? (
        <p className="text-sm text-white/30">{emptyHint}</p>
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {videos.map((v) => (
            <div key={v.id} className="w-28 shrink-0">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-ink-700">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-white/30">
                    {v.category ?? 'Video'}
                  </div>
                )}
                {v.type === 'guided' && (
                  <span className="absolute left-1 top-1 rounded bg-amber-400 px-1 text-[9px] font-bold text-black">
                    PREM
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-white/80">{v.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
