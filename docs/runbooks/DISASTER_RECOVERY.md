# Disaster recovery

Keep it boring: backups exist, migrations are in git, Vercel can promote an old deploy.

## Recovery objectives
| Metric | Target |
|--------|--------|
| RPO (data loss tolerance) | ≤ 24h (Supabase daily backups) / minutes with PITR |
| RTO (restore time) | ≤ 2 hours for app + DB restore |

## What is backed up
1. **Supabase database** — managed backups (plan-dependent) + migration SQL in `supabase/migrations/`
2. **Application** — Git history on GitHub / local remotes; Vercel keeps prior deployments
3. **Secrets** — Vercel env vars + local `.env.local` (never committed)

## Backup verification
1. Confirm Supabase project backup schedule in Dashboard → Database → Backups
2. Ensure all schema changes are committed under `supabase/migrations/`
3. After each release, run `POST /api/admin/validate-migration` as admin

## Database restore procedure
1. Pause write traffic if needed (disable imports / rotate secrets temporarily)
2. In Supabase Dashboard, restore from the chosen backup / PITR timestamp
3. Re-apply any migrations newer than the restore point (`supabase/migrations/001` … `009` as needed)
4. Run migration validator; confirm `/api/health` is healthy
5. Smoke-test login + Excel import

## Application rollback
1. Vercel → Deployments → select last known-good production deployment → **Promote**
2. Verify `/api/health` and admin login
3. If schema and app are incompatible, restore DB to matching migration revision first

## Credential compromise response
1. Rotate `SUPABASE_SERVICE_ROLE_KEY` if leaked (Supabase → Settings → API → regenerate carefully)
2. Rotate `ENCRYPTION_KEY` / admin passwords as needed; revoke sessions if available
3. If the legacy agent route is still enabled, rotate `AGENT_SECRET` too
4. Review `audit_logs` for suspicious actions

## Data integrity checks after restore
```sql
SELECT COUNT(*) FROM leads;
SELECT * FROM lead_stats;
SELECT policyname FROM pg_policies WHERE tablename = 'leads';
```

Expect unique `maps_url`, RLS enabled, and the three core lead policies present.
