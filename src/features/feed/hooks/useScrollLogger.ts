import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { DEMO } from '@/demo/demo';

/**
 * Logs a `scroll_events` row each time a video stops being the active item,
 * recording how long it was on screen. Drives the "videos scrolled / watch
 * time" analytics. Call `markActive(videoId)` whenever the active video
 * changes; pass null to just flush the current one.
 */
export function useScrollLogger() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const current = useRef<{ videoId: string; startedAt: number } | null>(null);

  const flush = useCallback(() => {
    const c = current.current;
    current.current = null;
    if (DEMO || !c || !userId) return;
    const duration = (performance.now() - c.startedAt) / 1000;
    if (duration < 0.5) return; // ignore quick fly-bys
    void supabase
      .from('scroll_events')
      .insert({
        user_id: userId,
        video_id: c.videoId,
        view_duration_sec: Number(duration.toFixed(2)),
      })
      .then(({ error }) => {
        if (error) console.error('scroll_events insert failed:', error.message);
      });
  }, [userId]);

  const markActive = useCallback(
    (videoId: string | null) => {
      flush();
      if (videoId) current.current = { videoId, startedAt: performance.now() };
    },
    [flush]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flush);
    };
  }, [flush]);

  return { markActive };
}
