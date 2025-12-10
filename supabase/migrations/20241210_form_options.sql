-- ============================================================================
-- Form Options Table
-- Stores customizable dropdown/select options for forms
-- ============================================================================

-- Create the form_options table (singleton - one row for all options)
CREATE TABLE IF NOT EXISTS form_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- All form options as JSON
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES dentists(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE form_options ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read options
CREATE POLICY "Anyone can read form options"
  ON form_options FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can update options
CREATE POLICY "Authenticated users can update form options"
  ON form_options FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Anyone authenticated can insert options (for initial creation)
CREATE POLICY "Authenticated users can insert form options"
  ON form_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_form_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_options_updated_at
  BEFORE UPDATE ON form_options
  FOR EACH ROW
  EXECUTE FUNCTION update_form_options_updated_at();

-- Insert empty config (will be populated with defaults on first access)
INSERT INTO form_options (config)
VALUES ('{}'::jsonb)
ON CONFLICT DO NOTHING;
