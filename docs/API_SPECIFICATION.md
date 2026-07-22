# Agent API (legacy / v2 foundation)

> **Not a v1 product feature.** Day-to-day lead entry is **Excel import**.
> `/api/agent/leads` stays in the repo as parked infrastructure for a possible GPT agent in **v2**.
> Do not advertise it to end users today.

## Status

| Item | Reality |
| --- | --- |
| Product feature (v1) | No |
| Documented for users | No |
| Route in repo | Yes — keep as v2 foundation |
| Auth | `X-Agent-Secret` ↔ `AGENT_SECRET` (if configured) |

Do not put `SUPABASE_SERVICE_ROLE_KEY` in any GPT prompt or client bundle.

## Request (legacy)

`POST /api/agent/leads`

```http
Content-Type: application/json
X-Agent-Secret: [AGENT_SECRET_VALUE]
```

```json
{
  "lead": {
    "name": "string (required)",
    "niche": "string (required)",
    "country": "string (required)",
    "phone": "string (optional)",
    "address": "string (optional)",
    "maps_url": "string (required, unique per owner)"
  },
  "metadata": {
    "source": "api",
    "version": "1.0"
  }
}
```

Duplicate `maps_url` for that owner typically returns success with `skipped: true`.

Prefer Excel import + the format guide at `/import-guide`.
