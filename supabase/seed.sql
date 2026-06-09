-- ============================================================================
-- ShashankLearn — seed data (dev only). Applied by `supabase db reset`.
-- A few FREE videos (public HLS test streams) so the feed has content before
-- any uploads exist, plus one GUIDED video whose video_url is a private Storage
-- path (illustrates the premium-gated approach — bytes won't load without the
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
   'Evaporation, condensation, precipitation — fast.',
   'https://test-streams.mux.dev/pts_shift/master.m3u8',
   'https://picsum.photos/seed/water/360/640',
   'Science', 'free', 2, 45),

  ('Newton''s Three Laws',
   'Motion explained with everyday examples.',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
   'https://picsum.photos/seed/newton/360/640',
   'Physics', 'free', 3, 75),

  ('English Tenses Cheat Sheet',
   'Past, present, future — when to use what.',
   'https://test-streams.mux.dev/pts_shift/master.m3u8',
   'https://picsum.photos/seed/english/360/640',
   'Language', 'free', 4, 50),

  ('Calculus Deep Dive (Guided)',
   'Limits and derivatives — premium guided lesson with an end quiz.',
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
