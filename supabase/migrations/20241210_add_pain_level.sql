-- Migration: Add pain_level column to treatment_sequences
-- Replaces patient_priorities and dental_anxiety for simpler patient context

-- Create the pain_level enum type
DO $$ BEGIN
  CREATE TYPE pain_level AS ENUM ('none', 'mild', 'moderate', 'severe', 'acute');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add pain_level column to treatment_sequences
ALTER TABLE treatment_sequences
ADD COLUMN IF NOT EXISTS pain_level pain_level DEFAULT 'none';

-- Update age_range enum to include 'no_impact'
-- First, we need to add the new value to the enum
DO $$ BEGIN
  ALTER TYPE age_range ADD VALUE IF NOT EXISTS 'no_impact';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update sex enum to include 'no_impact'
DO $$ BEGIN
  ALTER TYPE sex ADD VALUE IF NOT EXISTS 'no_impact';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add comment to clarify the deprecation
COMMENT ON COLUMN treatment_sequences.patient_priorities IS 'DEPRECATED: No longer used in the UI. Kept for backward compatibility.';
COMMENT ON COLUMN treatment_sequences.dental_anxiety IS 'DEPRECATED: Replaced by pain_level. Kept for backward compatibility.';
COMMENT ON COLUMN treatment_sequences.pain_level IS 'Patient pain/sensitivity level: none, mild, moderate, severe, acute';
