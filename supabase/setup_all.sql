-- ============================================================================
-- ShashankLearn - combined setup (generated from supabase/migrations + seed.sql)
-- HOW TO USE: open Supabase Dashboard -> SQL Editor -> New query, paste ALL of
-- this, and Run. Order is preserved. Run ONCE on a fresh project.
-- ============================================================================

-- ====================== 20260609090001_schema.sql ======================
-- ============================================================================
-- ShashankLearn â€” schema: extensions, enums, tables, indexes, constraints
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create type public.user_role        as enum ('user', 'admin');
create type public.video_type       as enum ('free', 'guided');
create type public.interaction_type as enum ('like', 'save', 'comment');
create type public.live_status      as enum ('scheduled', 'live', 'ended');
create type public.payment_status   as enum ('created', 'paid', 'failed');

-- â”€â”€ profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ videos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ quizzes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ quiz_attempts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table public.quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  quiz_id        uuid not null references public.quizzes (id) on delete cascade,
  video_id       uuid not null references public.videos (id) on delete cascade,
  selected_index integer not null,
  is_correct     boolean not null,
  attempted_at   timestamptz not null default now()
);

-- â”€â”€ video_progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ scroll_events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- One row each time a video becomes active in the feed (+ how long it was viewed).
create table public.scroll_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  video_id          uuid not null references public.videos (id) on delete cascade,
  viewed_at         timestamptz not null default now(),
  view_duration_sec numeric(8,2) not null default 0
);

-- â”€â”€ live_classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Indexes (feed ordering + analytics + FK lookups) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


-- ====================== 20260609090002_functions_triggers.sql ======================
-- ============================================================================
-- ShashankLearn â€” functions & triggers
--   * is_admin() / is_premium()         helper predicates for RLS + views
--   * handle_new_user()                  auto-create profile on signup
--   * protect_profile_privileged_columns guard against self-granted premium/admin
--   * submit_quiz_answer()               grade quizzes server-side (hides answer)
-- All SECURITY DEFINER functions pin search_path to avoid hijacking.
-- ============================================================================

-- â”€â”€ is_admin() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SECURITY DEFINER so it bypasses RLS on profiles (prevents recursive policy
-- evaluation when used inside profiles' own policies).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- â”€â”€ is_premium() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- True only if flagged premium AND not expired.
create or replace function public.is_premium()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_premium = true
      and (p.premium_expires_at is null or p.premium_expires_at > now())
  );
$$;

-- â”€â”€ handle_new_user() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Fires after a row is inserted into auth.users (email/password, OAuth, magic
-- link all go through auth.users). Creates the matching profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, avatar_url, role, is_premium)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'user',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- â”€â”€ protect_profile_privileged_columns() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Stops a normal user from escalating role or granting themselves premium via a
-- direct profile UPDATE. Admins and the server (service role -> auth.uid() null)
-- may change anything.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;  -- service role / admin: allowed
  end if;

  if new.role is distinct from old.role
     or new.is_premium is distinct from old.is_premium
     or new.premium_expires_at is distinct from old.premium_expires_at then
    raise exception 'Not allowed to modify privileged profile columns (role/is_premium/premium_expires_at)';
  end if;

  return new;
end;
$$;

create trigger protect_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

