-- Migration: Fix plan number generation trigger
-- The previous trigger had a bug with SUBSTRING extraction

CREATE OR REPLACE FUNCTION generate_plan_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_plan_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  -- Get the max sequence number for this year
  -- Format is PLAN-YYYY-NNNN, so we extract the last 4 characters
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(plan_number FROM LENGTH('PLAN-' || year_part || '-') + 1)
        AS INTEGER
      )
    ),
    0
  ) + 1
  INTO seq_num
  FROM treatment_plans
  WHERE plan_number LIKE 'PLAN-' || year_part || '-%';

  new_plan_number := 'PLAN-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');

  -- Safety check: if this number already exists (race condition), increment
  WHILE EXISTS (SELECT 1 FROM treatment_plans WHERE plan_number = new_plan_number) LOOP
    seq_num := seq_num + 1;
    new_plan_number := 'PLAN-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  END LOOP;

  NEW.plan_number := new_plan_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
