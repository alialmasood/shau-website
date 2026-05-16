-- رقم هوية الكادر (SH + 8 أرقام، غير تسلسلي)
ALTER TABLE staff_identity_requests
  ADD COLUMN IF NOT EXISTS identity_number VARCHAR(10);

CREATE UNIQUE INDEX IF NOT EXISTS staff_identity_requests_identity_number_idx
  ON staff_identity_requests (identity_number)
  WHERE identity_number IS NOT NULL;