-- â”€â”€ submit_quiz_answer() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- The only path by which a quiz is graded. Keeps `correct_index` server-side:
-- the client sends its choice, we grade, persist the attempt, and return the
-- result (incl. the correct answer so the UI can highlight it AFTER answering).
create or replace function public.submit_quiz_answer(
  p_quiz_id uuid,
  p_selected_index integer
)
returns table (is_correct boolean, correct_index integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quiz       public.quizzes;
  v_is_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_quiz from public.quizzes q where q.id = p_quiz_id;
  if not found then
    raise exception 'Quiz not found';
  end if;

  -- Quizzes only attach to guided (premium) videos.
  if not (public.is_premium() or public.is_admin()) then
    raise exception 'Premium required';
  end if;

  v_is_correct := (p_selected_index = v_quiz.correct_index);

  insert into public.quiz_attempts (user_id, quiz_id, video_id, selected_index, is_correct)
  values (auth.uid(), p_quiz_id, v_quiz.video_id, p_selected_index, v_is_correct);

  return query select v_is_correct, v_quiz.correct_index;
end;
$$;

-- Lock down EXECUTE: authenticated users only (not anon).
revoke all on function public.submit_quiz_answer(uuid, integer) from public, anon;
grant execute on function public.submit_quiz_answer(uuid, integer) to authenticated;
grant execute on function public.is_admin()   to authenticated;
grant execute on function public.is_premium() to authenticated;


-- ====================== 20260609090003_rls.sql ======================
-- ============================================================================
-- ShashankLearn â€” Row Level Security
--   Default deny: RLS enabled on every table; access granted explicitly below.
--   Rule of thumb: users touch only their own rows for progress / interactions
--   / attempts / scroll; videos & live metadata are world-readable (to logged-in
--   users); admins CRUD content; payments/profiles privileged columns are
--   server-managed.
-- ============================================================================

alter table public.profiles       enable row level security;
alter table public.videos         enable row level security;
alter table public.quizzes        enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.video_progress enable row level security;
alter table public.interactions   enable row level security;
alter table public.scroll_events  enable row level security;
alter table public.live_classes   enable row level security;
alter table public.payments       enable row level security;

-- â”€â”€ profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Readable by any authenticated user (names/avatars shown on comments, creators).
create policy "profiles: read all (authenticated)"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may update only their own row. Privileged columns are additionally
-- guarded by the protect_profile_columns trigger.
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
-- No INSERT policy: rows are created by the SECURITY DEFINER signup trigger.
-- No DELETE policy: profiles cascade-delete with the auth user.

-- â”€â”€ videos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "videos: read all (authenticated)"
  on public.videos for select
  to authenticated
  using (true);

create policy "videos: admin insert"
  on public.videos for insert
  to authenticated
  with check (public.is_admin());

create policy "videos: admin update"
  on public.videos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "videos: admin delete"
  on public.videos for delete
  to authenticated
  using (public.is_admin());

-- â”€â”€ quizzes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Base table is admin-only (keeps correct_index secret). Users read questions
-- through the quiz_questions view and grade via submit_quiz_answer().
create policy "quizzes: admin select"
  on public.quizzes for select
  to authenticated
  using (public.is_admin());

create policy "quizzes: admin insert"
  on public.quizzes for insert
  to authenticated
  with check (public.is_admin());

create policy "quizzes: admin update"
  on public.quizzes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "quizzes: admin delete"
  on public.quizzes for delete
  to authenticated
  using (public.is_admin());

-- â”€â”€ quiz_attempts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "quiz_attempts: select own"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_attempts: insert own"
  on public.quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- â”€â”€ video_progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "video_progress: select own"
  on public.video_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "video_progress: insert own"
  on public.video_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "video_progress: update own"
  on public.video_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- â”€â”€ interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Likes & comments are public (counts + comment threads). Saves are private.
create policy "interactions: read public + own"
  on public.interactions for select
  to authenticated
  using (type in ('like', 'comment') or auth.uid() = user_id);

create policy "interactions: insert own"
  on public.interactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "interactions: update own"
  on public.interactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "interactions: delete own"
  on public.interactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- â”€â”€ scroll_events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "scroll_events: select own"
  on public.scroll_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "scroll_events: insert own"
  on public.scroll_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- â”€â”€ live_classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Metadata readable by all authenticated users (free users see them locked);
-- room_id is masked for non-premium by the live_classes_public view.
create policy "live_classes: read all (authenticated)"
  on public.live_classes for select
  to authenticated
  using (true);

create policy "live_classes: admin insert"
  on public.live_classes for insert
  to authenticated
  with check (public.is_admin());

create policy "live_classes: admin update"
  on public.live_classes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "live_classes: admin delete"
  on public.live_classes for delete
  to authenticated
  using (public.is_admin());

-- â”€â”€ payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Users may read their own payment history. Inserts/updates happen only via the
-- service role (Razorpay webhook Edge Function), which bypasses RLS â€” so there
-- is intentionally no INSERT/UPDATE policy here.
create policy "payments: select own"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);


-- ====================== 20260609090004_views.sql ======================
-- ============================================================================
-- ShashankLearn â€” read views (the client reads these, not the base tables)
--   feed_videos        : masks guided video_url for non-premium (defense in depth)
--   quiz_questions     : exposes question + options WITHOUT correct_index
--   live_classes_public: masks room_id (join token) for non-premium
-- ============================================================================

-- â”€â”€ feed_videos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- security_invoker = true -> respects the caller's RLS on public.videos (read
-- all). The CASE hides the guided URL unless the caller is premium/admin.
-- NOTE: the real protection for guided bytes is the private Storage bucket RLS;
-- this view is an extra layer so the path never even reaches a non-premium UI.
create view public.feed_videos
with (security_invoker = true) as
select
  v.id,
  v.title,
  v.description,
  v.thumbnail_url,
  v.category,
  v.type,
  v.order_index,
  v.duration_sec,
  v.created_by,
  v.created_at,
  case
    when v.type = 'free' or public.is_premium() or public.is_admin()
      then v.video_url
    else null
  end as video_url
from public.videos v;

