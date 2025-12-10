-- ============================================================================
-- AI Settings Table
-- Stores customizable AI prompt components for different features
-- ============================================================================

-- Create the ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,  -- 'plan_parser', future: 'sequence_suggester', etc.
  config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Flexible JSON for settings
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES dentists(id) ON DELETE SET NULL
);

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_settings_key ON ai_settings(setting_key);

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read settings
CREATE POLICY "Anyone can read AI settings"
  ON ai_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can update settings (or restrict to admins later)
CREATE POLICY "Authenticated users can update AI settings"
  ON ai_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone authenticated can insert settings (for initial creation)
CREATE POLICY "Authenticated users can insert AI settings"
  ON ai_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default plan_parser settings
INSERT INTO ai_settings (setting_key, config)
VALUES (
  'plan_parser',
  '{
    "abbreviations": "- CC = couronne céramique / couronne complète\n- CCM = couronne céramo-métallique\n- prov = provisoire\n- endo = traitement endodontique / dévitalisation\n- ext = extraction\n- impl = implant\n- SRP = surfaçage radiculaire\n- détartrage = scaling/prophylaxis\n- compo = composite\n- amalg = amalgame\n- RCT = root canal treatment\n- IC = inlay-core\n- bridge = prothèse fixée plurale\n- PAP = prothèse amovible partielle\n- PAC = prothèse amovible complète\n- Q1, Q2, Q3, Q4 = quadrants",
    "custom_treatments": "",
    "custom_instructions": ""
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_settings_updated_at();
