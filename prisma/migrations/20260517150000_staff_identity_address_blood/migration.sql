-- عنوان السكن وفصيلة الدم لطلبات هوية الكادر
ALTER TABLE staff_identity_requests
  ADD COLUMN IF NOT EXISTS address VARCHAR(300) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10) NOT NULL DEFAULT '';
