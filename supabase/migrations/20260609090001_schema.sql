-- ============================================================================
-- ShashankLearn — schema: extensions, enums, tables, indexes, constraints
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ── Enums ───────────────────────────────────────────────────────────────────
create type public.user_role        as enum ('user', 'admin');
create type public.video_type       as enum ('free', 'guided');
create type public.interaction_type as enum ('like', 'save', 'comment');
create type public.live_status      as enum ('scheduled', 'live', 'ended');
create type public.payment_status   as enum ('created', 'paid', 'failed');

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically by the signup trigger.
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  name               text,
  avatar_url         text,
  is_premium         boolean not null default false,
  premium_expires_at timestamptz,
  role               public.user_role not null default 'user',
  created_at         timestamptz not null default now()
);

-- ── videos ──────────────────────────────────────────────────────────────────
-- `video_url`: for free videos -> a public URL. For guided videos -> a private
-- Storage object path (NOT a usable URL); bytes are gated by Storage RLS and a
-- signed-URL Edge Function. Never store a long-lived signed URL here.
create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  video_url     text,
  thumbnail_url text,
  category      text,
  type          public.video_type not null default 'free',
  order_index   integer not null default 0,
  duration_sec  integer,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ── quizzes ─────────────────────────────────────────────────────────────────
-- Attach ONLY to guided videos. `correct_index` is sensitive: base-table SELECT
-- is admin-only; users read questions via the `quiz_questions` view.
create table public.quizzes (
  id            uuid primary key default gen_random_uuid(),
  video_id      uuid not null references public.videos (id) on delete cascade,
  question      text not null,
  options       jsonb not null,
  correct_index integer not null,
  created_at    timestamptz not null default now(),
  constraint quizzes_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint quizzes_correct_index_nonneg check (correct_index >= 0)
);

-- ── quiz_attempts ───────────────────────────────────────────────────────────
create table public.quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  quiz_id        uuid not null references public.quizzes (id) on delete cascade,
  video_id       uuid not null references public.videos (id) on delete cascade,
  selected_index integer not null,
  is_correct     boolean not null,
  attempted_at   timestamptz not null default now()
);

-- ── video_progress ──────────────────────────────────────────────────────────
-- One row per (user, video); upsert as the user watches.
create table public.video_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  video_id        uuid not null references public.videos (id) on delete cascade,
  watched_pct     numeric(5,2) not null default 0,
  completed       boolean not null default false,
  last_watched_at timestamptz not null default now(),
  unique (user_id, video_id)
);

-- ── interactions ────────────────────────────────────────────────────────────
-- like / save / comment. One like and one save per (user, video); comments are
-- unlimited. Likes/comments are public; saves are private (see RLS).
create table public.interactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  video_id     uuid not null references public.videos (id) on delete cascade,
  type         public.interaction_type not null,
  comment_text text,
  created_at   timestamptz not null default now(),
  constraint interactions_comment_text_chk check (
    (type = 'comment' and comment_text is not null and length(btrim(comment_text)) > 0)
    or (type in ('like', 'save') and comment_text is null)
  )
);

-- Enforce single like/save per user/video; comments excluded via partial index.
create unique index interactions_unique_like_save
  on public.interactions (user_id, video_id, type)
  where type in ('like', 'save');

-- ── scroll_events ───────────────────────────────────────────────────────────
-- One row each time a video becomes active in the feed (+ how long it was viewed).
create table public.scroll_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  video_id          uuid not null references public.videos (id) on delete cascade,
  viewed_at         timestamptz not null default now(),
  view_duration_sec numeric(8,2) not null default 0
);

-- ── live_classes ────────────────────────────────────────────────────────────
-- Premium-only join. `room_id` (provider join token) is masked for non-premium
-- via the `live_classes_public` view.
create table public.live_classes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  scheduled_at timestamptz not null,
  room_id      text,
  status       public.live_status not null default 'scheduled',
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ── payments ────────────────────────────────────────────────────────────────
-- Written only by the server (service role) from the Razorpay webhook.
-- `amount` is in the smallest currency unit (paise).
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  razorpay_order_id  text not null,
  razorpay_payment_id text,
  amount             integer not null,
  status             public.payment_status not null default 'created',
  created_at         timestamptz not null default now(),
  unique (razorpay_order_id)
);

-- ── Indexes (feed ordering + analytics + FK lookups) ─────────────────────────
create index videos_type_order_idx       on public.videos (type, order_index);
create index videos_order_idx            on public.videos (order_index);
create index quizzes_video_idx           on public.quizzes (video_id);
create index quiz_attempts_user_idx      on public.quiz_attempts (user_id);
create index quiz_attempts_video_idx     on public.quiz_attempts (video_id);
create index video_progress_user_idx     on public.video_progress (user_id);
create index interactions_video_type_idx on public.interactions (video_id, type);
create index interactions_user_idx       on public.interactions (user_id);
create index scroll_events_user_idx      on public.scroll_events (user_id);
create index scroll_events_video_idx     on public.scroll_events (video_id);
create index scroll_events_viewed_idx    on public.scroll_events (viewed_at);
create index live_classes_status_idx     on public.live_classes (status, scheduled_at);
create index payments_user_idx           on public.payments (user_id);
