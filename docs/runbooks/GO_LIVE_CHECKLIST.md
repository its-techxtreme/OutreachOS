# Go-Live Checklist — OutreachOS

Use this checklist before declaring production live.

## Infrastructure
- [ ] Vercel project created and linked to this repo
- [ ] All production env vars set (see `.env.example` + `docs/DEPLOYMENT_GUIDE.md`)
- [ ] Production deploy succeeds (`npx vercel --prod`)
- [ ] Custom domain configured (optional) with valid SSL
- [ ] Supabase Auth Site URL + redirect URLs updated for production domain

## Database
- [ ] Migrations `001`–`009` applied (in order)
- [ ] RLS enabled on sensitive tables
- [ ] Admin user available via `npm run ensure:accounts`

## Security
- [ ] `npm run audit:security:full` passes (or accepted with documented exceptions)
- [ ] No secrets committed (`.env.local` / service role key)
- [ ] Security headers present on production responses
- [ ] Unauthenticated `/dashboard` redirects to login
- [ ] Unauthenticated `/api/leads` and `/api/admin/*` return 401

## Functional
- [ ] Admin login → dashboard loads
- [ ] Filters / export work on dashboard
- [ ] MFA settings page loads (`/settings`)

## Monitoring
- [ ] External uptime check on `/api/health`
- [ ] `/api/metrics` reachable for scraping (if used)
- [ ] Runbook + DR docs reviewed by operator

## Sign-off
| Role | Name | Date |
|------|------|------|
| Operator | | |
| Reviewer | | |
