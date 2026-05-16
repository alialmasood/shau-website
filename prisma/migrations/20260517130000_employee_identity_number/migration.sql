-- رقم هوية الموظف (EM + 8 أرقام، غير تسلسلي)
ALTER TABLE employee_identity_requests
  ADD COLUMN IF NOT EXISTS identity_number VARCHAR(10);

CREATE UNIQUE INDEX IF NOT EXISTS employee_identity_requests_identity_number_idx
  ON employee_identity_requests (identity_number)
  WHERE identity_number IS NOT NULL;
