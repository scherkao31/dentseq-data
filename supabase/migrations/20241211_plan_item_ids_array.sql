-- Migration: Change plan_item_id from TEXT to TEXT[] (array)
-- Allows linking treatments to multiple plan items for ML traceability

-- Step 1: Add new column plan_item_ids as TEXT[]
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS plan_item_ids TEXT[];

-- Step 2: Migrate existing data - convert single plan_item_id to array
UPDATE treatments
SET plan_item_ids = ARRAY[plan_item_id]
WHERE plan_item_id IS NOT NULL AND plan_item_ids IS NULL;

-- Step 3: Set empty array as default for existing rows without plan_item_id
UPDATE treatments
SET plan_item_ids = '{}'
WHERE plan_item_ids IS NULL;

-- Step 4: Drop old column and index
DROP INDEX IF EXISTS idx_treatments_plan_item;
ALTER TABLE treatments DROP COLUMN IF EXISTS plan_item_id;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN treatments.plan_item_ids IS 'References to the original treatment_plan_item.id values (from the plan JSONB). Used for ML training data to track which plan items were scheduled in which appointments. Supports linking to multiple plan items.';

-- Step 6: Create GIN index for array queries (efficient for array contains queries)
CREATE INDEX IF NOT EXISTS idx_treatments_plan_item_ids ON treatments USING GIN(plan_item_ids) WHERE plan_item_ids IS NOT NULL AND array_length(plan_item_ids, 1) > 0;
