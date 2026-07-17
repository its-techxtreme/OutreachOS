-- Phase: per-user lead isolation (owner_id)
-- Existing rows backfill to the first admin / super_admin user.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

UPDATE leads
SET owner_id = (
  SELECT id
  FROM auth.users
  WHERE (raw_app_meta_data -> 'roles') ? 'admin'
     OR (raw_app_meta_data -> 'roles') ? 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE owner_id IS NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS unique_maps_url;

CREATE UNIQUE INDEX IF NOT EXISTS leads_owner_maps_url_uidx
  ON leads (owner_id, maps_url)
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads (owner_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON leads;
DROP POLICY IF EXISTS "Owners manage own leads" ON leads;

CREATE POLICY "Owners manage own leads" ON leads
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Service role access" ON leads;
CREATE POLICY "Service role access" ON leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Deny anonymous access" ON leads;
CREATE POLICY "Deny anonymous access" ON leads
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Scope fuzzy search + filtered pagination by owner when provided
CREATE OR REPLACE FUNCTION public.search_leads_fuzzy(
  search_term text,
  sim_threshold real DEFAULT 0.3,
  result_limit integer DEFAULT 50,
  p_owner_id uuid DEFAULT NULL
)
RETURNS SETOF leads
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT l.*
  FROM leads l
  WHERE (p_owner_id IS NULL OR l.owner_id = p_owner_id)
    AND (
      similarity(l.name, search_term) >= sim_threshold
      OR l.name ILIKE '%' || search_term || '%'
    )
  ORDER BY similarity(l.name, search_term) DESC, l.created_at DESC
  LIMIT result_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_leads_filtered(
  p_search text DEFAULT NULL,
  p_niche text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_owner_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
  v_leads jsonb;
BEGIN
  v_offset := (GREATEST(p_page, 1) - 1) * GREATEST(p_page_size, 1);

  WITH filtered AS (
    SELECT l.*
    FROM leads l
    WHERE (p_owner_id IS NULL OR l.owner_id = p_owner_id)
      AND (p_niche IS NULL OR l.niche = p_niche)
      AND (p_country IS NULL OR l.country = p_country)
      AND (p_status IS NULL OR l.status = p_status)
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
      AND (
        p_search IS NULL
        OR p_search = ''
        OR similarity(l.name, p_search) >= 0.3
        OR l.name ILIKE '%' || p_search || '%'
        OR l.niche ILIKE '%' || p_search || '%'
        OR l.country ILIKE '%' || p_search || '%'
        OR COALESCE(l.phone, '') ILIKE '%' || p_search || '%'
        OR COALESCE(l.address, '') ILIKE '%' || p_search || '%'
      )
  )
  SELECT COUNT(*) INTO v_total FROM filtered;

  SELECT COALESCE(
    jsonb_agg(
      (row_to_json(paged)::jsonb - 'sort_rank')
      ORDER BY paged.sort_rank DESC, paged.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_leads
  FROM (
    SELECT
      f.*,
      CASE
        WHEN p_search IS NOT NULL AND p_search <> '' THEN similarity(f.name, p_search)
        ELSE 0
      END AS sort_rank
    FROM filtered f
    ORDER BY sort_rank DESC, f.created_at DESC
    LIMIT GREATEST(p_page_size, 1)
    OFFSET v_offset
  ) paged;

  RETURN jsonb_build_object(
    'leads', COALESCE(v_leads, '[]'::jsonb),
    'totalCount', v_total,
    'page', GREATEST(p_page, 1),
    'pageSize', GREATEST(p_page_size, 1)
  );
END;
$$;
