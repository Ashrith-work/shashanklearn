-- ============================================================================
-- ShashankLearn — functions & triggers
--   * is_admin() / is_premium()         helper predicates for RLS + views
--   * handle_new_user()                  auto-create profile on signup
--   * protect_profile_privileged_columns guard against self-granted premium/admin
--   * submit_quiz_answer()               grade quizzes server-side (hides answer)
-- All SECURITY DEFINER functions pin search_path to avoid hijacking.
-- ============================================================================

-- ── is_admin() ───────────────────────────────────────────────────────────────
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

-- ── is_premium() ─────────────────────────────────────────────────────────────
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

-- ── handle_new_user() ────────────────────────────────────────────────────────
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

-- ── protect_profile_privileged_columns() ─────────────────────────────────────
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

-- ── submit_quiz_answer() ─────────────────────────────────────────────────────
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
