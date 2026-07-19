-- Dial Kit: call-friendly statuses, call scripts, quest board

-- 1) Expand lead status values (Contacted → Called)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS valid_status;

UPDATE leads SET status = 'Called' WHERE status = 'Contacted';

ALTER TABLE leads
  ADD CONSTRAINT valid_status CHECK (
    status IN (
      'New',
      'Called',
      'No Answer',
      'Callback',
      'Replied',
      'Converted',
      'Archived'
    )
  );

-- 2) Quest opt-in on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS quest_board_enabled BOOLEAN NOT NULL DEFAULT false;

-- Demo users can be opted in via app logic; default remains false for new profiles.

-- 3) Personal call scripts (general + niche keys)
CREATE TABLE IF NOT EXISTS call_scripts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  script_key TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT call_scripts_user_key_unique UNIQUE (user_id, script_key),
  CONSTRAINT call_scripts_key_nonempty CHECK (char_length(trim(script_key)) > 0),
  CONSTRAINT call_scripts_body_nonempty CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_call_scripts_user_id ON call_scripts (user_id);

DROP TRIGGER IF EXISTS trg_call_scripts_updated_at ON call_scripts;
CREATE TRIGGER trg_call_scripts_updated_at
  BEFORE UPDATE ON call_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "call_scripts_owner_all" ON call_scripts;
CREATE POLICY "call_scripts_owner_all" ON call_scripts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "call_scripts_service_role" ON call_scripts;
CREATE POLICY "call_scripts_service_role" ON call_scripts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4) Weekly quest assignments
CREATE TABLE IF NOT EXISTS user_weekly_quests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  claimed_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT user_weekly_quests_unique UNIQUE (user_id, week_start, quest_id),
  CONSTRAINT user_weekly_quests_progress_nonneg CHECK (progress >= 0),
  CONSTRAINT user_weekly_quests_target_pos CHECK (target > 0)
);

CREATE INDEX IF NOT EXISTS idx_user_weekly_quests_user_week
  ON user_weekly_quests (user_id, week_start);

DROP TRIGGER IF EXISTS trg_user_weekly_quests_updated_at ON user_weekly_quests;
CREATE TRIGGER trg_user_weekly_quests_updated_at
  BEFORE UPDATE ON user_weekly_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

ALTER TABLE user_weekly_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_weekly_quests_owner_all" ON user_weekly_quests;
CREATE POLICY "user_weekly_quests_owner_all" ON user_weekly_quests
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_weekly_quests_service_role" ON user_weekly_quests;
CREATE POLICY "user_weekly_quests_service_role" ON user_weekly_quests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
