-- إضافة حالة «منجز» لطلبات قاعة المؤتمرات
ALTER TABLE conference_hall_requests
  DROP CONSTRAINT IF EXISTS conference_hall_requests_status_chk;

ALTER TABLE conference_hall_requests
  ADD CONSTRAINT conference_hall_requests_status_chk CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')
  );
