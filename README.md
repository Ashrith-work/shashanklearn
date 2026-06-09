# ShashankLearn

Short-form, swipeable learning app (TikTok / YouTube Shorts style) for edtech.
Vertical video feed, free + premium ("guided") content, quiz interstitials, live
classes for premium users, and a personal analytics dashboard.

> **Status:** Phase 1 — project scaffold. Each subsequent phase fills in a
> feature folder. See [Build order](#build-order).

## Stack

| Concern        | Choice                                                |
| -------------- | ----------------------------------------------------- |
| Frontend       | React 18 + Vite + TypeScript                          |
| Styling        | TailwindCSS v3                                         |
| State          | Zustand (feed / auth / player)                        |
| Backend/DB/Auth| Supabase (Postgres + Auth + Storage + Realtime)       |
| Video          | HLS via `hls.js`, vertical full-screen player         |
| Payments       | Razorpay (India) — gate premium + live classes        |
| Live classes   | Supabase Realtime chat + swappable `LiveRoom` (100ms/Daily) |
| Charts         | recharts                                              |
| Deploy         | Vercel (PWA-ready, mobile-first)                      |

## Getting started

```bash
npm install
cp .env.example .env   # then fill in real values (PowerShell: copy .env.example .env)
npm run dev            # http://localhost:5173
```

### Environment variables

Only `VITE_*` vars reach the browser. Server-only secrets (service role key,
Razorpay secret, webhook secret) live in **Supabase Edge Function** env, never in
this client `.env`.

| Var                       | Where to find it                         |
| ------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase → Project Settings → API        |
| `VITE_SUPABASE_ANON_KEY`  | Supabase → Project Settings → API        |
| `VITE_RAZORPAY_KEY_ID`    | Razorpay Dashboard → API Keys (key id)   |

## Scripts

| Command           | Does                                  |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start Vite dev server                 |
| `npm run build`   | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build          |
| `npm run lint`    | Type-check only (`tsc --noEmit`)      |

## Project structure

```
src/
  lib/         Supabase client + generated-style DB types
  types/       App-level shared model types (single source of truth)
  store/       Zustand stores (auth / feed / player)
  hooks/       Reusable hooks (useAuth, …)
  components/   Shared UI (Logo, Spinner, ProtectedRoute)
  features/    Feature folders — each owns its pages/components/hooks
    auth/  feed/  quiz/  live/  profile/  admin/
```

Routing lives in `src/App.tsx`. Protected routes redirect unauthenticated users
to `/login` via `components/ProtectedRoute`.

## Build order

1. ✅ **Scaffold** — Vite + TS + Tailwind + Supabase client + Zustand + routing.
2. ✅ **DB migrations + RLS + signup trigger** — see [`supabase/`](./supabase/README.md).
3. ✅ **Auth** — email/password + Google OAuth + magic-link, branded login/signup.
4. ✅ **Vertical feed** — snap-scroll, HLS autoplay-on-view, interactions, scroll logging.
5. ✅ **Premium gating + quiz popup** — locked guided videos, post-video quiz graded server-side.
6. ✅ **Razorpay premium upgrade** — edge functions (order/verify/webhook) + checkout modal.
7. ✅ **Live classes** — premium-gated Live tab, Realtime chat, swappable `LiveRoom` provider.
8. ✅ **Profile / analytics** — views, watch time, quiz accuracy, charts, liked/saved/comments.
9. ✅ **Admin panel** — video/quiz/live CRUD with Storage uploads + platform stats.

## Security notes

- `guided` video URLs are **never** shipped to non-premium users — access is
  gated server-side (RLS + signed URLs).
- `profiles.is_premium` is **only** set server-side after Razorpay webhook
  signature verification in an Edge Function. Never client-side.
- Users can read/write only their own rows for progress, interactions, quiz
  attempts, and scroll events (enforced by RLS).
