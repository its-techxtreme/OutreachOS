# OutreachOS

**Lead intake → organize → outreach**

OutreachOS is a lead management app for cold outreach. Instead of dumping contacts into random spreadsheets and forgetting who you already messaged, you keep everything in one place: import from Excel, filter by niche/country/status, track progress, and export the lists you need.

It also accepts leads from a ChatGPT agent over a secured API, so prospecting and the dashboard can stay connected.


|                   |                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Live demo**     | [outreachos-online.vercel.app](https://outreachos-online.vercel.app)                                                     |
| **Repository**    | [github.com/its-techxtreme/OutreachOS](https://github.com/its-techxtreme/OutreachOS)                                     |
| **Hack Club**     | [Stardance project page](https://stardance.hackclub.com/projects/33617)                                                  |


---



## Why this exists

Cold outreach ops looks simple until you do it for real:

1. Collect business contacts from Maps / sheets / random notes
2. Clean phone numbers and addresses
3. Deduplicate so you do not message the same place twice
4. Filter by niche, country, or status before you start calling
5. Export a list for the day without rebuilding filters from scratch
6. Keep track of New → Contacted → Replied → Converted

Miss a step and your pipeline turns into chaos. OutreachOS replaces that mess with a single dashboard backed by Supabase: **import → validate → dedupe → filter → export**, plus an agent endpoint for automated intake.

The app runs on Vercel. Auth and data live in Supabase.

---



## Try the demo (no local setup)

You do not need to clone the repo to click around.

1. Open **[https://outreachos-online.vercel.app](https://outreachos-online.vercel.app)**
2. Click **Sign in as Demo** on the landing page (or login screen) — no password typing required.

Optional manual credentials (same shared demo account):


| Field    | Value                     |
| -------- | ------------------------- |
| Email    | `user@outreachos.vercel`  |
| Password | `OutreachOS@13`           |


**What the demo user can do**

- Browse the dashboard, filters, metrics, and vector vault view  
- Export the curated sample  
- Try Excel import (limited to **1 upload per hour**, max 50 rows)

**What the demo user cannot do**

- See other users’ private leads (demo is capped to **100** curated contacts)  
- Change security settings, delete leads, or use admin tools

### Create your own account

- **Sign up** with email + password (email verification required) or **Google**
- New accounts start with an **empty** personal lead pool
- Free-tier caps: **500** leads · **10** imports/day · **200** rows per import

---



## Architecture (at a glance)


| Piece        | Role                                              |
| ------------ | ------------------------------------------------- |
| **Web app**  | Landing + authenticated dashboard (Next.js)       |
| **API**      | Leads, filters, Excel import, agent intake        |
| **Supabase** | Postgres + Auth (source of truth for leads/users) |
| **Vercel**   | Hosting for the web app                           |


```text
ChatGPT agent / Excel upload  →  Next.js API  →  Supabase (leads)
                                                    ↓
                                         Dashboard (filter / export / status)
```

---



## Acknowledgments

Parts of this codebase were written and iterated with **[Cursor](https://cursor.com)**, an AI-assisted editor. Cursor was used for scaffolding, debugging, writing tests, and shipping the dashboard and import flow. Product decisions, architecture tradeoffs, deployment choices, and final review remain mine.

The product also integrates with a ChatGPT Custom GPT for automated lead intake through the secured agent API.

---



## Prerequisites

1. **Node.js 18+** and npm  
2. A **Supabase** project where you can run SQL migrations  
3. Optional: a ChatGPT Custom GPT if you want agent intake

---



## First-time setup

### 1. Clone and install

```bash
git clone https://github.com/its-techxtreme/OutreachOS.git
cd OutreachOS
npm install
```

### 2. Environment files

```bash
cp .env.example .env.local
```

Fill in at least:


| Variable | Notes |
| -------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — never expose to the browser |
| `AGENT_SECRET` | Shared secret for `POST /api/agent/leads` |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` | Your admin account |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` / `DEMO_USER_USERNAME` | Optional public demo account |

**Do not commit** `.env.local` or real passwords.

### 3. Database

Run every file under `supabase/migrations/` against your Supabase project (SQL editor or CLI), in order.

### 4. Auth URLs

In Supabase → **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production URL)
- Redirect allow-list should include `/auth/callback`, `/auth/login`, and `/auth/reset-password`

### 5. Create accounts + demo sample

```bash
npm run ensure:accounts
npm run seed:demo
```

### 6. Start the app

```bash
npm run dev
```


| Route | Purpose |
| ----- | ------- |
| [http://localhost:3000](http://localhost:3000) | Landing |
| [http://localhost:3000/auth/login](http://localhost:3000/auth/login) | Sign in |
| [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Lead dashboard |


---



## Useful scripts

```bash
npm run dev              # local server
npm run build            # production build
npm run test             # Jest
npm run test:e2e         # Playwright
npm run lint             # ESLint
npm run type-check       # TypeScript
npm run ensure:accounts  # sync admin/demo users from .env.local
npm run seed:demo        # refresh the curated demo lead sample
```

---



## Repo layout

```text
src/app/          Pages + API routes
components/       UI
lib/              Auth, import, search, leads helpers
supabase/         SQL migrations
docs/             API, security, deployment notes
scripts/          Account + demo seeding helpers
public/           Brand assets
```

---



## Documentation


| Doc | Use it for |
| --- | ---------- |
| [API Specification](./docs/API_SPECIFICATION.md) | Agent endpoint + request shapes |
| [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) | Production / Vercel notes |
| [Security Requirements](./docs/SECURITY_REQUIREMENTS.md) | Auth and access expectations |
| [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md) | System design |
| [ChatGPT instructions](./docs/chatgpt/CUSTOM_GPT_INSTRUCTIONS.md) | Custom GPT setup |


---



## Security reminders

- Never commit `.env`, `.env.local`, service role keys, or agent secrets.  
- Keep `SUPABASE_SERVICE_ROLE_KEY` off the client.  
- Demo accounts stay limited on purpose — do not reuse admin credentials publicly.  
- `.env.example` uses placeholders only.

---



## Author

Athan (Techxtreme)
