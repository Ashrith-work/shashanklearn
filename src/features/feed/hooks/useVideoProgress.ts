import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

/**
 * Upserts a row in `video_progress` (unique on user_id + video_id). Callers
 * throttle how often they invoke this; here we just write.
 */
export function useVideoProgress() {
  const userId = useAuthStore((s) => s.session?.user.id);

  const saveProgress = useCallback(
    async (videoId: string, watchedPct: number, completed: boolean) => {
      if (!userId) return;
      const { error } = await supabase.from('video_progress').upsert(
        {
          user_id: userId,
          video_id: videoId,
          watched_pct: watchedPct,
          completed,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' }
      );
      if (error) console.error('saveProgress failed:', error.message);
    },
    [userId]
  );

  return { saveProgress };
}
