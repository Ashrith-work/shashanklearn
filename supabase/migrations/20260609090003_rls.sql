-- ============================================================================
-- ShashankLearn — Row Level Security
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

-- ── profiles ────────────────────────────────────────────────────────────────
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

-- ── videos ──────────────────────────────────────────────────────────────────
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

-- ── quizzes ─────────────────────────────────────────────────────────────────
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

-- ── quiz_attempts ────────────────────────────────────────────────────────────
create policy "quiz_attempts: select own"
  on public.quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_attempts: insert own"
  on public.quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── video_progress ───────────────────────────────────────────────────────────
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

-- ── interactions ─────────────────────────────────────────────────────────────
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

-- ── scroll_events ────────────────────────────────────────────────────────────
create policy "scroll_events: select own"
  on public.scroll_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "scroll_events: insert own"
  on public.scroll_events for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── live_classes ─────────────────────────────────────────────────────────────
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

-- ── payments ─────────────────────────────────────────────────────────────────
-- Users may read their own payment history. Inserts/updates happen only via the
-- service role (Razorpay webhook Edge Function), which bypasses RLS — so there
-- is intentionally no INSERT/UPDATE policy here.
create policy "payments: select own"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);
