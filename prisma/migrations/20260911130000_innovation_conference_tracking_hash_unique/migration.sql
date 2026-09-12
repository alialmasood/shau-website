-- Unique constraint على hash رمز المتابعة لمؤتمر الابتكار
-- يمنع تكرار tracking_token_hash بين الطلبات

CREATE UNIQUE INDEX IF NOT EXISTS innovation_conference_applications_tracking_token_hash_uidx
  ON innovation_conference_applications (tracking_token_hash);
