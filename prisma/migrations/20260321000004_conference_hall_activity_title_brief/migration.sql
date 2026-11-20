-- عنوان ونبذة النشاط لطلبات قاعة المؤتمرات
ALTER TABLE conference_hall_requests
  ADD COLUMN IF NOT EXISTS activity_title TEXT NOT NULL DEFAULT '';

ALTER TABLE conference_hall_requests
  ADD COLUMN IF NOT EXISTS activity_brief TEXT NOT NULL DEFAULT '';
