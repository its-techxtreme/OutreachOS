# Disaster Recovery & Backup Procedures

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
1. Pause agent traffic (disable Custom GPT Action or rotate `AGENT_SECRET` temporarily)
2. In Supabase Dashboard, restore from the chosen backup / PITR timestamp
3. Re-apply any migrations newer than the restore point:
   - `001_create_leads_table.sql`
   - `002_leads_search_rpc.sql`
   - `003_production_observability.sql`
4. Run migration validator; confirm `/api/health` is healthy
5. Re-enable agent traffic

## Application rollback
1. Vercel → Deployments → select last known-good production deployment → **Promote**
2. Verify `/api/health` and admin login
3. If schema and app are incompatible, restore DB to matching migration revision first

## Credential compromise response
1. Rotate `AGENT_SECRET` in Vercel + Custom GPT Action
2. Rotate `SUPABASE_SERVICE_ROLE_KEY` if leaked (Supabase → Settings → API → regenerate carefully)
3. Force password reset for admin users; revoke sessions if available
4. Review `audit_logs` for suspicious actions

## Data integrity checks after restore
```sql
SELECT COUNT(*) FROM leads;
SELECT * FROM lead_stats;
SELECT policyname FROM pg_policies WHERE tablename = 'leads';
```

Expect unique `maps_url`, RLS enabled, and the three core lead policies present.
