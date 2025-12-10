-- Migration: Add plan_item_id to treatments table
-- Links treatments in sequences back to the original plan items for ML traceability

-- Add plan_item_id column to treatments
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS plan_item_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN treatments.plan_item_id IS 'Reference to the original treatment_plan_item.id (from the plan JSONB). Used for ML training data to track which plan items were scheduled in which appointments.';

-- Index for querying treatments by plan_item
CREATE INDEX IF NOT EXISTS idx_treatments_plan_item ON treatments(plan_item_id) WHERE plan_item_id IS NOT NULL;
