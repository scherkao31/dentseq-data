-- Migration: Add order constraint fields to treatments
-- Tracks whether treatment order within an appointment is mandatory or flexible

-- Create the order_constraint enum type
DO $$ BEGIN
  CREATE TYPE order_constraint AS ENUM ('strict', 'preferred', 'flexible');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add order_constraint column to treatments (default: flexible)
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS order_constraint order_constraint DEFAULT 'flexible';

-- Add order_rationale column for explaining why the order matters
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS order_rationale TEXT;

-- Add comments for documentation
COMMENT ON COLUMN treatments.order_constraint IS 'Whether treatment order is strict (must follow), preferred (better but not required), or flexible (no clinical importance)';
COMMENT ON COLUMN treatments.order_rationale IS 'Free-text explanation of why this treatment must/should come in this order';
