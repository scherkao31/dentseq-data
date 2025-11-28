-- ============================================================================
-- DECISION CONTEXT ENHANCEMENT
-- Version: 1.1.0
-- Description: Adds fields to capture the reasoning behind treatment decisions
-- ============================================================================

-- ============================================================================
-- NEW ENUMS for Decision Context
-- ============================================================================

-- Patient priorities
CREATE TYPE patient_priority AS ENUM (
  'function', 'aesthetics', 'cost', 'time', 'durability', 'minimal_intervention'
);

-- Budget constraints
CREATE TYPE budget_constraint AS ENUM (
  'no_constraint', 'moderate', 'limited', 'very_limited'
);

-- Time constraints
CREATE TYPE time_constraint AS ENUM (
  'no_constraint', 'moderate', 'urgent', 'very_urgent'
);

-- Smoking status
CREATE TYPE smoking_status AS ENUM (
  'never', 'former', 'current_light', 'current_moderate', 'current_heavy'
);

-- Diabetes control
CREATE TYPE diabetes_control AS ENUM (
  'none', 'well_controlled', 'moderately_controlled', 'poorly_controlled'
);

-- Bruxism status
CREATE TYPE bruxism_status AS ENUM (
  'none', 'suspected', 'confirmed_night', 'confirmed_day', 'confirmed_both', 'treated'
);

-- Bleeding on probing
CREATE TYPE bop_level AS ENUM (
  'less_10', '10_30', 'more_30'
);

-- Tooth prognosis
CREATE TYPE tooth_prognosis AS ENUM (
  'favorable', 'questionable', 'unfavorable', 'hopeless'
);

-- ============================================================================
-- ALTER CLINICAL_CASES - Add patient constraints & risk factors
-- ============================================================================

-- Patient Constraints (Decision Context)
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS patient_priorities TEXT[];
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS budget_constraint budget_constraint;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS time_constraint time_constraint;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS time_constraint_details TEXT;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS dental_anxiety anxiety_level;

-- Risk Factors
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS smoking_status smoking_status;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS diabetes_control diabetes_control;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS bruxism bruxism_status;
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS bop_percentage bop_level;

-- Tooth-level data (JSONB for per-tooth prognosis and notes)
-- Format: { "11": { "prognosis": "favorable", "factors": ["mobility"], "notes": "" }, ... }
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS teeth_prognosis JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- ALTER TREATMENT_SEQUENCES - Add global decision context
-- ============================================================================

-- Global rationale for the sequence approach
ALTER TABLE treatment_sequences ADD COLUMN IF NOT EXISTS global_rationale TEXT;

-- Why this approach over alternatives
ALTER TABLE treatment_sequences ADD COLUMN IF NOT EXISTS approach_rationale TEXT;

-- Key constraints that shaped this sequence
ALTER TABLE treatment_sequences ADD COLUMN IF NOT EXISTS key_constraints_considered TEXT[];

-- ============================================================================
-- ALTER APPOINTMENT_GROUPS - Enhanced timing logic
-- ============================================================================

-- Rename for clarity (keeping old column for backward compat)
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS delay_from_previous INTEGER;
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS delay_unit_new delay_unit;

-- Structured delay reason (instead of free text)
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS delay_reason_code TEXT;

-- What must happen/heal before this appointment
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS prerequisites_clinical TEXT[];

-- Sequencing logic - why this appointment is at this position
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS sequencing_rationale TEXT;
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS sequencing_reasons TEXT[];

-- Objectives as text (in addition to array)
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS objectives_text TEXT;

-- Order index for ordering
ALTER TABLE appointment_groups ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- ============================================================================
-- ALTER TREATMENTS - Add alternatives and rationale
-- ============================================================================

-- Treatment code (standardized)
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_code TEXT;

-- Single tooth (in addition to teeth array)
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS tooth_number TEXT;

-- Clinical rationale (why this treatment)
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Alternative treatments that were considered but rejected
-- Format: [{ "treatment": "implant", "reason_code": "cost", "details": "..." }, ...]
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS alternatives_considered JSONB DEFAULT '[]'::jsonb;

-- Why this treatment at this point in the sequence
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS sequencing_rationale TEXT;

-- Prognosis for this specific treatment
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS expected_prognosis tooth_prognosis;

-- Notes
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Order index
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Estimated duration in minutes
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

