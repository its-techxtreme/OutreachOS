# OutreachOS

Personal lead vault for cold outreach.

Dump contacts in from Excel, filter by niche / country / status, keep call scripts next to the list, and stop losing track of who you already rang. Each account gets its own vault.

**Live:** [https://outreachos.techxtreme.me](https://outreachos.techxtreme.me)  
**Also:** [outreachos-online.vercel.app](https://outreachos-online.vercel.app)  
**Repo:** [github.com/its-techxtreme/OutreachOS](https://github.com/its-techxtreme/OutreachOS)  
**Stardance:** [project page](https://stardance.hackclub.com/projects/33617)

<p align="center">
  <img src="docs/readme/01-landing.png" alt="OutreachOS landing page" width="820" />
</p>

---

## Try it without cloning

1. Open [outreachos.techxtreme.me](https://outreachos.techxtreme.me)
2. Hit **Peek the demo** / **Sign in as Demo** — one click, no password typing

Demo is a shared sample vault (100 leads). Imports are capped so people don’t trash it. For your own empty vault, use **Start free** or Google sign-in.

<p align="center">
  <img src="docs/readme/08-login.png" alt="Login with demo button" width="480" />
</p>

---

## What it looks like

Sketchbook UI on purpose — paper texture, doodle borders, sticky notes. Not another purple SaaS dashboard.

### Demo tutorial

First time you open the demo, Rio walks you through the vault (filters, metrics, scripts, etc). You can skip whenever.

<p align="center">
  <img src="docs/readme/02-demo-tutorial-start.png" alt="Demo tutorial intro with Rio" width="720" />
</p>

<p align="center">
  <img src="docs/readme/03-demo-tutorial-step.png" alt="Tutorial highlighting metrics" width="720" />
</p>

### Dashboard + quests

Metrics up top, weekly quest board if you opt in, filters, then the lead list.

<p align="center">
  <img src="docs/readme/04-dashboard.png" alt="Dashboard with metrics and quest board" width="720" />
</p>

<p align="center">
  <img src="docs/readme/07-lead-table.png" alt="Lead table with filters and statuses" width="720" />
</p>

### Vector vault

Niche / country graph when you want the big picture instead of rows.

<p align="center">
  <img src="docs/readme/05-vector.png" alt="Vector vault graph view" width="820" />
</p>

### Sticky call scripts

Call pitch pad that stays open while you dial. Placeholders like `{business}` / `{niche}` / `{location}` / `{phone}` — you say them live. Edit and save your own.

<p align="center">
  <img src="docs/readme/06-scripts.png" alt="Sticky call scripts panel" width="820" />
</p>

---

## What’s in the app

- Excel import + format guide (`/import-guide`) + template under `public/templates/`
- Filters, search, CSV export
- Call statuses: New, Called, No Answer, Callback, Replied, Converted, Archived
- Sticky scripts (general + niche)
- Optional Quest Board (3 random weekly quests)
- Vector vault graph
- Email / password signup, Google sign-in, one-click demo
- Per-user lead pools (your stuff stays yours)
- Free vs **Premium** (`/pricing`) — ₹1499 or $15 / month; request via email to `techxtremebuisness@gmail.com` (username included automatically)
- Organic SEO: `/sitemap.xml`, `/robots.txt`, `/llms.txt`

Agent intake is still there for ChatGPT → `POST /api/agent/leads` with `X-Agent-Secret`.

---

## Stack

Next.js · Supabase (Auth + Postgres) · Tailwind · Vercel · Razorpay (Premium)

```text
Excel / ChatGPT agent  →  Next.js API  →  Supabase
                              ↓
                    Dashboard (filter / dial / export)
```

---

## Local setup

Need Node 18+, a Supabase project, and the usual patience with env vars.

```bash
git clone https://github.com/its-techxtreme/OutreachOS.git
cd OutreachOS
npm install
cp .env.example .env.local
```

Fill `.env.local` (see `.env.example`). Important ones:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `AGENT_SECRET`
- `ENCRYPTION_KEY` (64 hex chars — MFA secrets at rest)
- `ADMIN_*` / `ADMIN_GOOGLE_EMAIL` and optional `DEMO_USER_*`
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` (canonical: `https://outreachos.techxtreme.me`)
- Razorpay (optional until billing goes live): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_INR`, `RAZORPAY_PLAN_ID_USD`

Run migrations in `supabase/migrations/` in order (include `009_subscriptions.sql`), then:

```bash
npm run ensure:accounts
npm run seed:demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Supabase Auth:

- Redirect URLs: `/auth/callback`, `/auth/login`, `/auth/reset-password`, `/auth/username`
- Enable **Automatic Linking** (verified emails) so Google + email/password stay one user
- If you already have a duplicate Google-only admin user, dry-run then merge:

```bash
node --env-file=.env.local scripts/merge-auth-identities.mjs --dry-run
node --env-file=.env.local scripts/merge-auth-identities.mjs --email=you@example.com
```

Admin management (Google + allowlisted email only): `/admin/management-dashboard`  
Webhook for Premium: `https://your-domain/api/billing/webhook`
---

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run test:e2e
npm run lint
npm run ensure:accounts
npm run seed:demo
npm run audit:secrets
```

---

## Docs

| Doc | What’s in it |
| --- | --- |
| [API Spec](./docs/API_SPECIFICATION.md) | Agent endpoint shapes |
| [Deployment](./docs/DEPLOYMENT_GUIDE.md) | Vercel / prod notes |
| [Security](./docs/SECURITY_REQUIREMENTS.md) | Auth expectations |
| [Architecture](./docs/TECHNICAL_ARCHITECTURE.md) | How pieces fit |
| [Custom GPT](./docs/chatgpt/CUSTOM_GPT_INSTRUCTIONS.md) | Agent setup |

Screenshots in this README were taken from the live site (`docs/readme/`).

---

## Security (short version)

Don’t commit `.env.local` or real keys. Service role stays server-side. Passwords go through Supabase Auth. MFA secrets are encrypted with `ENCRYPTION_KEY`. Demo is intentionally limited.

---

## Credits

Built by **Athan** (Techxtreme). Parts of the code were written with help from [Cursor](https://cursor.com) — scaffolding, tests, and the boring glue. Product calls and final review are mine.
