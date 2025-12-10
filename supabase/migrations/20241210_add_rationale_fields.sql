-- Migration: Add rationale text fields to appointment_groups
-- These fields capture the dentist's reasoning for sequencing decisions

-- Rename delay_rationale to delay_reason (it's actually storing the structured delay reason code)
-- Then add new columns for free-text rationales

-- Step 1: Add delay_reason column (to store the structured reason code)
ALTER TABLE appointment_groups
ADD COLUMN IF NOT EXISTS delay_reason TEXT;

-- Step 2: Copy data from delay_rationale to delay_reason if any exists
UPDATE appointment_groups
SET delay_reason = delay_rationale
WHERE delay_rationale IS NOT NULL AND delay_reason IS NULL;

-- Step 3: Add delay_rationale_text column (free-text explanation of why this timing/order)
ALTER TABLE appointment_groups
ADD COLUMN IF NOT EXISTS delay_rationale_text TEXT;

-- Step 4: Add grouping_rationale column (free-text explanation of why treatments are grouped together)
ALTER TABLE appointment_groups
ADD COLUMN IF NOT EXISTS grouping_rationale TEXT;

-- Add comments for documentation
COMMENT ON COLUMN appointment_groups.delay_reason IS 'Structured delay reason code (e.g., healing, lab_work, patient_schedule)';
COMMENT ON COLUMN appointment_groups.delay_rationale_text IS 'Free-text rationale explaining why this appointment follows the previous at this timing/order';
COMMENT ON COLUMN appointment_groups.grouping_rationale IS 'Free-text rationale explaining why these treatments are grouped in the same appointment';
