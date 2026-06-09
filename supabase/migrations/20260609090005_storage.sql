-- ============================================================================
-- ShashankLearn — Storage buckets & object-level RLS
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

-- ── avatars: users manage their own folder (<uid>/...) ───────────────────────
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

-- ── thumbnails & free-videos: world-readable, admin-writable ─────────────────
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

-- ── guided-videos (private): premium-gated read, admin-only write ────────────
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
