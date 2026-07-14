-- Phase 6: Production observability tables, views, and helpers
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS patterns)

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Additional production indexes
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_address_gin ON leads USING gin (address gin_trgm_ops);

-- API keys table (hashed secrets only — never store plaintext)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    rate_limit INTEGER DEFAULT 1000,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    CONSTRAINT api_keys_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active) WHERE active = true;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Audit logs for production monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (
        COALESCE((auth.jwt() -> 'app_metadata' -> 'roles')::jsonb, '[]'::jsonb)
        ?| ARRAY['admin', 'super_admin']
    );

DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Lead statistics view for health/metrics dashboards
CREATE OR REPLACE VIEW lead_stats AS
SELECT
    COUNT(*)::bigint AS total_leads,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::bigint AS leads_today,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::bigint AS leads_this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint AS leads_this_month,
    COUNT(DISTINCT niche)::bigint AS unique_niches,
    COUNT(DISTINCT country)::bigint AS unique_countries
FROM leads;

GRANT SELECT ON lead_stats TO authenticated;

-- Helper: list RLS policies for a table (used by migration validator)
CREATE OR REPLACE FUNCTION public.get_rls_policies(table_name text)
RETURNS TABLE (policyname text, cmd text, roles name[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.policyname::text, p.cmd::text, p.roles
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = table_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_rls_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_policies(text) TO service_role;
