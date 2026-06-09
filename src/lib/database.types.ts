/**
 * Database types for ShashankLearn.
 *
 * Hand-written to mirror the Supabase schema in /supabase/migrations.
 * Row / Insert / Update are declared as standalone types (no self-referential
 * indexed access into `Database`) so supabase-js can infer table types — a
 * recursive `Database['public']['Tables'][X]` reference inside this file makes
 * the client resolve those tables to `never`.
 *
 * Regenerate once the project is linked:
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 */

export type UserRole = 'user' | 'admin';
export type VideoType = 'free' | 'guided';
export type InteractionType = 'like' | 'save' | 'comment';
export type LiveStatus = 'scheduled' | 'live' | 'ended';
export type PaymentStatus = 'created' | 'paid' | 'failed';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// NOTE: these MUST be `type` aliases, not `interface`. supabase-js constrains
// each table to `Record<string, unknown>`, and TS interfaces are not assignable
// to that (no implicit index signature) — using `interface` makes the whole
// schema fail the GenericSchema constraint and every table resolves to `never`.

// ── profiles ─────────────────────────────────────────────────────────────────
type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  role: UserRole;
  created_at: string;
};
type ProfileInsert = {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
  is_premium?: boolean;
  premium_expires_at?: string | null;
  role?: UserRole;
  created_at?: string;
};

// ── videos ───────────────────────────────────────────────────────────────────
type VideoRow = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  category: string | null;
  type: VideoType;
  order_index: number;
  duration_sec: number | null;
  created_by: string | null;
  created_at: string;
};
type VideoInsert = {
  id?: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  category?: string | null;
  type?: VideoType;
  order_index?: number;
  duration_sec?: number | null;
  created_by?: string | null;
  created_at?: string;
};

// ── quizzes ──────────────────────────────────────────────────────────────────
type QuizRow = {
  id: string;
  video_id: string;
  question: string;
  options: Json;
  correct_index: number;
  created_at: string;
};
type QuizInsert = {
  id?: string;
  video_id: string;
  question: string;
  options: Json;
  correct_index: number;
  created_at?: string;
};

// ── quiz_attempts ────────────────────────────────────────────────────────────
type QuizAttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  video_id: string;
  selected_index: number;
  is_correct: boolean;
  attempted_at: string;
};
type QuizAttemptInsert = {
  id?: string;
  user_id: string;
  quiz_id: string;
  video_id: string;
  selected_index: number;
  is_correct: boolean;
  attempted_at?: string;
};

// ── video_progress ───────────────────────────────────────────────────────────
type VideoProgressRow = {
  id: string;
  user_id: string;
  video_id: string;
  watched_pct: number;
  completed: boolean;
  last_watched_at: string;
};
type VideoProgressInsert = {
  id?: string;
  user_id: string;
  video_id: string;
  watched_pct?: number;
  completed?: boolean;
  last_watched_at?: string;
};

// ── interactions ─────────────────────────────────────────────────────────────
type InteractionRow = {
  id: string;
  user_id: string;
  video_id: string;
  type: InteractionType;
  comment_text: string | null;
  created_at: string;
};
type InteractionInsert = {
  id?: string;
  user_id: string;
  video_id: string;
  type: InteractionType;
  comment_text?: string | null;
  created_at?: string;
};

// ── scroll_events ────────────────────────────────────────────────────────────
type ScrollEventRow = {
  id: string;
  user_id: string;
  video_id: string;
  viewed_at: string;
  view_duration_sec: number;
};
type ScrollEventInsert = {
  id?: string;
  user_id: string;
  video_id: string;
  viewed_at?: string;
  view_duration_sec?: number;
};

// ── live_classes ─────────────────────────────────────────────────────────────
type LiveClassRow = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  room_id: string | null;
  status: LiveStatus;
  created_by: string | null;
  created_at: string;
};
type LiveClassInsert = {
  id?: string;
  title: string;
  description?: string | null;
  scheduled_at: string;
  room_id?: string | null;
  status?: LiveStatus;
  created_by?: string | null;
  created_at?: string;
};

// ── payments ─────────────────────────────────────────────────────────────────
type PaymentRow = {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  status: PaymentStatus;
  created_at: string;
};
type PaymentInsert = {
  id?: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  amount: number;
  status?: PaymentStatus;
  created_at?: string;
};

/** Helper: build the {Row, Insert, Update} table shape supabase-js expects.
 *  `Relationships` is required by supabase-js's GenericTable constraint —
 *  omitting it makes the client infer `never` for the table. */
type TableDef<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, ProfileInsert>;
      videos: TableDef<VideoRow, VideoInsert>;
      quizzes: TableDef<QuizRow, QuizInsert>;
      quiz_attempts: TableDef<QuizAttemptRow, QuizAttemptInsert>;
      video_progress: TableDef<VideoProgressRow, VideoProgressInsert>;
      interactions: TableDef<InteractionRow, InteractionInsert>;
      scroll_events: TableDef<ScrollEventRow, ScrollEventInsert>;
      live_classes: TableDef<LiveClassRow, LiveClassInsert>;
      payments: TableDef<PaymentRow, PaymentInsert>;
    };
    Views: {
      /** Feed source — masks guided `video_url` for non-premium callers. */
      feed_videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          category: string | null;
          type: VideoType;
          order_index: number;
          duration_sec: number | null;
          created_by: string | null;
          created_at: string;
          video_url: string | null;
        };
        Relationships: [];
      };
      /** Quiz questions WITHOUT the answer (`correct_index` is server-only). */
      quiz_questions: {
        Row: {
          id: string;
          video_id: string;
          question: string;
          options: Json;
        };
        Relationships: [];
      };
      /** Live classes — masks `room_id` (join token) for non-premium callers. */
      live_classes_public: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          room_id: string | null;
          status: LiveStatus;
          created_by: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_premium: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      /** Grades a quiz server-side and records the attempt. */
      submit_quiz_answer: {
        Args: { p_quiz_id: string; p_selected_index: number };
        Returns: { is_correct: boolean; correct_index: number }[];
      };
    };
    Enums: {
      user_role: UserRole;
      video_type: VideoType;
      interaction_type: InteractionType;
      live_status: LiveStatus;
      payment_status: PaymentStatus;
    };
  };
}
