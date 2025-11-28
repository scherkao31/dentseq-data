-- ============================================================================
-- DENTAL SEQUENCE DATA WEBAPP - DATABASE SCHEMA
-- Version: 1.0.0
-- Target: Supabase (PostgreSQL)
-- Language: French UI, English technical
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS (Controlled vocabularies)
-- ============================================================================

-- Patient demographics
CREATE TYPE age_range AS ENUM ('18-30', '31-45', '46-60', '61-75', '75+');
CREATE TYPE sex AS ENUM ('male', 'female', 'other');
CREATE TYPE general_health AS ENUM ('healthy', 'compromised', 'severely_compromised');
CREATE TYPE asa_classification AS ENUM ('I', 'II', 'III', 'IV', 'V', 'VI');

-- Clinical
CREATE TYPE severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE prognosis AS ENUM ('excellent', 'good', 'fair', 'questionable', 'hopeless');
CREATE TYPE mobility_grade AS ENUM ('0', '1', '2', '3');
CREATE TYPE furcation_grade AS ENUM ('0', 'I', 'II', 'III');
CREATE TYPE oral_hygiene AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE compliance AS ENUM ('high', 'moderate', 'low');
CREATE TYPE anxiety_level AS ENUM ('none', 'mild', 'moderate', 'severe');
CREATE TYPE priority_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE complexity AS ENUM ('simple', 'moderate', 'complex', 'highly_complex');

-- Periodontal (2017 Classification)
CREATE TYPE perio_stage AS ENUM ('I', 'II', 'III', 'IV');
CREATE TYPE perio_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE perio_stability AS ENUM ('stable', 'unstable');

-- Treatment
CREATE TYPE treatment_category AS ENUM (
  'diagnostic', 'preventive', 'restorative', 'endodontic',
  'periodontal', 'surgical', 'implant', 'prosthetic', 'orthodontic', 'other'
);
CREATE TYPE appointment_type AS ENUM ('emergency', 'diagnostic', 'treatment', 'review', 'maintenance');
CREATE TYPE delay_unit AS ENUM ('days', 'weeks', 'months');
CREATE TYPE confidence_level AS ENUM ('high', 'moderate', 'low');

-- Workflow
CREATE TYPE case_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE sequence_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'needs_revision');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- DENTISTS (Users)
CREATE TABLE dentists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,

  -- Credentials
  title TEXT,
  institution TEXT DEFAULT 'Université de Genève',
  department TEXT,
  years_experience INTEGER,
  specializations TEXT[],

  -- Research
  orcid_id TEXT,

  -- Consent (GDPR)
  consent_research BOOLEAN DEFAULT false,
  consent_data_processing BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Supabase Auth link
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- CLINICAL CASES
CREATE TABLE clinical_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Creator tracking
  created_by UUID REFERENCES dentists(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES dentists(id) ON DELETE SET NULL,

  -- Case identification
  case_number TEXT UNIQUE,
  title TEXT NOT NULL,

  -- Patient (anonymized)
  patient_age_range age_range,
  patient_sex sex,
  patient_general_health general_health,

  -- Medical history (JSONB for flexibility)
  medical_history JSONB DEFAULT '{
    "conditions": [],
    "medications": [],
    "allergies": [],
    "asa_classification": null,
    "notes": ""
  }'::jsonb,

  -- Chief complaint
  chief_complaint TEXT NOT NULL,
  chief_complaint_symptoms TEXT[],
  chief_complaint_location TEXT[],
  chief_complaint_duration TEXT,
  chief_complaint_severity severity,

  -- Dental findings (JSONB array)
  dental_findings JSONB DEFAULT '[]'::jsonb,

  -- Missing teeth
  missing_teeth TEXT[] DEFAULT '{}',

  -- Radiographic findings
  radiographic_findings TEXT,

  -- Periodontal status
  perio_diagnosis TEXT,
  perio_stage perio_stage,
  perio_grade perio_grade,
  perio_stability perio_stability,

  -- Occlusion
  occlusion_classification TEXT,
  occlusion_issues TEXT[],

  -- Patient factors
  patient_oral_hygiene oral_hygiene,
  patient_compliance compliance,
  patient_anxiety anxiety_level,
  patient_aesthetic_priority priority_level,
  patient_has_financial_constraints BOOLEAN DEFAULT false,
  patient_has_time_constraints BOOLEAN DEFAULT false,

  -- Case metadata
  complexity complexity,
  additional_notes TEXT,

  -- Workflow
  status case_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector TSVECTOR
);

