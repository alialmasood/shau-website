-- دعم اختيار أكثر من قسم لكل طلب
ALTER TABLE conference_hall_requests
  ADD COLUMN IF NOT EXISTS department_keys TEXT[] NOT NULL DEFAULT '{}';

UPDATE conference_hall_requests
SET department_keys = ARRAY[department_key]
WHERE (department_keys IS NULL OR cardinality(department_keys) = 0)
  AND department_key IS NOT NULL
  AND TRIM(department_key) <> '';
