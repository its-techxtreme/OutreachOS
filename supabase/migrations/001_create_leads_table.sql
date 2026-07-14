-- OutreachOS Phase 1: leads table, indexes, and RLS policies
-- Run this script in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    maps_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT unique_maps_url UNIQUE (maps_url),
    CONSTRAINT valid_status CHECK (status IN ('New', 'Contacted', 'Replied', 'Converted', 'Archived'))
);

CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_niche_country ON leads(niche, country);
CREATE INDEX IF NOT EXISTS idx_leads_name_gin ON leads USING gin (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON leads;
CREATE POLICY "Admin full access" ON leads
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role access" ON leads;
CREATE POLICY "Service role access" ON leads
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Deny anonymous access" ON leads;
CREATE POLICY "Deny anonymous access" ON leads
    FOR ALL
    USING (false)
    WITH CHECK (false);
