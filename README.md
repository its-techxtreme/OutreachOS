# OutreachOS

Personal lead vault for cold outreach.

Dump contacts in from Excel, filter by niche / country / status, keep call scripts next to the list, and stop losing track of who you already rang. Each account gets its own vault.


|               |                                                                                      |
| ------------- | ------------------------------------------------------------------------------------ |
| **Live**      | [https://outreachos.techxtreme.me](https://outreachos.techxtreme.me)                 |
| **Portfolio** | [techxtreme.me/work/outreachos](https://techxtreme.me/work/outreachos)               |
| **Repo**      | [github.com/its-techxtreme/OutreachOS](https://github.com/its-techxtreme/OutreachOS) |
| **Studio**    | [techxtreme.me](https://techxtreme.me)                                               |
| **Stardance** | [project page](https://stardance.hackclub.com/projects/33617)                        |




---



## Try it without cloning

1. Open [outreachos.techxtreme.me](https://outreachos.techxtreme.me)
2. Hit **Peek the demo** / **Sign in as Demo** — one click, no password typing

Demo is a shared sample vault (about 100 leads). Imports are capped so people don’t trash it. For your own empty vault, use **Start free** or Google sign-in.



---



## What it looks like



### Why it looks like a sketchbook

The first UI was… fine. Also painfully generic. A Shipwright review basically told me to stop shipping another lookalike dashboard, so I started hunting for something that could feel creative *and* still work for different ages without looking gimmicky.

I brainstormed for a while and got nowhere useful. Then, while sorting files on my laptop, I dug up my 10th-grade (high school) portfolio. It used this Japanese paper-notebook theme, lined pages, that whole handmade feel. That clicked. A sketchbook wasn’t just “pretty” — paper is how people kept contact notes long before CRMs existed, which fits OutreachOS almost too well: you manage people, numbers, and follow-ups.

So the app leans into paper texture, doodle borders, and sticky notes on purpose. It’s meant to feel like a working notebook, not a stock SaaS template.

### Demo mode & tutorial

First time you open the demo, Rio walks you through the vault (filters, metrics, scripts, and so on). Skip whenever you want.

A few demo quirks:

- Shared sample data (not your private vault)
- Import / write limits so the sample stays usable
- Tutorial usually shows once unless you clear it locally





### Dashboard + quests

Metrics up top, weekly quest board if you opt in, filters, then the lead list.





### Vector vault

Niche / country graph when you want the big picture instead of scrolling rows forever.



### Sticky call scripts

Call pitch pad that stays open while you dial. Placeholders like `{business}` / `{niche}` / `{location}` / `{phone}` — you say them live. Drag it, edit it, save your own (general + niche scripts).



---



## Auth


| Method           | Notes                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Email + password | Signup → verify email → claim a username                                         |
| Google           | Sign-in; Automatic Linking keeps Google + password as one user when emails match |
| Demo             | Shared sample vault, one-click, no password typing                               |
| MFA              | Optional TOTP under settings (secrets encrypted at rest with `ENCRYPTION_KEY`)   |
| Admin            | Google + allowlisted email → `/admin/management-dashboard`                       |


Password reset, username claim, and account delete live under `/auth/*` and settings. Passwords go through **Supabase Auth** — we don’t keep plaintext passwords around.

---



## What’s in the app

- Excel import + format guide (`/import-guide`) + template under `public/templates/`
- Filters, search, CSV export
- Call statuses: New, Called, No Answer, Callback, Replied, Converted, Archived
- Sticky scripts (general + niche), draggable
- Optional Quest Board (3 random weekly quests)
- Vector vault graph
- Email / password signup, Google sign-in, one-click demo
- Per-user lead pools (your stuff stays yours)
- Free vs **Premium** (`/pricing`) — ₹1499 or $15 / month; request via email to `techxtremebuisness@gmail.com` (username included automatically); I grant access from the admin dashboard after payment
- Public SEO: `/sitemap.xml`, `/robots.txt`, `/llms.txt`
- Accessibility notice: `/accessibility`

There’s also a parked agent route (`POST /api/agent/leads` + `X-Agent-Secret`) from an early ChatGPT experiment. Not a v1 product feature — left in as scaffolding if GPT agent intake comes back in v2. Excel import is what you should use today.

---



## Stack

Next.js · Supabase (Auth + Postgres) · Tailwind · Vercel

```text
Excel import  →  Next.js API  →  Supabase
                     ↓
           Dashboard (filter / dial / export)
```

---



## Local setup

Need Node 18+, a Supabase project, and a bit of patience with env vars.

```bash
git clone https://github.com/its-techxtreme/OutreachOS.git
cd OutreachOS
npm install
cp .env.example .env.local
```

Fill `.env.local` from `.env.example`. The important ones:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `AGENT_SECRET` (legacy agent route only; optional for normal local use)
- `ENCRYPTION_KEY` (64 hex chars — MFA secrets at rest)
- `ADMIN_*` / `ADMIN_GOOGLE_EMAIL` and optional `DEMO_USER_*`
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` (canonical: `https://outreachos.techxtreme.me`)

Run migrations in `supabase/migrations/` in order (include `009_subscriptions.sql`), then:

```bash
npm run ensure:accounts
npm run seed:demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase Auth

- Redirect URLs: `/auth/callback`, `/auth/login`, `/auth/reset-password`, `/auth/username`
- Enable **Automatic Linking** (verified emails) so Google + email/password stay one user
- If you already duplicated an admin as Google-only:

```bash
node --env-file=.env.local scripts/merge-auth-identities.mjs --dry-run
node --env-file=.env.local scripts/merge-auth-identities.mjs --email=you@example.com
```

Admin management (Google + allowlisted email only): `/admin/management-dashboard`

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


| Doc                                                  | What’s in it                               |
| ---------------------------------------------------- | ------------------------------------------ |
| [API Spec](./docs/API_SPECIFICATION.md)              | Legacy agent endpoint (parked for v2)      |
| [Deployment](./docs/DEPLOYMENT_GUIDE.md)             | Vercel / prod notes                        |
| [SEO / Search Console](./docs/SEO_SEARCH_CONSOLE.md) | Index `outreachos.techxtreme.me` in Google |
| [Security](./docs/SECURITY_REQUIREMENTS.md)          | Auth expectations                          |
| [Architecture](./docs/TECHNICAL_ARCHITECTURE.md)     | How pieces fit                             |
| [Accessibility](/accessibility)                      | Accessibility notice                       |


Screenshots in this README are from the live site (`docs/readme/`).

---



## Security (short version)

Don’t commit `.env.local` or real keys. Service role stays server-side. Passwords go through Supabase Auth. MFA secrets are encrypted with `ENCRYPTION_KEY`. Demo is intentionally limited.

---



## Credits

Built by **Athan** ([Techxtreme](https://techxtreme.me)).

I use [Cursor](https://cursor.com) for a some amount of the coding help — scaffolding, tests, and the boring glue. Product calls, design, and final review are still mine in those cases too.