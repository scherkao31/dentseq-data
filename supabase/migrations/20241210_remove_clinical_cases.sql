-- Migration: Remove deprecated clinical_cases infrastructure
-- We now use treatment_plans instead of clinical_cases

-- Step 1: Drop the case_overview view (depends on clinical_cases)
DROP VIEW IF EXISTS case_overview;

-- Step 2: Remove foreign key constraints from treatment_sequences
ALTER TABLE treatment_sequences
DROP CONSTRAINT IF EXISTS treatment_sequences_case_id_fkey;

-- Step 3: Remove foreign key constraints from treatment_alternatives
ALTER TABLE treatment_alternatives
DROP CONSTRAINT IF EXISTS treatment_alternatives_case_id_fkey;

-- Step 4: Make case_id nullable in treatment_sequences
ALTER TABLE treatment_sequences
ALTER COLUMN case_id DROP NOT NULL;

-- Step 5: Make case_id nullable in treatment_alternatives (if it exists and has NOT NULL)
ALTER TABLE treatment_alternatives
ALTER COLUMN case_id DROP NOT NULL;

-- Step 6: Set all case_id values to NULL (clean break)
UPDATE treatment_sequences SET case_id = NULL WHERE case_id IS NOT NULL;
UPDATE treatment_alternatives SET case_id = NULL WHERE case_id IS NOT NULL;

-- Step 7: Drop the clinical_cases table (CASCADE to handle any remaining dependencies)
DROP TABLE IF EXISTS clinical_cases CASCADE;

-- Step 8: Add comment to clarify the new structure
COMMENT ON TABLE treatment_sequences IS 'Treatment sequences linked to treatment_plans via plan_id. The case_id column is deprecated and will be removed in a future migration.';
