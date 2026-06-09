import { useEffect, useState } from 'react';
import type { Video, VideoType } from '@/types';
import {
  createVideo,
  deleteVideo,
  listVideos,
  uploadToBucket,
} from '../api';

const input =
  'w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-sm outline-none focus:border-brand-400';

const emptyForm = {
  title: '',
  description: '',
  category: '',
  type: 'free' as VideoType,
  order_index: 0,
  duration_sec: '',
  videoUrl: '',
};

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setVideos(await listVideos());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Title is required.');
    setBusy(true);
    try {
      // Thumbnail (optional upload).
      let thumbnail_url: string | null = null;
      if (thumbFile) {
        const up = await uploadToBucket('thumbnails', thumbFile);
        if (up.error) throw new Error(`Thumbnail: ${up.error}`);
        thumbnail_url = up.publicUrl;
      }

      // Video: upload to the right bucket, or fall back to a pasted URL/key.
      let video_url = form.videoUrl.trim();
      if (videoFile) {
        const bucket = form.type === 'guided' ? 'guided-videos' : 'free-videos';
        const up = await uploadToBucket(bucket, videoFile);
        if (up.error) throw new Error(`Video: ${up.error}`);
        // Free -> public URL; guided -> private object key (signed at play time).
        video_url = form.type === 'guided' ? up.key : (up.publicUrl ?? '');
      }
      if (!video_url) throw new Error('Provide a video file or a URL/key.');

      const { error } = await createVideo({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        type: form.type,
        order_index: Number(form.order_index) || 0,
        duration_sec: form.duration_sec ? Number(form.duration_sec) : null,
        video_url,
        thumbnail_url,
      });
      if (error) throw new Error(error);

      setForm(emptyForm);
      setVideoFile(null);
      setThumbFile(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this video? This also removes its quizzes.')) return;
    const { error } = await deleteVideo(id);
    if (error) setError(error);
    else refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
        <h2 className="text-sm font-semibold">Add a video</h2>

        <input
          className={input}
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className={input}
          placeholder="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={input}
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <select
            className={input}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as VideoType })}
          >
            <option value="free">Free</option>
            <option value="guided">Guided (premium)</option>
          </select>
          <input
            className={input}
            type="number"
            placeholder="Order index"
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
          />
          <input
            className={input}
            type="number"
            placeholder="Duration (sec)"
            value={form.duration_sec}
            onChange={(e) => setForm({ ...form, duration_sec: e.target.value })}
          />
        </div>

        <input
          className={input}
          placeholder="Video URL or storage key (or upload below)"
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
        />
        <label className="block text-xs text-white/50">
          Video file
          <input
            type="file"
            accept="video/*,application/vnd.apple.mpegurl"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-xs text-white/70"
          />
        </label>
        <label className="block text-xs text-white/50">
          Thumbnail image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-xs text-white/70"
          />
        </label>

        {error && <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Add video'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">All videos · {videos.length}</h2>
        {videos.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-800 p-3">
            <span className="w-8 text-center text-xs text-white/40">#{v.order_index}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{v.title}</p>
              <p className="text-xs text-white/40">{v.category || 'Uncategorized'}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                v.type === 'guided' ? 'bg-amber-400 text-black' : 'bg-emerald-400 text-black'
              }`}
            >
              {v.type === 'guided' ? 'PREM' : 'FREE'}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(v.id)}
              className="text-xs text-red-300 hover:text-red-200"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
