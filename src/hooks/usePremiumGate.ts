import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStore } from '@/store/premiumStore';
import type { VideoType } from '@/types';

/**
 * Central premium-gating logic. A guided video is "locked" when its `video_url`
 * is absent — the server (feed_videos view + Storage RLS) masks it for
 * non-premium users, so a missing URL on a guided row is the gate signal.
 */
export function usePremiumGate() {
  const { isPremium, isAdmin } = useAuth();
  const openUpgrade = usePremiumStore((s) => s.openUpgrade);

  const isLocked = useCallback(
    (video: { type: VideoType; video_url: string | null }) =>
      video.type === 'guided' && !video.video_url,
    []
  );

  // "Go Premium" opens the global Razorpay upgrade modal from anywhere.
  const goPremium = useCallback(() => openUpgrade(), [openUpgrade]);

  return { isPremium, isAdmin, isLocked, goPremium };
}
