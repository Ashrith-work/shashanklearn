import { useEffect, useState } from 'react';
import type { LiveClass, LiveStatus } from '@/types';
import {
  createLiveClass,
  deleteLiveClass,
  listLiveClasses,
  setLiveStatus,
} from '../api';

const input =
  'w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-sm outline-none focus:border-brand-400';

const STATUSES: LiveStatus[] = ['scheduled', 'live', 'ended'];

export default function LiveManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [roomId, setRoomId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setClasses(await listLiveClasses());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !scheduledAt) return setError('Title and time are required.');
    setBusy(true);
    const { error } = await createLiveClass({
      title: title.trim(),
      description: description.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      room_id: roomId.trim() || null,
    });
    setBusy(false);
    if (error) return setError(error);
    setTitle('');
    setDescription('');
    setScheduledAt('');
    setRoomId('');
    refresh();
  }

  async function changeStatus(id: string, status: LiveStatus) {
    const { error } = await setLiveStatus(id, status);
    if (error) setError(error);
    else refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this live class?')) return;
    const { error } = await deleteLiveClass(id);
    if (error) setError(error);
    else refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
        <h2 className="text-sm font-semibold">Schedule a live class</h2>
        <input className={input} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={input}
          rows={2}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="block text-xs text-white/50">
          Scheduled time
          <input
            className={`${input} mt-1`}
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>
        <input
          className={input}
          placeholder="Room ID (provider room handle, optional)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        {error && <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Schedule'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Classes · {classes.length}</h2>
        {classes.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-ink-800 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="text-xs text-white/40">
                  {new Date(c.scheduled_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="shrink-0 text-xs text-red-300 hover:text-red-200"
              >
                Delete
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatus(c.id, s)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                    c.status === s
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
