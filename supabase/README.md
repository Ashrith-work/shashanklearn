# Supabase — ShashankLearn

Database schema, RLS, triggers, views, and Storage buckets live here as ordered
migrations. The frontend reads through the **views**, not the base tables.

## Files

| File | What it does |
| ---- | ------------ |
| `migrations/...01_schema.sql`             | Extensions, enums, 10 tables, indexes, constraints |
| `migrations/...02_functions_triggers.sql` | `is_admin()`, `is_premium()`, signup trigger, profile privilege guard, `submit_quiz_answer()` |
| `migrations/...03_rls.sql`                 | Enable RLS + all policies |
| `migrations/...04_views.sql`               | `feed_videos`, `quiz_questions`, `live_classes_public` |
| `migrations/...05_storage.sql`             | Buckets + `storage.objects` policies |
| `seed.sql`                                 | Dev sample videos + one guided video with a quiz |

## Apply locally

```bash
# One-time
npm i -g supabase            # or: npx supabase ...
supabase start               # boots local Postgres + Auth + Storage (Docker)
supabase db reset            # applies all migrations + seed.sql
```

Local Studio: http://localhost:54323 · API: http://localhost:54321

## Apply to a hosted project

```bash
supabase link --project-ref <your-project-ref>
supabase db push             # runs migrations against the linked project
# seed.sql is NOT auto-applied to remote; run it manually if you want sample data:
#   psql "$DATABASE_URL" -f supabase/seed.sql
```

## Regenerate TypeScript types after schema changes

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

## Security model (read before changing policies)

- **Guided video bytes** are gated by the *private* `guided-videos` Storage
  bucket: its `storage.objects` SELECT policy requires `is_premium()`. Even if a
  non-premium client learns the object path, it cannot fetch or sign a URL. The
  `feed_videos` view masking `video_url` is an extra layer, not the boundary.
- **Quiz answers** never reach the client. Base `quizzes` is admin-only SELECT;
  users read `quiz_questions` (no `correct_index`) and grade via the
  `submit_quiz_answer()` RPC.
- **Premium / admin cannot be self-granted**: the `protect_profile_columns`
  trigger blocks non-admins from changing `role` / `is_premium` /
  `premium_expires_at`. Only the service role (Razorpay webhook) or an admin can.
- **Own-row only** for `video_progress`, `quiz_attempts`, `scroll_events`, and
  your own `interactions`. Likes & comments are publicly readable; saves are
  private.
