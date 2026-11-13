-- Optional literal ingredient detail on ONE existing parent medication row.
-- Apply separately through the authorized schema deployment process; no backfill.
BEGIN;

ALTER TABLE public.user_medications
  ADD COLUMN IF NOT EXISTS combination_ingredients jsonb;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.user_medications'::regclass
      AND attname = 'combination_ingredients'
      AND NOT attisdropped
      AND atttypid = 'jsonb'::regtype
  ) THEN
    RAISE EXCEPTION 'user_medications.combination_ingredients has an incompatible type; expected jsonb';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_medications'::regclass
      AND conname = 'user_medications_combination_ingredients_structure_check'
  ) THEN
    ALTER TABLE public.user_medications
      ADD CONSTRAINT user_medications_combination_ingredients_structure_check
      CHECK (
        combination_ingredients IS NULL
        OR CASE
          WHEN jsonb_typeof(combination_ingredients) = 'array'
            THEN jsonb_array_length(combination_ingredients) <= 20
          ELSE false
        END
      ) NOT VALID;
    -- Structural only. [] is accepted for older clients; new UI normalizes to NULL.
    -- CASE avoids calling array length on an object/scalar. NOT VALID avoids a
    -- scan of existing rows while constraining new/updated values. Frontend checks
    -- each explicit name, exact literal dosage, and optional catalog UUID.
  END IF;
END;
$migration$;

COMMENT ON COLUMN public.user_medications.combination_ingredients IS
  'Optional array (maximum 20) of {name: ingredient name, dosage: exact label strength, medication_id: selected catalog UUID or null}. NULL means single medication/no explicit ingredient detail. Unknown literal names remain unmatched, never inferred from old dosage text. Parent dosage/frequency and one-parent logging schedule remain unchanged; this is not dose aggregation or clinical clearance.';

NOTIFY pgrst, 'reload schema';
COMMIT;
