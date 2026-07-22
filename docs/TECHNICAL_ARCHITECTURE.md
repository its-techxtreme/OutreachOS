# How OutreachOS is put together

Short map of the moving parts. For the live schema, trust `supabase/migrations/` over any old SQL snippets.

## Big picture

```text
Excel import
      │
      ▼
Next.js API routes  ──►  Supabase (Postgres + Auth)
      │
      ▼
Dashboard (filter, dial scripts, export)
```

Each signed-in user gets their own lead pool (`owner_id` isolation).

> Early builds also had a ChatGPT agent POST (`/api/agent/leads`). **That integration was scrapped.** The route may still exist in the tree as legacy code; it is not a product feature.

## Request paths

### Browser dashboard

1. User signs in (email/password or Google) via Supabase Auth.
2. App Router pages under `/dashboard`, `/settings`, etc. load data with the user’s session.
3. Filters, sticky scripts, quest board, and CSV export run against that user’s leads.

### Excel import

1. Client posts a `.xlsx` to `/api/leads/import`.
2. Server parses columns (aliases allowed), applies free/Premium quotas, inserts rows.
3. Dedup is per owner where unique keys apply (see migrations).

### Billing / Premium

Checkout UI is email-based for now. Roles and quotas live in app code + `profiles` / subscription tables from `009_subscriptions.sql`. Admins grant Premium from `/admin/management-dashboard`.

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js (App Router) on Vercel |
| UI | React + Tailwind, sketchbook styling |
| Auth / DB | Supabase |
| Parsing | ExcelJS / papaparse |
| Tests | Jest + Playwright |

## Schema source of truth

Apply migrations `001`–`009` in order. Highlights:

- `leads` + search helpers
- owner isolation and profiles/usernames
- dial kit (sticky scripts / quests)
- subscriptions / Premium scaffolding

Generated types: `types/database.types.ts`.

## Repo layout (rough)

```text
src/app/          # routes + API
components/       # UI
lib/              # auth, billing, quotas, helpers
supabase/migrations/
docs/
```

Older docs that still say `app/` at the repo root are leftover from early drafts — the app code lives under `src/app/` now.
