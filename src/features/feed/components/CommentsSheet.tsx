import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CloseIcon } from '@/components/icons';
import { DEMO, demoComments } from '@/demo/demo';
import type { FeedVideo } from '@/types';

interface CommentRow {
  id: string;
  comment_text: string | null;
  created_at: string;
  author: { name: string | null; avatar_url: string | null } | null;
}

interface CommentsSheetProps {
  video: FeedVideo;
  onClose: () => void;
  /** Returns true if the insert succeeded. */
  onAddComment: (videoId: string, text: string) => Promise<boolean>;
}

/** Bottom-sheet comment list + composer for a single video. */
export default function CommentsSheet({
  video,
  onClose,
  onAddComment,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    if (DEMO) {
      setComments(
        demoComments.map((c, i) => ({
          id: `demo-c${i}`,
          comment_text: c.text,
          created_at: '',
          author: { name: c.name, avatar_url: null },
        }))
      );
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('interactions')
      .select('id, comment_text, created_at, author:profiles(name, avatar_url)')
      .eq('video_id', video.id)
      .eq('type', 'comment')
      .order('created_at', { ascending: false })
      .returns<CommentRow[]>();
    setComments(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  async function handleSend() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const ok = await onAddComment(video.id, value);
    setSending(false);
    if (!ok) return;
    setText('');
    if (DEMO) {
      setComments((prev) => [
        { id: crypto.randomUUID(), comment_text: value, created_at: '', author: { name: 'You', avatar_url: null } },
        ...prev,
      ]);
    } else {
      await load();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative z-10 flex max-h-[70vh] flex-col rounded-t-2xl bg-ink-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold">
            Comments{comments.length ? ` · ${comments.length}` : ''}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <CloseIcon className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-center text-sm text-white/40">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-white/40">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar name={c.author?.name} url={c.author?.avatar_url} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/80">
                    {c.author?.name ?? 'User'}
                  </p>
                  <p className="text-sm text-white/90">{c.comment_text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Add a comment…"
            className="flex-1 rounded-full border border-white/10 bg-ink-700 px-4 py-2.5 text-sm outline-none placeholder-white/40 focus:border-brand-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, url }: { name?: string | null; url?: string | null }) {
  if (url) {
    return <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold">
      {(name ?? 'U').charAt(0).toUpperCase()}
    </span>
  );
}
