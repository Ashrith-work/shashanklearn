import { supabase } from '@/lib/supabase';
import { GUIDED_BUCKET } from '@/features/feed/hooks/useResolvedSource';
import type { LiveClass, LiveStatus, Quiz, Video, VideoType } from '@/types';

// ── Storage upload ────────────────────────────────────────────────────────────
const PUBLIC_BUCKETS = ['avatars', 'thumbnails', 'free-videos'];

export interface UploadResult {
  /** Object key within the bucket. */
  key: string;
  /** Public URL (public buckets only); null for private buckets. */
  publicUrl: string | null;
  error: string | null;
}

/** Upload a file to a bucket under a random key. */
export async function uploadToBucket(
  bucket: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
  const key = `${crypto.randomUUID()}${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(key, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { key, publicUrl: null, error: error.message };
  const publicUrl = PUBLIC_BUCKETS.includes(bucket)
    ? supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl
    : null;
  return { key, publicUrl, error: null };
}

// ── Videos ────────────────────────────────────────────────────────────────────
export async function listVideos(): Promise<Video[]> {
  const { data } = await supabase
    .from('videos')
    .select('*')
    .order('order_index', { ascending: true });
  return data ?? [];
}

export interface VideoInput {
  title: string;
  description: string;
  category: string;
  type: VideoType;
  order_index: number;
  duration_sec: number | null;
  video_url: string;
  thumbnail_url: string | null;
}

export async function createVideo(input: VideoInput): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').insert(input);
  return { error: error?.message ?? null };
}

export async function updateVideo(
  id: string,
  patch: Partial<VideoInput>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').update(patch).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteVideo(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/** Upload a guided video file and return the object KEY to store as video_url. */
export async function uploadGuidedVideo(file: File): Promise<UploadResult> {
  return uploadToBucket(GUIDED_BUCKET, file);
}

// ── Quizzes ───────────────────────────────────────────────────────────────────
export async function listGuidedVideos(): Promise<Video[]> {
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('type', 'guided')
    .order('order_index', { ascending: true });
  return data ?? [];
}

export async function listQuizzes(videoId: string): Promise<Quiz[]> {
  const { data } = await supabase
    .from('quizzes')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createQuiz(input: {
  video_id: string;
  question: string;
  options: string[];
  correct_index: number;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('quizzes').insert(input);
  return { error: error?.message ?? null };
}

export async function deleteQuiz(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Live classes ──────────────────────────────────────────────────────────────
export async function listLiveClasses(): Promise<LiveClass[]> {
  const { data } = await supabase
    .from('live_classes')
    .select('*')
    .order('scheduled_at', { ascending: false });
  return data ?? [];
}

export async function createLiveClass(input: {
  title: string;
  description: string;
  scheduled_at: string;
  room_id: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('live_classes').insert(input);
  return { error: error?.message ?? null };
}

export async function setLiveStatus(
  id: string,
  status: LiveStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('live_classes').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteLiveClass(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('live_classes').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface PlatformStats {
  users: number;
  premium: number;
  videos: number;
  liveClasses: number;
  topVideos: { id: string; title: string; likes: number }[];
}

export async function getStats(): Promise<PlatformStats> {
  const [usersRes, premiumRes, videoCountRes, liveCountRes, likeRows, videos] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      supabase.from('live_classes').select('*', { count: 'exact', head: true }),
      supabase.from('interactions').select('video_id').eq('type', 'like'),
      supabase.from('videos').select('id, title'),
    ]);

  // Tally likes per video (likes are public-readable, so this respects RLS).
  const counts = new Map<string, number>();
  for (const row of likeRows.data ?? []) {
    counts.set(row.video_id, (counts.get(row.video_id) ?? 0) + 1);
  }
  const titles = new Map((videos.data ?? []).map((v) => [v.id, v.title]));
  const topVideos = [...counts.entries()]
    .map(([id, likes]) => ({ id, title: titles.get(id) ?? 'Untitled', likes }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  return {
    users: usersRes.count ?? 0,
    premium: premiumRes.count ?? 0,
    videos: videoCountRes.count ?? 0,
    liveClasses: liveCountRes.count ?? 0,
    topVideos,
  };
}
