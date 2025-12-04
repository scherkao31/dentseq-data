-- ============================================================================
-- DENTAL SEQUENCE DATA WEBAPP - DATABASE RESTRUCTURE
-- Version: 2.0.0
-- Purpose: Simplify treatment plans, move patient context to sequences
-- ============================================================================

-- ============================================================================
-- NEW ENUMS (with IF NOT EXISTS pattern)
-- ============================================================================

-- Budget constraints for sequences
DO $$ BEGIN
  CREATE TYPE budget_constraint AS ENUM ('no_constraint', 'moderate', 'limited', 'very_limited');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Time constraints for sequences
DO $$ BEGIN
  CREATE TYPE time_constraint AS ENUM ('no_constraint', 'moderate', 'urgent', 'very_urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Patient priorities
DO $$ BEGIN
  CREATE TYPE patient_priority AS ENUM ('function', 'aesthetics', 'cost', 'time', 'durability', 'minimal_intervention');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Dental anxiety levels
DO $$ BEGIN
  CREATE TYPE dental_anxiety AS ENUM ('none', 'mild', 'moderate', 'severe');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Plan status (simplified)
DO $$ BEGIN
  CREATE TYPE plan_status AS ENUM ('draft', 'active', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- NEW TABLE: treatment_plans (lightweight)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Creator tracking
  created_by UUID REFERENCES dentists(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES dentists(id) ON DELETE SET NULL,

  -- Plan identification
  plan_number TEXT UNIQUE,
  title TEXT, -- Optional descriptive title

  -- Raw input from user (valuable for AI training)
  raw_input TEXT NOT NULL, -- Original shorthand notation

  -- Parsed treatment items (structured from AI parsing)
  -- Each item: { teeth: string[], treatment_type: string, description: string, category: string, raw_text: string }
  treatment_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Derived from treatment_items (for easy querying/filtering)
  dentistry_types treatment_category[] NOT NULL DEFAULT '{}',
  teeth_involved TEXT[] NOT NULL DEFAULT '{}',

  -- AI parsing metadata
  ai_parsed BOOLEAN DEFAULT false,
  ai_parsing_confidence REAL, -- 0-1 confidence score
  user_confirmed BOOLEAN DEFAULT false,

  -- Optional notes
  notes TEXT,

  -- Workflow
  status plan_status DEFAULT 'draft',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search on raw input and title
  search_vector TSVECTOR
);

-- ============================================================================
-- MODIFY: treatment_sequences (add patient context)
-- ============================================================================

-- Add new columns to treatment_sequences (IF NOT EXISTS pattern)
ALTER TABLE treatment_sequences
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS patient_age_range age_range,
  ADD COLUMN IF NOT EXISTS patient_sex sex,
  ADD COLUMN IF NOT EXISTS budget_constraint budget_constraint DEFAULT 'no_constraint',
  ADD COLUMN IF NOT EXISTS time_constraint time_constraint DEFAULT 'no_constraint',
  ADD COLUMN IF NOT EXISTS time_constraint_details TEXT,
  ADD COLUMN IF NOT EXISTS patient_priorities patient_priority[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dental_anxiety dental_anxiety DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS additional_context TEXT;

-- ============================================================================
-- INDEXES for new structure (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON treatment_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON treatment_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_dentistry_types ON treatment_plans USING GIN(dentistry_types);
CREATE INDEX IF NOT EXISTS idx_plans_teeth ON treatment_plans USING GIN(teeth_involved);
CREATE INDEX IF NOT EXISTS idx_plans_search ON treatment_plans USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_sequences_plan ON treatment_sequences(plan_id);
CREATE INDEX IF NOT EXISTS idx_sequences_age ON treatment_sequences(patient_age_range);
CREATE INDEX IF NOT EXISTS idx_sequences_sex ON treatment_sequences(patient_sex);
CREATE INDEX IF NOT EXISTS idx_sequences_budget ON treatment_sequences(budget_constraint);
CREATE INDEX IF NOT EXISTS idx_sequences_time ON treatment_sequences(time_constraint);
CREATE INDEX IF NOT EXISTS idx_sequences_priorities ON treatment_sequences USING GIN(patient_priorities);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate plan numbers
CREATE OR REPLACE FUNCTION generate_plan_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM treatment_plans
  WHERE plan_number LIKE 'PLAN-' || year_part || '-%';

  NEW.plan_number := 'PLAN-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_plan_number_trigger ON treatment_plans;
CREATE TRIGGER generate_plan_number_trigger
  BEFORE INSERT ON treatment_plans
  FOR EACH ROW
  WHEN (NEW.plan_number IS NULL)
  EXECUTE FUNCTION generate_plan_number();

-- Update timestamps for treatment_plans
DROP TRIGGER IF EXISTS update_plans_updated_at ON treatment_plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update search vector for treatment_plans
CREATE OR REPLACE FUNCTION update_plan_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.raw_input, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plan_search_trigger ON treatment_plans;
CREATE TRIGGER update_plan_search_trigger
  BEFORE INSERT OR UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_plan_search_vector();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Plan overview with sequence count
DROP VIEW IF EXISTS plan_overview;
CREATE VIEW plan_overview AS
SELECT
  p.id,
  p.plan_number,
  p.title,
  p.raw_input,
  p.dentistry_types,
  p.teeth_involved,
  p.status,
  p.ai_parsed,
  p.user_confirmed,
  p.created_at,
  p.updated_at,
  creator.full_name AS created_by_name,
  COUNT(DISTINCT s.id) AS sequence_count,
  COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) AS approved_sequence_count
FROM treatment_plans p
LEFT JOIN dentists creator ON p.created_by = creator.id
LEFT JOIN treatment_sequences s ON s.plan_id = p.id
GROUP BY p.id, creator.full_name;

-- Sequence overview with patient context (updated)
DROP VIEW IF EXISTS sequence_overview;
CREATE VIEW sequence_overview AS
SELECT
  s.id,
  s.sequence_number,
  s.title,
  s.status,
  s.plan_id,
  p.plan_number,
  p.title AS plan_title,
  p.raw_input AS plan_raw_input,
  -- Patient context
  s.patient_age_range,
  s.patient_sex,
  s.budget_constraint,
  s.time_constraint,
  s.patient_priorities,
  s.dental_anxiety,
  -- Timestamps
  s.created_at,
  s.updated_at,
  creator.full_name AS created_by_name,
  -- Stats
  COUNT(DISTINCT ag.id) AS appointment_count,
  COUNT(DISTINCT t.id) AS treatment_count,
  COUNT(DISTINCT e.id) AS evaluation_count,
  COALESCE(AVG(e.score_overall), 0) AS avg_score
FROM treatment_sequences s
LEFT JOIN treatment_plans p ON s.plan_id = p.id
LEFT JOIN dentists creator ON s.created_by = creator.id
LEFT JOIN appointment_groups ag ON ag.sequence_id = s.id
LEFT JOIN treatments t ON t.appointment_group_id = ag.id
LEFT JOIN sequence_evaluations e ON e.sequence_id = s.id
GROUP BY s.id, p.plan_number, p.title, p.raw_input, creator.full_name;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON treatment_plans;
CREATE POLICY "Allow all for authenticated users" ON treatment_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- STATISTICS HELPERS
-- ============================================================================

-- Function to get dataset statistics for the new structure
CREATE OR REPLACE FUNCTION get_dataset_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_plans', (SELECT COUNT(*) FROM treatment_plans),
    'total_sequences', (SELECT COUNT(*) FROM treatment_sequences WHERE plan_id IS NOT NULL),
    'total_treatments', (SELECT COUNT(*) FROM treatments),
    'confirmed_plans', (SELECT COUNT(*) FROM treatment_plans WHERE user_confirmed = true),
    'approved_sequences', (SELECT COUNT(*) FROM treatment_sequences WHERE status = 'approved' AND plan_id IS NOT NULL),
    'dentistry_type_distribution', (
      SELECT jsonb_object_agg(dtype, cnt)
      FROM (
        SELECT unnest(dentistry_types) as dtype, COUNT(*) as cnt
        FROM treatment_plans
        GROUP BY dtype
      ) sub
    ),
    'age_distribution', (
      SELECT jsonb_object_agg(COALESCE(patient_age_range::text, 'unspecified'), cnt)
      FROM (
        SELECT patient_age_range, COUNT(*) as cnt
        FROM treatment_sequences
        WHERE plan_id IS NOT NULL
        GROUP BY patient_age_range
      ) sub
    ),
    'budget_distribution', (
      SELECT jsonb_object_agg(COALESCE(budget_constraint::text, 'unspecified'), cnt)
      FROM (
        SELECT budget_constraint, COUNT(*) as cnt
        FROM treatment_sequences
        WHERE plan_id IS NOT NULL
        GROUP BY budget_constraint
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
