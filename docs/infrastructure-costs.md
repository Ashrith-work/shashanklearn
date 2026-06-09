# Scroll & Learn — Domain Structure & Cost Reference

*Last verified: June 2026. USD→INR taken at ~₹85/$1 — actual INR charged varies slightly with exchange rate + GST.*

---

## 1. The one domain you actually buy

You buy **ONE** root domain. Every subdomain under it (`api.`, `admin.`, `videos.`, etc.) is **free** — you just add a DNS record. You do not pay per subdomain.

**Chosen:** `getscrollandlearn.com`

> **Availability check (June 2026):** the preferred `scrollandlearn.com` is **already registered (unavailable)**, as is `scrollandlearn.app`. Among the available options, **`getscrollandlearn.com`** was selected — it's the cheapest (~$11.25/yr) and keeps the trusted `.com` TLD. Alternatives that were available: `scrollandlearn.co` (~$17.99/yr) and `scrollandlearn.io` (~$37.99/yr). Prices quoted are Vercel registrar; Cloudflare may be slightly cheaper on renewal.

`.in` is optional. If you want it for the India audience, buy it and just **redirect it to the main domain** so you maintain one brand and one set of content. Don't run two separate sites.

| Domain | Purpose | Cost/year |
|---|---|---|
| `getscrollandlearn.com` | Main domain (required) | ~$11.25 (~₹960) |
| `scrollandlearn.in` | Optional, redirects to main | ₹500–₹900 |

**Buy from:** Cloudflare Registrar (sells at cost, no markup, cheapest long-term) or Namecheap (cheap first year, higher renewal). Cloudflare is the better choice since you'll likely use Cloudflare R2 for video anyway.

---

## 2. Full domain map (all subdomains free)

| Address | What it does | Hosted on | Cost |
|---|---|---|---|
| `getscrollandlearn.com` | Main website / landing page | Vercel | Free |
| `www.getscrollandlearn.com` | Same site (redirect to apex) | Vercel | Free |
| `api.getscrollandlearn.com` | Backend API — videos, users, courses | Supabase / Vercel | Free initially |
| `auth.getscrollandlearn.com` | Login & signup | Supabase Auth | Free initially |
| `admin.getscrollandlearn.com` | Your team's dashboard (uploads, users, subs) | Vercel | Free |
| `videos.getscrollandlearn.com` | Video storage & delivery | Cloudflare R2 | See §4 |
| `docs.getscrollandlearn.com` | PDF storage | Cloudflare R2 / Supabase | Free initially |
| `support.getscrollandlearn.com` | Customer support | Your choice | Free initially |
| `getscrollandlearn.com/privacy` | Privacy Policy | Vercel (page, not subdomain) | Free |
| `getscrollandlearn.com/terms` | Terms & Conditions | Vercel (page, not subdomain) | Free |

**Note on Privacy & Terms:** use **paths** (`/privacy`, `/terms`), not subdomains. This is exactly what Play Store and App Store reviewers expect, and it's simpler. Both are **mandatory** before you can publish a paid/subscription app on either store.

---

## 3. The actual store costs (the part you asked about)

This is where most cost confusion lives, so being precise:

| Store | Fee type | Cost | Per-deploy / per-update cost |
|---|---|---|---|
| **Google Play** | **One-time** registration | **$25 (~₹2,100)** — pay once, never again | **₹0** |
| **Apple App Store** | **Annual** (auto-renews) | **$99/year (~₹8,400/year)** | **₹0** |

**Key facts (verified June 2026):**
- Google Play charges **$25 once at registration**, regardless of how many apps you publish or how often you update.
- Apple charges **$99 every year**. If you stop paying, your app is pulled from the store. Free apps still need the paid account.
- **Neither store charges per build, per submission, or per update.** Once you're in, deploying and re-deploying is free.
- App **rejections** cost you time, not money — Apple in particular rejects a large share of first submissions, so budget 1–2 revision cycles on your first launch.

**Store commissions (only once you earn money):**
- Both stores take **15%** of in-app revenue while you earn under **$1M/year** (you must enrol in Apple's Small Business Program / Google's equivalent — enrolment is per-year and not automatic; apply when you set up).
- Above $1M/year it rises to **30%**.
- **Important for you:** if you sell your high-ticket cohort programs / Sales Sprint **outside the app** (web checkout via Razorpay/Stripe), no store commission applies. Apple only takes a cut of digital goods sold *through the app*. This is worth designing around deliberately.

---

## 4. Storage & hosting running costs

| Service | Free tier | When you pay | Paid cost |
|---|---|---|---|
| **Vercel** (web + admin) | Hobby plan free | Commercial use technically needs Pro | ~$20/mo (~₹1,700) |
| **Supabase** (DB, auth, API) | Free: 500MB DB, 1GB storage, 50K MAU | When you outgrow free tier | Pro ~$25/mo (~₹2,100) |
| **Cloudflare R2** (video + PDF) | First 10GB storage free | Beyond 10GB | ~$0.015/GB-month |

**Why R2 for video specifically:** Cloudflare R2 has **zero egress fees** (no charge for bandwidth when videos are watched). For a video-heavy scroll app this is the single most important cost decision — S3 and most competitors charge for egress, which is what kills budgets at scale. Early on you'll likely stay near-free; at real volume R2 stays cheap precisely because watching costs you nothing.

---

## 5. Total cost to launch

| Item | Cost | Frequency |
|---|---|---|
| `getscrollandlearn.com` domain | ~$11.25 (~₹960) | per year |
| Google Play developer account | ₹2,100 | **one-time** |
| Apple Developer Program | ₹8,400 | **per year** (only if launching iOS) |
| Vercel hosting | Free | — |
| Supabase backend | Free | — |
| Cloudflare R2 storage | Free / near-zero | — |

**Cheapest viable launch (Android-only, India-first):**
> Domain (₹~1,000) + Google Play (₹2,100 one-time) = **~₹3,100 to be live on Android**, with all infrastructure on free tiers.

**Add iOS:** + ₹8,400/year for the Apple account.

---

## 6. One-line summary

- **Buy:** 1 domain (`getscrollandlearn.com`).
- **Pay once:** Google Play, ₹2,100.
- **Pay yearly:** Apple, ₹8,400 (skip until you decide to launch iOS).
- **Per deploy:** ₹0 on both stores, forever.
- **Infra:** free on Vercel + Supabase + R2 until you have real traffic.
