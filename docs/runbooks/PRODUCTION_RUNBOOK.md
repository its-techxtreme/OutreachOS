# OutreachOS Production Runbook

## Service overview
| Component | Provider | Notes |
|-----------|----------|--------|
| App | Vercel (Next.js 16) | Regions `iad1` / `sfo1` |
| Database / Auth | Supabase project `outreachos` (`qowwnchhyjnfovxcjiqw`) | RLS enabled |
| Agent ingress | `POST /api/agent/leads` | `X-Agent-Secret` |
| Admin UI | `/dashboard`, `/settings` | Supabase session |

## Health checks
```bash
curl -s https://<prod>/api/health | jq
curl -s https://<prod>/api/metrics   # Prometheus text
```

Healthy response includes `status: "healthy"`, `checks.database: true`, `checks.environment: true`.

## Key admin endpoints
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/admin/metrics` | Session + `SYSTEM_METRICS` |
| POST | `/api/admin/validate-migration` | Session + admin/super_admin |
| GET | `/api/leads` | Session |
| POST | `/api/agent/leads` | Agent secret / API key |

## Common incidents

### 503 on `/api/health`
1. Confirm Supabase project is `ACTIVE_HEALTHY`
2. Confirm Vercel env vars for Supabase + `AGENT_SECRET`
3. Check Vercel runtime logs for the deployment

### Agent submissions returning 401
1. Verify `AGENT_SECRET` matches Custom GPT Action auth header
2. Confirm `ALLOWED_ORIGINS` includes ChatGPT origins if browser preflight fails

### Admin cannot log in
1. Confirm Supabase Auth Site URL / redirect allow-list matches production domain
2. Re-run `npm run ensure:admin` with production service role key
3. Check MFA status on `/settings` if previously enrolled

### Elevated error rate
1. `GET /api/admin/metrics` (while authenticated) for last-hour report
2. Inspect Vercel logs filtered by `statusCode >= 400`
3. Check Supabase logs / advisors for slow queries or RLS denials

## Deploy / rollback
```bash
# Deploy
npx vercel --prod

# Rollback: promote previous deployment in Vercel Dashboard
# Deployments → previous successful → Promote to Production
```

## Monitoring cadence
| Check | Frequency |
|-------|-----------|
| `/api/health` | Every 1–5 min (external uptime monitor) |
| Admin metrics / Vercel analytics | Daily |
| `npm audit --audit-level=high` | Weekly |
| Backup restore drill | Quarterly |

## Contacts / ownership
- App owner: OutreachOS operator
- Infra: Vercel + Supabase dashboards for the linked accounts
