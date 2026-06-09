import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFeedStore } from '@/store/feedStore';

/**
 * Loads the feed from the `feed_videos` view (guided URLs already masked for
 * non-premium callers) ordered by `order_index`. Stores results in feedStore.
 */
export function useFeed() {
  const videos = useFeedStore((s) => s.videos);
  const setVideos = useFeedStore((s) => s.setVideos);
  const [loading, setLoading] = useState(videos.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('feed_videos')
        .select('*')
        .order('order_index', { ascending: true });

      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setVideos(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [setVideos]);

  return { videos, loading, error };
}