-- TREATMENT SEQUENCES
CREATE TABLE treatment_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  created_by UUID REFERENCES dentists(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES dentists(id) ON DELETE SET NULL,

  -- Sequence identification
  sequence_number TEXT,
  title TEXT,

  -- Overall strategy
  overall_strategy TEXT,
  treatment_goals TEXT[],

  -- Constraints & considerations
  constraints_considered JSONB DEFAULT '[]'::jsonb,
  alternatives_considered JSONB DEFAULT '[]'::jsonb,

  -- Expected outcomes
  expected_prognosis prognosis,
  expected_duration_months INTEGER,
  success_criteria TEXT,

  -- Workflow
  status sequence_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENT GROUPS
CREATE TABLE appointment_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  sequence_id UUID NOT NULL REFERENCES treatment_sequences(id) ON DELETE CASCADE,

  -- Position in sequence
  position INTEGER NOT NULL,

  -- Appointment info
  title TEXT,
  appointment_type appointment_type DEFAULT 'treatment',
  estimated_duration_minutes INTEGER,

  -- Timing
  delay_value INTEGER,
  delay_unit delay_unit,
  delay_is_flexible BOOLEAN DEFAULT true,
  delay_min INTEGER,
  delay_max INTEGER,
  delay_rationale TEXT,

  -- Session info
  objectives TEXT[],
  prerequisites TEXT[],
  clinical_notes TEXT,
  patient_instructions TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique position per sequence
  UNIQUE(sequence_id, position)
);

-- TREATMENTS
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  appointment_group_id UUID NOT NULL REFERENCES appointment_groups(id) ON DELETE CASCADE,

  -- Position within appointment
  position INTEGER NOT NULL,

  -- Treatment identification
  treatment_type TEXT NOT NULL,
  treatment_category treatment_category NOT NULL,
  custom_name TEXT,

  -- Coding
  ada_code TEXT,

  -- Location
  teeth TEXT[] NOT NULL,
  surfaces TEXT[],

  -- Details
  material TEXT,
  technique TEXT,
  specifications TEXT,

  -- Clinical rationale (THE GOLD DATA)
  rationale_treatment TEXT,
  rationale_timing TEXT,
  rationale_teeth TEXT,
  evidence_references TEXT[],
  confidence confidence_level DEFAULT 'high',

  -- Contingency
  contingency_condition TEXT,
  contingency_action TEXT,

  -- Estimates
  estimated_duration_minutes INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique position per appointment
  UNIQUE(appointment_group_id, position)
);

-- SEQUENCE EVALUATIONS
CREATE TABLE sequence_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  sequence_id UUID NOT NULL REFERENCES treatment_sequences(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES dentists(id) ON DELETE SET NULL,

  -- Scores (1-5)
  score_clinical_validity INTEGER CHECK (score_clinical_validity BETWEEN 1 AND 5),
  score_completeness INTEGER CHECK (score_completeness BETWEEN 1 AND 5),
  score_sequencing INTEGER CHECK (score_sequencing BETWEEN 1 AND 5),
  score_feasibility INTEGER CHECK (score_feasibility BETWEEN 1 AND 5),
  score_overall INTEGER CHECK (score_overall BETWEEN 1 AND 5),

  -- Comments
  strengths TEXT,
  weaknesses TEXT,
  suggestions TEXT,
  general_comments TEXT,

  -- Decision
  recommendation TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One evaluation per evaluator per sequence
  UNIQUE(sequence_id, evaluator_id)
);

