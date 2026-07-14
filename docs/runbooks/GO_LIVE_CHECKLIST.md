# Go-Live Checklist — OutreachOS

Use this checklist before declaring production live.

## Infrastructure
- [ ] Vercel project created and linked to this repo
- [ ] All production env vars set (see `docs/PHASE_6_HANDOFF_GUIDE.md`)
- [ ] Production deploy succeeds (`npx vercel --prod`)
- [ ] Custom domain configured (optional) with valid SSL
- [ ] Supabase Auth Site URL + redirect URLs updated for production domain

## Database
- [ ] Migrations 001–003 applied
- [ ] `api_keys`, `audit_logs`, `lead_stats` present
- [ ] RLS enabled on `leads` / `api_keys` / `audit_logs`
- [ ] `POST /api/admin/validate-migration` returns `success: true`
- [ ] Admin user created via `npm run ensure:admin`

## Security
- [ ] `npm run audit:security:full` passes (or accepted with documented exceptions)
- [ ] No secrets committed (`.env.local` / service role key)
- [ ] Security headers present on production responses
- [ ] Unauthenticated `/dashboard` redirects to login
- [ ] Unauthenticated `/api/leads` and `/api/admin/*` return 401

## Functional
- [ ] Admin login → dashboard loads
- [ ] Agent lead submission via `X-Agent-Secret` returns 201/200
- [ ] Duplicate `maps_url` is skipped (not duplicated)
- [ ] Filters / export work on dashboard
- [ ] MFA settings page loads (`/settings`)

## ChatGPT
- [ ] Custom GPT Action base URL points to production
- [ ] Auth header configured with production `AGENT_SECRET`
- [ ] End-to-end submit from ChatGPT → appears in dashboard

## Monitoring
- [ ] External uptime check on `/api/health`
- [ ] `/api/metrics` reachable for scraping (if used)
- [ ] Runbook + DR docs reviewed by operator

## Sign-off
| Role | Name | Date |
|------|------|------|
| Operator | | |
| Reviewer | | |
