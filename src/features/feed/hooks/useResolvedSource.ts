import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedVideo } from '@/types';

export const GUIDED_BUCKET = 'guided-videos';
const SIGNED_URL_TTL = 3600; // 1 hour

/**
 * Resolves the playable source for a feed video:
 *  - free videos store a full URL -> use as-is
 *  - guided videos store a private Storage object key -> mint a short-lived
 *    signed URL (only succeeds for premium users, per the bucket's RLS)
 *  - locked/absent -> null
 *
 * Only resolves when `enabled` (active card + neighbors), so we don't sign
 * every guided video in the feed up front.
 */
export function useResolvedSource(
  video: FeedVideo,
  enabled: boolean
): { src: string | null; resolving: boolean } {
  const isDirectUrl = !!video.video_url && /^https?:\/\//i.test(video.video_url);
  const [src, setSrc] = useState<string | null>(isDirectUrl ? video.video_url : null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!video.video_url) {
      setSrc(null);
      return;
    }
    if (isDirectUrl) {
      setSrc(video.video_url);
      return;
    }
    if (!enabled) return; // a guided key we haven't been asked to load yet

    let active = true;
    setResolving(true);
    (async () => {
      const { data, error } = await supabase.storage
        .from(GUIDED_BUCKET)
        .createSignedUrl(video.video_url as string, SIGNED_URL_TTL);
      if (!active) return;
      if (error) {
        console.error('Could not sign guided video:', error.message);
        setSrc(null);
      } else {
        setSrc(data.signedUrl);
      }
      setResolving(false);
    })();
    return () => {
      active = false;
    };
  }, [video.video_url, isDirectUrl, enabled]);

  return { src, resolving };
}
