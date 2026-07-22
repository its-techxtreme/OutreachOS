# Deployment notes

How I ship OutreachOS to production. Canonical URL: **https://outreachos.techxtreme.me**

## Stack in prod

- **App:** Next.js on Vercel
- **DB / Auth:** Supabase (Postgres + Auth)
- **DNS:** `outreachos.techxtreme.me` ? Vercel

## First-time setup

1. Create a Vercel project from this repo (or `npx vercel` then link).
2. Create a Supabase project.
3. Copy `.env.example` ? fill Production env in Vercel (and `.env.local` for yourself).
4. Run SQL migrations in order under `supabase/migrations/` (`001` ? `009`) in the Supabase SQL editor.
5. Point Supabase Auth **Site URL** + redirect URLs at the production domain (`/auth/callback`, `/auth/login`, `/auth/reset-password`, `/auth/username`).
6. Deploy: `npx vercel --prod` (or push to the branch Vercel watches).
7. Seed accounts once: `npm run ensure:accounts` and optionally `npm run seed:demo` against prod env if you want the public demo vault.

## Env vars that matter

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only ? never `NEXT_PUBLIC_` |
| `AGENT_SECRET` | Legacy agent route only (ChatGPT intake was scrapped; keep set if the route still exists) |
| `ENCRYPTION_KEY` | 64 hex chars; MFA secrets at rest |
| `ADMIN_EMAIL` / `ADMIN_GOOGLE_EMAIL` / `ADMIN_*` | Admin bootstrap + Google gate |
| `DEMO_USER_*` | Shared demo account |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | `https://outreachos.techxtreme.me` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console HTML tag |
| `PREMIUM_REQUEST_EMAIL` / `SUPPORT_EMAIL` | Mailto target for Premium requests |
| Razorpay `RAZORPAY_*` | Optional scaffolding; live checkout is off ? Premium is email + admin grant |

Full list lives in `.env.example`.

## After each deploy

- Hit `/` and `/auth/login`
- Sign in as admin (Google, allowlisted email) ? `/admin/management-dashboard`
- Quick import / filter / export smoke test
- If Auth URLs changed, update Supabase Dashboard

## Premium (current flow)

`/pricing` opens a mailto to `techxtremebuisness@gmail.com` with the user?s OutreachOS username filled in. After they pay (UPI / transfer), grant from the admin dashboard.

## Search Console

See [SEO_SEARCH_CONSOLE.md](./SEO_SEARCH_CONSOLE.md). Sitemap: `https://outreachos.techxtreme.me/sitemap.xml`

## Don?ts

- Don?t commit `.env.local` or real keys
- Don?t put the service role key in client bundles

- Don?t skip migrations out of order
