/**
 * Demo mode — lets the app run with NO Supabase backend so it can be deployed
 * as a public, no-credentials showcase. Enabled by VITE_DEMO_MODE=true. Every
 * data hook checks `DEMO` and serves the mock data below instead of querying
 * Supabase. Nothing persists; state resets on reload.
 */
import type { Session } from '@supabase/supabase-js';
import type { FeedVideo, LiveClassPublic, Profile } from '@/types';
import type { VideoStats } from '@/features/feed/hooks/useInteractions';
import type { ProfileStats, VideoLite } from '@/features/profile/hooks/useProfileStats';

export const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const NOW = '2026-06-09T00:00:00.000Z';

// Public HLS test streams so the feed actually plays.
const HLS_A = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const HLS_B = 'https://test-streams.mux.dev/pts_shift/master.m3u8';

// Demo user is premium (so guided videos + quiz + live all showcase) but not
// admin (keeps the admin panel, which needs a real backend, out of the demo).
export const demoProfile: Profile = {
  id: 'demo-user',
  name: 'Demo Learner',
  avatar_url: null,
  is_premium: true,
  premium_expires_at: '2026-12-31T00:00:00.000Z',
  role: 'user',
  created_at: NOW,
};

export const demoSession = {
  access_token: 'demo',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo',
  user: { id: 'demo-user', email: 'demo@shashanklearn.app' },
} as unknown as Session;

export const demoVideos: FeedVideo[] = [
  {
    id: 'v1',
    title: 'Intro to Algebra',
    description: 'Variables and expressions in 60 seconds.',
    thumbnail_url: 'https://picsum.photos/seed/algebra/360/640',
    category: 'Math',
    type: 'free',
    order_index: 1,
    duration_sec: 60,
    created_by: null,
    created_at: NOW,
    video_url: HLS_A,
  },
  {
    id: 'v2',
    title: 'The Water Cycle',
    description: 'Evaporation, condensation, precipitation — fast.',
    thumbnail_url: 'https://picsum.photos/seed/water/360/640',
    category: 'Science',
    type: 'free',
    order_index: 2,
    duration_sec: 45,
    created_by: null,
    created_at: NOW,
    video_url: HLS_B,
  },
  {
    id: 'v3',
    title: "Newton's Three Laws",
    description: 'Motion explained with everyday examples.',
    thumbnail_url: 'https://picsum.photos/seed/newton/360/640',
    category: 'Physics',
    type: 'free',
    order_index: 3,
    duration_sec: 75,
    created_by: null,
    created_at: NOW,
    video_url: HLS_A,
  },
  {
    id: 'v4',
    title: 'English Tenses Cheat Sheet',
    description: 'Past, present, future — when to use what.',
    thumbnail_url: 'https://picsum.photos/seed/english/360/640',
    category: 'Language',
    type: 'free',
    order_index: 4,
    duration_sec: 50,
    created_by: null,
    created_at: NOW,
    video_url: HLS_B,
  },
  {
    id: 'v5',
    title: 'Calculus Deep Dive (Guided)',
    description: 'Limits and derivatives — premium guided lesson with an end quiz.',
    thumbnail_url: 'https://picsum.photos/seed/calculus/360/640',
    category: 'Math',
    type: 'guided',
    order_index: 5,
    duration_sec: 180,
    created_by: null,
    created_at: NOW,
    video_url: HLS_A, // real URL so the premium demo user can play it
  },
];

export const demoVideoStats: Record<string, VideoStats> = {
  v1: { likeCount: 128, commentCount: 12, liked: false, saved: false },
  v2: { likeCount: 86, commentCount: 5, liked: false, saved: false },
  v3: { likeCount: 203, commentCount: 24, liked: true, saved: false },
  v4: { likeCount: 45, commentCount: 3, liked: false, saved: true },
  v5: { likeCount: 312, commentCount: 40, liked: false, saved: false },
};

export const demoQuiz = {
  id: 'q1',
  videoId: 'v5',
  question: 'What does the derivative of a function represent?',
  options: [
    'The area under the curve',
    'The instantaneous rate of change',
    'The maximum value',
    'The average value',
  ],
  correctIndex: 1,
};

export const demoComments: { name: string; text: string }[] = [
  { name: 'Aisha', text: 'This finally made it click for me 🙌' },
  { name: 'Rohan', text: 'Great pace, more like this please!' },
  { name: 'Meera', text: 'Wait, can you cover integrals next?' },
];

const lite = (v: FeedVideo): VideoLite => ({
  id: v.id,
  title: v.title,
  thumbnail_url: v.thumbnail_url,
  type: v.type,
  category: v.category,
});

export const demoStats: ProfileStats = {
  totalViewed: 23,
  totalWatchSec: 1320,
  quizTotal: 8,
  quizCorrect: 6,
  accuracy: 75,
  quizByCategory: [
    { category: 'Math', accuracy: 80, total: 5 },
    { category: 'Science', accuracy: 67, total: 3 },
  ],
  viewsByCategory: [
    { category: 'Math', count: 10 },
    { category: 'Science', count: 7 },
    { category: 'Physics', count: 4 },
    { category: 'Language', count: 2 },
  ],
  liked: [lite(demoVideos[2]), lite(demoVideos[0])],
  saved: [lite(demoVideos[3])],
  comments: [
    { id: 'c1', text: 'This helped a ton, thanks!', created_at: NOW, video: lite(demoVideos[4]) },
  ],
};

export const demoLiveClasses: LiveClassPublic[] = [
  {
    id: 'l1',
    title: 'Live: Trigonometry Q&A',
    description: 'Ask anything about sine, cosine, and tangent.',
    scheduled_at: NOW,
    room_id: 'demo-room',
    status: 'live',
    created_by: null,
    created_at: NOW,
  },
  {
    id: 'l2',
    title: 'Organic Chemistry: Reaction Mechanisms',
    description: 'A walkthrough of common mechanisms.',
    scheduled_at: '2026-06-15T10:00:00.000Z',
    room_id: null,
    status: 'scheduled',
    created_by: null,
    created_at: NOW,
  },
];