-- â”€â”€ quiz_questions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- security_invoker = false (default): runs as the view owner and bypasses the
-- admin-only RLS on public.quizzes, exposing ONLY the non-sensitive columns.
create view public.quiz_questions as
select
  q.id,
  q.video_id,
  q.question,
  q.options
from public.quizzes q;

-- â”€â”€ live_classes_public â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create view public.live_classes_public
with (security_invoker = true) as
select
  lc.id,
  lc.title,
  lc.description,
  lc.scheduled_at,
  case
    when public.is_premium() or public.is_admin() then lc.room_id
    else null
  end as room_id,
  lc.status,
  lc.created_by,
  lc.created_at
from public.live_classes lc;

-- â”€â”€ Grants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
grant select on public.feed_videos         to authenticated;
grant select on public.quiz_questions       to authenticated;
grant select on public.live_classes_public  to authenticated;


-- ====================== 20260609090005_storage.sql ======================
-- ============================================================================
-- ShashankLearn â€” Storage buckets & object-level RLS
--   avatars       (public)  : users manage their own (path = <uid>/...)
--   thumbnails    (public)  : admin-writable, world-readable
--   free-videos   (public)  : admin-writable, world-readable
--   guided-videos (private) : admin-writable; readable/signable ONLY by premium
--                             -> THIS is the real premium gate for guided bytes.
-- Object paths are conventionally "<owner-or-folder>/<filename>".
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',       'avatars',       true),
  ('thumbnails',    'thumbnails',    true),
  ('free-videos',   'free-videos',   true),
  ('guided-videos', 'guided-videos', false)
on conflict (id) do nothing;

-- â”€â”€ avatars: users manage their own folder (<uid>/...) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "avatars: read (authenticated)"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "avatars: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- â”€â”€ thumbnails & free-videos: world-readable, admin-writable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create policy "public media: read (authenticated)"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('thumbnails', 'free-videos'));

create policy "public media: admin write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('thumbnails', 'free-videos') and public.is_admin());

create policy "public media: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('thumbnails', 'free-videos') and public.is_admin());

create policy "public media: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('thumbnails', 'free-videos') and public.is_admin());

-- â”€â”€ guided-videos (private): premium-gated read, admin-only write â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Creating a signed URL requires passing this SELECT policy, so non-premium
-- users cannot fetch or sign guided media even if they know the path.
create policy "guided videos: premium read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'guided-videos'
    and (public.is_premium() or public.is_admin())
  );

create policy "guided videos: admin write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'guided-videos' and public.is_admin());

create policy "guided videos: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'guided-videos' and public.is_admin());

create policy "guided videos: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'guided-videos' and public.is_admin());


-- ====================== seed.sql (optional dev sample data) ======================
-- ============================================================================
-- ShashankLearn â€” seed data (dev only). Applied by `supabase db reset`.
-- A few FREE videos (public HLS test streams) so the feed has content before
-- any uploads exist, plus one GUIDED video whose video_url is a private Storage
-- path (illustrates the premium-gated approach â€” bytes won't load without the
-- object actually existing in the guided-videos bucket).
-- created_by is left NULL (no admin user exists at seed time).
-- ============================================================================

insert into public.videos
  (title, description, video_url, thumbnail_url, category, type, order_index, duration_sec)
values
  ('Intro to Algebra',
   'Variables and expressions in 60 seconds.',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
   'https://picsum.photos/seed/algebra/360/640',
   'Math', 'free', 1, 60),

  ('The Water Cycle',
   'Evaporation, condensation, precipitation â€” fast.',
   'https://test-streams.mux.dev/pts_shift/master.m3u8',
   'https://picsum.photos/seed/water/360/640',
   'Science', 'free', 2, 45),

  ('Newton''s Three Laws',
   'Motion explained with everyday examples.',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
   'https://picsum.photos/seed/newton/360/640',
   'Physics', 'free', 3, 75),

  ('English Tenses Cheat Sheet',
   'Past, present, future â€” when to use what.',
   'https://test-streams.mux.dev/pts_shift/master.m3u8',
   'https://picsum.photos/seed/english/360/640',
   'Language', 'free', 4, 50),

  ('Calculus Deep Dive (Guided)',
   'Limits and derivatives â€” premium guided lesson with an end quiz.',
   'samples/calculus-intro.m3u8',  -- object KEY within the private guided-videos bucket (signed at play time)
   'https://picsum.photos/seed/calculus/360/640',
   'Math', 'guided', 5, 180);

-- Attach a quiz to the guided video (popup after it ends).
insert into public.quizzes (video_id, question, options, correct_index)
select
  v.id,
  'What does the derivative of a function represent?',
  '["The area under the curve", "The instantaneous rate of change", "The maximum value", "The average value"]'::jsonb,
  1
from public.videos v
where v.title = 'Calculus Deep Dive (Guided)';

