-- طلبات حجز قاعة المؤتمرات / إقامة نشاط (موافقة الشؤون العلمية)
CREATE TABLE IF NOT EXISTS conference_hall_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_key TEXT NOT NULL,
  department_keys TEXT[] NOT NULL DEFAULT '{}',
  department_name_ar TEXT NOT NULL,
  department_name_en TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL,
  study_type TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  organizers TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conference_hall_requests_dates_chk CHECK (date_to >= date_from),
  CONSTRAINT conference_hall_requests_stage_chk CHECK (
    stage IN ('first', 'second', 'third', 'fourth', 'all')
  ),
  CONSTRAINT conference_hall_requests_study_chk CHECK (
    study_type IN ('morning', 'evening', 'both')
  ),
  CONSTRAINT conference_hall_requests_activity_chk CHECK (
    activity_type IN (
      'conference',
      'seminar',
      'workshop',
      'scientific_visit',
      'student_scientific',
      'scientific_festival'
    )
  ),
  CONSTRAINT conference_hall_requests_status_chk CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')
  )
);

CREATE INDEX IF NOT EXISTS idx_conference_hall_requests_dates
  ON conference_hall_requests (date_from, date_to);

CREATE INDEX IF NOT EXISTS idx_conference_hall_requests_status
  ON conference_hall_requests (status);

CREATE INDEX IF NOT EXISTS idx_conference_hall_requests_created
  ON conference_hall_requests (created_at DESC);