-- ============================================================================
-- CREATE NEW TABLE: Treatment Alternatives
-- Stores the alternatives considered for each treatment decision
-- ============================================================================

CREATE TABLE IF NOT EXISTS treatment_alternatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Can be linked to a treatment or to a case (for global alternatives)
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  case_id UUID REFERENCES clinical_cases(id) ON DELETE CASCADE,

  -- The alternative that was considered
  alternative_treatment_code TEXT NOT NULL,
  alternative_description TEXT,

  -- Why it was rejected
  rejection_reason_code TEXT NOT NULL,
  rejection_reason_details TEXT,

  -- Was this a close call?
  was_close_decision BOOLEAN DEFAULT false,

  -- Order (if multiple alternatives)
  order_index INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- At least one of treatment_id or case_id must be set
  CONSTRAINT must_have_parent CHECK (treatment_id IS NOT NULL OR case_id IS NOT NULL)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_alternatives_treatment ON treatment_alternatives(treatment_id);
CREATE INDEX IF NOT EXISTS idx_alternatives_case ON treatment_alternatives(case_id);

-- RLS
ALTER TABLE treatment_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON treatment_alternatives
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- UPDATE VIEWS to include new fields
-- ============================================================================

-- Drop and recreate case_overview with new fields
DROP VIEW IF EXISTS case_overview;
CREATE VIEW case_overview AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.status,
  c.complexity,
  c.patient_priorities,
  c.budget_constraint,
  c.smoking_status,
  c.bruxism,
  c.created_at,
  c.updated_at,
  creator.full_name AS created_by_name,
  modifier.full_name AS last_modified_by_name,
  COUNT(DISTINCT s.id) AS sequence_count,
  COUNT(DISTINCT s.created_by) AS unique_contributors,
  COUNT(DISTINCT e.id) AS total_evaluations,
  COALESCE(AVG(e.score_overall), 0) AS avg_score
FROM clinical_cases c
LEFT JOIN dentists creator ON c.created_by = creator.id
LEFT JOIN dentists modifier ON c.last_modified_by = modifier.id
LEFT JOIN treatment_sequences s ON s.case_id = c.id
LEFT JOIN sequence_evaluations e ON e.sequence_id = s.id
GROUP BY c.id, creator.full_name, modifier.full_name;

-- Sequence overview stays the same (already has what we need)

-- ============================================================================
-- DATA COMPLETENESS FUNCTION
-- Returns a score (0-100) indicating how complete the decision context is
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_data_completeness(case_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  max_points INTEGER := 100;
  case_record RECORD;
BEGIN
  SELECT * INTO case_record FROM clinical_cases WHERE id = case_uuid;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Basic info (20 points)
  IF case_record.title IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.chief_complaint IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.patient_age_range IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.patient_sex IS NOT NULL THEN total_points := total_points + 5; END IF;

  -- Patient constraints (20 points)
  IF case_record.patient_priorities IS NOT NULL AND array_length(case_record.patient_priorities, 1) > 0 THEN
    total_points := total_points + 10;
  END IF;
  IF case_record.budget_constraint IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.dental_anxiety IS NOT NULL THEN total_points := total_points + 5; END IF;

  -- Risk factors (20 points)
  IF case_record.smoking_status IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.diabetes_control IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.bruxism IS NOT NULL THEN total_points := total_points + 5; END IF;
  IF case_record.perio_stage IS NOT NULL THEN total_points := total_points + 5; END IF;

  -- Clinical data (20 points)
  IF case_record.missing_teeth IS NOT NULL AND array_length(case_record.missing_teeth, 1) > 0 THEN
    total_points := total_points + 5;
  END IF;
  IF case_record.teeth_prognosis IS NOT NULL AND case_record.teeth_prognosis != '{}'::jsonb THEN
    total_points := total_points + 10;
  END IF;
  IF case_record.medical_history IS NOT NULL AND case_record.medical_history != '{}'::jsonb THEN
    total_points := total_points + 5;
  END IF;

  -- Sequences with rationale (20 points) - check if any sequences have good data
  IF EXISTS (
    SELECT 1 FROM treatment_sequences ts
    WHERE ts.case_id = case_uuid
    AND ts.global_rationale IS NOT NULL
  ) THEN
    total_points := total_points + 20;
  END IF;

  RETURN LEAST(total_points, max_points);
END;
$$ LANGUAGE plpgsql;
