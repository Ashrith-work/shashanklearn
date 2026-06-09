-- ============================================================================
-- ShashankLearn — read views (the client reads these, not the base tables)
--   feed_videos        : masks guided video_url for non-premium (defense in depth)
--   quiz_questions     : exposes question + options WITHOUT correct_index
--   live_classes_public: masks room_id (join token) for non-premium
-- ============================================================================

-- ── feed_videos ──────────────────────────────────────────────────────────────
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

-- ── quiz_questions ───────────────────────────────────────────────────────────
-- security_invoker = false (default): runs as the view owner and bypasses the
-- admin-only RLS on public.quizzes, exposing ONLY the non-sensitive columns.
create view public.quiz_questions as
select
  q.id,
  q.video_id,
  q.question,
  q.options
from public.quizzes q;

-- ── live_classes_public ──────────────────────────────────────────────────────
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

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select on public.feed_videos         to authenticated;
grant select on public.quiz_questions       to authenticated;
grant select on public.live_classes_public  to authenticated;
