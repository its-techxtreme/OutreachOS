-- Per-user lead status overlays (demo isolation + future multi-user soft status)
CREATE TABLE IF NOT EXISTS user_lead_status (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  lead_id BIGINT NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (user_id, lead_id),
  CONSTRAINT user_lead_status_valid CHECK (
    status IN (
      'New',
      'Called',
      'No Answer',
      'Callback',
      'Replied',
      'Converted',
      'Archived'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_user_lead_status_user
  ON user_lead_status (user_id);

DROP TRIGGER IF EXISTS trg_user_lead_status_updated_at ON user_lead_status;
CREATE TRIGGER trg_user_lead_status_updated_at
  BEFORE UPDATE ON user_lead_status
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

ALTER TABLE user_lead_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lead_status_owner_all" ON user_lead_status;
CREATE POLICY "user_lead_status_owner_all" ON user_lead_status
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_lead_status_service_role" ON user_lead_status;
CREATE POLICY "user_lead_status_service_role" ON user_lead_status
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- demo_sample_leads: service-role only (no open authenticated access)
DROP POLICY IF EXISTS "demo_sample_leads_service_role" ON demo_sample_leads;
CREATE POLICY "demo_sample_leads_service_role" ON demo_sample_leads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
