import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { DEMO, demoVideoStats } from '@/demo/demo';

export interface VideoStats {
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
}

const emptyStats = (): VideoStats => ({
  likeCount: 0,
  commentCount: 0,
  liked: false,
  saved: false,
});

/**
 * Aggregates like/save/comment state for a set of feed videos and exposes
 * optimistic toggles. Likes & comments are public (counts from everyone); saves
 * are private (RLS only returns the caller's own save rows).
 */
export function useInteractions(videoIds: string[]) {
  const userId = useAuthStore((s) => s.session?.user.id);
  const [stats, setStats] = useState<Record<string, VideoStats>>({});

  useEffect(() => {
    if (DEMO) {
      const map: Record<string, VideoStats> = {};
      for (const id of videoIds) map[id] = demoVideoStats[id] ?? emptyStats();
      setStats(map);
      return;
    }
    if (!videoIds.length || !userId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('video_id, type, user_id')
        .in('video_id', videoIds);

      if (!active || error || !data) return;

      const map: Record<string, VideoStats> = {};
      for (const id of videoIds) map[id] = emptyStats();
      for (const row of data) {
        const s = map[row.video_id];
        if (!s) continue;
        if (row.type === 'like') {
          s.likeCount += 1;
          if (row.user_id === userId) s.liked = true;
        } else if (row.type === 'comment') {
          s.commentCount += 1;
        } else if (row.type === 'save' && row.user_id === userId) {
          s.saved = true;
        }
      }
      setStats(map);
    })();
    return () => {
      active = false;
    };
  }, [videoIds, userId]);

  const toggleLike = useCallback(
    async (videoId: string) => {
      if (!userId) return;
      const wasLiked = stats[videoId]?.liked ?? false;
      // Optimistic update.
      setStats((prev) => {
        const cur = prev[videoId] ?? emptyStats();
        return {
          ...prev,
          [videoId]: {
            ...cur,
            liked: !wasLiked,
            likeCount: Math.max(0, cur.likeCount + (wasLiked ? -1 : 1)),
          },
        };
      });
      if (DEMO) return;
      const { error } = wasLiked
        ? await supabase
            .from('interactions')
            .delete()
            .match({ user_id: userId, video_id: videoId, type: 'like' })
        : await supabase
            .from('interactions')
            .insert({ user_id: userId, video_id: videoId, type: 'like' });
      if (error) console.error('toggleLike failed:', error.message);
    },
    [userId, stats]
  );

  const toggleSave = useCallback(
    async (videoId: string) => {
      if (!userId) return;
      const wasSaved = stats[videoId]?.saved ?? false;
      setStats((prev) => {
        const cur = prev[videoId] ?? emptyStats();
        return { ...prev, [videoId]: { ...cur, saved: !wasSaved } };
      });
      if (DEMO) return;
      const { error } = wasSaved
        ? await supabase
            .from('interactions')
            .delete()
            .match({ user_id: userId, video_id: videoId, type: 'save' })
        : await supabase
            .from('interactions')
            .insert({ user_id: userId, video_id: videoId, type: 'save' });
      if (error) console.error('toggleSave failed:', error.message);
    },
    [userId, stats]
  );

  const addComment = useCallback(
    async (videoId: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!userId || !trimmed) return false;
      if (DEMO) {
        setStats((prev) => {
          const cur = prev[videoId] ?? emptyStats();
          return { ...prev, [videoId]: { ...cur, commentCount: cur.commentCount + 1 } };
        });
        return true;
      }
      const { error } = await supabase.from('interactions').insert({
        user_id: userId,
        video_id: videoId,
        type: 'comment',
        comment_text: trimmed,
      });
      if (error) {
        console.error('addComment failed:', error.message);
        return false;
      }
      setStats((prev) => {
        const cur = prev[videoId] ?? emptyStats();
        return { ...prev, [videoId]: { ...cur, commentCount: cur.commentCount + 1 } };
      });
      return true;
    },
    [userId]
  );

  return { stats, toggleLike, toggleSave, addComment };
}