-- ACTIVITY LOG
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who
  dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL,
  dentist_name TEXT,

  -- What
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Details
  changes JSONB,
  metadata JSONB,

  -- When
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Case overview with stats
CREATE VIEW case_overview AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.status,
  c.complexity,
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

-- Sequence overview with stats
CREATE VIEW sequence_overview AS
SELECT
  s.id,
  s.sequence_number,
  s.title,
  s.status,
  s.case_id,
  c.case_number,
  c.title AS case_title,
  s.created_at,
  s.updated_at,
  creator.full_name AS created_by_name,
  modifier.full_name AS last_modified_by_name,
  COUNT(DISTINCT ag.id) AS appointment_count,
  COUNT(DISTINCT t.id) AS treatment_count,
  COUNT(DISTINCT e.id) AS evaluation_count,
  COALESCE(AVG(e.score_overall), 0) AS avg_score,
  COALESCE(AVG(e.score_clinical_validity), 0) AS avg_clinical_validity,
  COALESCE(AVG(e.score_completeness), 0) AS avg_completeness,
  COALESCE(AVG(e.score_sequencing), 0) AS avg_sequencing,
  COALESCE(AVG(e.score_feasibility), 0) AS avg_feasibility
FROM treatment_sequences s
JOIN clinical_cases c ON s.case_id = c.id
LEFT JOIN dentists creator ON s.created_by = creator.id
LEFT JOIN dentists modifier ON s.last_modified_by = modifier.id
LEFT JOIN appointment_groups ag ON ag.sequence_id = s.id
LEFT JOIN treatments t ON t.appointment_group_id = ag.id
LEFT JOIN sequence_evaluations e ON e.sequence_id = s.id
GROUP BY s.id, c.case_number, c.title, creator.full_name, modifier.full_name;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_cases_status ON clinical_cases(status);
CREATE INDEX idx_cases_created_by ON clinical_cases(created_by);
CREATE INDEX idx_cases_created_at ON clinical_cases(created_at DESC);
CREATE INDEX idx_cases_search ON clinical_cases USING GIN(search_vector);

CREATE INDEX idx_sequences_case ON treatment_sequences(case_id);
CREATE INDEX idx_sequences_status ON treatment_sequences(status);
CREATE INDEX idx_sequences_created_by ON treatment_sequences(created_by);

CREATE INDEX idx_appointments_sequence ON appointment_groups(sequence_id);
CREATE INDEX idx_treatments_appointment ON treatments(appointment_group_id);
CREATE INDEX idx_evaluations_sequence ON sequence_evaluations(sequence_id);

CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_dentist ON activity_log(dentist_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dentists_updated_at
  BEFORE UPDATE ON dentists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON clinical_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON treatment_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointment_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM clinical_cases
  WHERE case_number LIKE 'CASE-' || year_part || '-%';

  NEW.case_number := 'CASE-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_case_number_trigger
  BEFORE INSERT ON clinical_cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION generate_case_number();

-- Auto-generate sequence numbers
CREATE OR REPLACE FUNCTION generate_sequence_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(sequence_number FROM 9) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM treatment_sequences
  WHERE sequence_number LIKE 'SEQ-' || year_part || '-%';

  NEW.sequence_number := 'SEQ-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sequence_number_trigger
  BEFORE INSERT ON treatment_sequences
  FOR EACH ROW
  WHEN (NEW.sequence_number IS NULL)
  EXECUTE FUNCTION generate_sequence_number();

-- Update search vector
CREATE OR REPLACE FUNCTION update_case_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.chief_complaint, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.additional_notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_case_search_trigger
  BEFORE INSERT OR UPDATE ON clinical_cases
  FOR EACH ROW EXECUTE FUNCTION update_case_search_vector();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to do everything (MVP)
CREATE POLICY "Allow all for authenticated users" ON dentists
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON clinical_cases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON treatment_sequences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON appointment_groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON treatments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON sequence_evaluations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON activity_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTION: Create dentist profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dentists (auth_user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
