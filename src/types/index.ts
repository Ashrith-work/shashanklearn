/**
 * App-level shared types. Row aliases are derived from the generated
 * Database type so there is a single source of truth for the schema.
 */
import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type Video = Tables['videos']['Row'];
export type Quiz = Tables['quizzes']['Row'];
export type QuizAttempt = Tables['quiz_attempts']['Row'];
export type VideoProgress = Tables['video_progress']['Row'];
export type Interaction = Tables['interactions']['Row'];
export type ScrollEvent = Tables['scroll_events']['Row'];
export type LiveClass = Tables['live_classes']['Row'];
export type Payment = Tables['payments']['Row'];

type Views = Database['public']['Views'];

/** Feed row (guided video_url masked for non-premium) — the feed reads this. */
export type FeedVideo = Views['feed_videos']['Row'];
/** Quiz question without the answer — the quiz UI reads this. */
export type QuizQuestion = Views['quiz_questions']['Row'];
/** Live class with room_id masked for non-premium. */
export type LiveClassPublic = Views['live_classes_public']['Row'];

export type {
  Json,
  UserRole,
  VideoType,
  InteractionType,
  LiveStatus,
  PaymentStatus,
} from '@/lib/database.types';

/** Quiz options are stored as jsonb; narrow it for the UI. */
export type QuizOptions = string[];
