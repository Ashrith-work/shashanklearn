-- Promote a user to admin AFTER they have signed up in the app.
-- (The signup trigger creates every profile with role = 'user'.)
-- Run this in the Supabase SQL Editor. Change the email if needed.

update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'ashrith@socialhippi.com'
);

-- Verify:
select p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'ashrith@socialhippi.com';
