-- التحصيل العلمي لطلبات هوية الموظف
ALTER TABLE employee_identity_requests
  ADD COLUMN IF NOT EXISTS education_level VARCHAR(30);
