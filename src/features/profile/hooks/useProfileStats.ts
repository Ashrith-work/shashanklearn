import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { DEMO, demoStats } from '@/demo/demo';
import type { InteractionType, VideoType } from '@/types';

export interface VideoLite {
  id: string;
  title: string;
  thumbnail_url: string | null;
  type: VideoType;
  category: string | null;
}

export interface ProfileStats {
  totalViewed: number;
  totalWatchSec: number;
  quizTotal: number;
  quizCorrect: number;
  accuracy: number;
  quizByCategory: { category: string; accuracy: number; total: number }[];
  viewsByCategory: { category: string; count: number }[];
  liked: VideoLite[];
  saved: VideoLite[];
  comments: { id: string; text: string; created_at: string; video: VideoLite | null }[];
}

// Shapes of the embedded query results.
interface CategoryRow {
  view_duration_sec: number;
  videos: { category: string | null } | null;
}
interface AttemptRow {
  is_correct: boolean;
  videos: { category: string | null } | null;
}
interface InteractionRow {
  id: string;
  type: InteractionType;
  comment_text: string | null;
  created_at: string;
  videos: VideoLite | null;
}

const UNCATEGORIZED = 'Other';

/** Loads and aggregates the signed-in user's analytics for the dashboard. */
export function useProfileStats() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO) {
      setStats(demoStats);
      setLoading(false);
      return;
    }
    if (!userId) return;
    let active = true;

    (async () => {
      const [scrollRes, attemptRes, interactionRes] = await Promise.all([
        supabase
          .from('scroll_events')
          .select('view_duration_sec, videos(category)')
          .eq('user_id', userId)
          .returns<CategoryRow[]>(),
        supabase
          .from('quiz_attempts')
          .select('is_correct, videos(category)')
          .eq('user_id', userId)
          .returns<AttemptRow[]>(),
        supabase
          .from('interactions')
          .select('id, type, comment_text, created_at, videos(id, title, thumbnail_url, type, category)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .returns<InteractionRow[]>(),
      ]);

      if (!active) return;

      const firstError = scrollRes.error || attemptRes.error || interactionRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const scroll = scrollRes.data ?? [];
      const attempts = attemptRes.data ?? [];
      const interactions = interactionRes.data ?? [];

      // Views + watch time.
      const totalViewed = scroll.length;
      const totalWatchSec = scroll.reduce((sum, r) => sum + (r.view_duration_sec ?? 0), 0);

      const viewsByCatMap = new Map<string, number>();
      for (const r of scroll) {
        const cat = r.videos?.category ?? UNCATEGORIZED;
        viewsByCatMap.set(cat, (viewsByCatMap.get(cat) ?? 0) + 1);
      }

      // Quiz accuracy overall + per category.
      const quizTotal = attempts.length;
      const quizCorrect = attempts.filter((a) => a.is_correct).length;
      const accuracy = quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 0;

      const catAgg = new Map<string, { correct: number; total: number }>();
      for (const a of attempts) {
        const cat = a.videos?.category ?? UNCATEGORIZED;
        const cur = catAgg.get(cat) ?? { correct: 0, total: 0 };
        cur.total += 1;
        if (a.is_correct) cur.correct += 1;
        catAgg.set(cat, cur);
      }

      // Interaction lists.
      const liked: VideoLite[] = [];
      const saved: VideoLite[] = [];
      const comments: ProfileStats['comments'] = [];
      for (const it of interactions) {
        if (it.type === 'like' && it.videos) liked.push(it.videos);
        else if (it.type === 'save' && it.videos) saved.push(it.videos);
        else if (it.type === 'comment') {
          comments.push({
            id: it.id,
            text: it.comment_text ?? '',
            created_at: it.created_at,
            video: it.videos,
          });
        }
      }

      setStats({
        totalViewed,
        totalWatchSec,
        quizTotal,
        quizCorrect,
        accuracy,
        quizByCategory: [...catAgg.entries()].map(([category, v]) => ({
          category,
          total: v.total,
          accuracy: Math.round((v.correct / v.total) * 100),
        })),
        viewsByCategory: [...viewsByCatMap.entries()].map(([category, count]) => ({
          category,
          count,
        })),
        liked,
        saved,
        comments,
      });
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return { stats, loading, error };
}
