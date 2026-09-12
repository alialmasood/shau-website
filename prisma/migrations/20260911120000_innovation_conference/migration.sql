-- مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026
-- طبقة بيانات التسجيل (بدون DRAFT)
-- ملاحظة: لا تُنفَّذ على Production إلا بأمر صريح.

-- ---------------------------------------------------------------------------
-- 1) نسخ المؤتمر
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_conference_editions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL,
  title_ar VARCHAR(250) NOT NULL,
  title_en VARCHAR(250),
  event_date DATE NOT NULL,
  is_registration_open BOOLEAN NOT NULL DEFAULT false,
  registration_opens_at TIMESTAMPTZ(6),
  registration_closes_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT innovation_conference_editions_pkey PRIMARY KEY (id),
  CONSTRAINT innovation_conference_editions_code_key UNIQUE (code)
);

CREATE UNIQUE INDEX IF NOT EXISTS innovation_conference_editions_code_uidx
  ON innovation_conference_editions (code);

-- ---------------------------------------------------------------------------
-- 2) طلبات المشاركة
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_conference_applications (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  edition_id UUID NOT NULL,
  participation_code VARCHAR(32) NOT NULL,
  tracking_token_hash VARCHAR(128) NOT NULL,

  -- مقدم الطلب (القائد)
  full_name VARCHAR(200) NOT NULL,
  birth_date DATE NOT NULL,
  gender VARCHAR(20),
  governorate VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(200) NOT NULL,
  applicant_role VARCHAR(40) NOT NULL,
  institution_name VARCHAR(250),
  stage_or_major VARCHAR(200),

  -- المشروع
  project_title VARCHAR(200) NOT NULL,
  innovation_field VARCHAR(40) NOT NULL,
  project_summary TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  novelty TEXT NOT NULL,
  beneficiaries TEXT NOT NULL,
  expected_impact TEXT NOT NULL,

  -- مشاركة / مرحلة
  participation_type VARCHAR(20) NOT NULL,
  project_stage VARCHAR(40) NOT NULL,

  -- مشاركات سابقة / ملكية فكرية
  shown_before BOOLEAN NOT NULL DEFAULT false,
  shown_before_details TEXT,
  patent_status VARCHAR(20) NOT NULL,
  patent_number VARCHAR(120),

  -- فيديو (رابط فقط)
  video_url VARCHAR(500),

  -- إقرارات
  consent_accuracy BOOLEAN NOT NULL,
  consent_ownership BOOLEAN NOT NULL,
  consent_terms BOOLEAN NOT NULL,
  consent_media BOOLEAN NOT NULL,
  consented_at TIMESTAMPTZ(6) NOT NULL,

  -- إدارة
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- metadata
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),

  CONSTRAINT innovation_conference_applications_pkey PRIMARY KEY (id),
  CONSTRAINT innovation_conference_applications_participation_code_key UNIQUE (participation_code),

  CONSTRAINT innovation_conference_applications_gender_check
    CHECK (gender IS NULL OR gender IN ('male', 'female')),
  CONSTRAINT innovation_conference_applications_applicant_role_check
    CHECK (applicant_role IN (
      'school_student',
      'university_student',
      'graduate',
      'researcher',
      'independent_innovator',
      'entrepreneur',
      'other'
    )),
  CONSTRAINT innovation_conference_applications_innovation_field_check
    CHECK (innovation_field IN (
      'medical_health',
      'ai_digital',
      'engineering_robotics',
      'energy_oil_gas',
      'environment_sustainability',
      'social_services',
      'entrepreneurship',
      'patents_inventions',
      'open_innovation'
    )),
  CONSTRAINT innovation_conference_applications_project_stage_check
    CHECK (project_stage IN (
      'advanced_idea',
      'prototype',
      'applicable_solution',
      'patent_related'
    )),
  CONSTRAINT innovation_conference_applications_participation_type_check
    CHECK (participation_type IN ('individual', 'team')),
  CONSTRAINT innovation_conference_applications_patent_status_check
    CHECK (patent_status IN ('none', 'pending', 'registered')),
  CONSTRAINT innovation_conference_applications_status_check
    CHECK (status IN (
      'SUBMITTED',
      'UNDER_REVIEW',
      'NEEDS_INFO',
      'SCIENTIFIC_REVIEW',
      'ACCEPTED',
      'REJECTED',
      'FINALIST',
      'WINNER',
      'WITHDRAWN'
    ))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_applications_edition_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_applications
      ADD CONSTRAINT innovation_conference_applications_edition_id_fkey
      FOREIGN KEY (edition_id) REFERENCES innovation_conference_editions(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS innovation_conference_applications_participation_code_uidx
  ON innovation_conference_applications (participation_code);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_edition_id_idx
  ON innovation_conference_applications (edition_id);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_status_idx
  ON innovation_conference_applications (status);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_email_idx
  ON innovation_conference_applications (email);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_phone_idx
  ON innovation_conference_applications (phone);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_created_at_idx
  ON innovation_conference_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS innovation_conference_applications_innovation_field_idx
  ON innovation_conference_applications (innovation_field);

-- ---------------------------------------------------------------------------
-- 3) أعضاء الفريق (بدون القائد — بحد أقصى 3 يُفرض في التطبيق)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_conference_team_members (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role_in_team VARCHAR(120),
  phone VARCHAR(30),
  email VARCHAR(200),
  birth_date DATE,
  institution_name VARCHAR(250),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT innovation_conference_team_members_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_team_members_application_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_team_members
      ADD CONSTRAINT innovation_conference_team_members_application_id_fkey
      FOREIGN KEY (application_id) REFERENCES innovation_conference_applications(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS innovation_conference_team_members_application_id_idx
  ON innovation_conference_team_members (application_id);

CREATE INDEX IF NOT EXISTS innovation_conference_team_members_sort_order_idx
  ON innovation_conference_team_members (application_id, sort_order);

-- ---------------------------------------------------------------------------
-- 4) المرفقات
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_conference_attachments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL,
  media_id UUID NOT NULL,
  kind VARCHAR(40) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT innovation_conference_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT innovation_conference_attachments_kind_check
    CHECK (kind IN ('project_image', 'project_pdf', 'patent_document', 'other'))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_attachments_application_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_attachments
      ADD CONSTRAINT innovation_conference_attachments_application_id_fkey
      FOREIGN KEY (application_id) REFERENCES innovation_conference_applications(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_attachments_media_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_attachments
      ADD CONSTRAINT innovation_conference_attachments_media_id_fkey
      FOREIGN KEY (media_id) REFERENCES media(id)
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS innovation_conference_attachments_application_id_idx
  ON innovation_conference_attachments (application_id);

CREATE INDEX IF NOT EXISTS innovation_conference_attachments_media_id_idx
  ON innovation_conference_attachments (media_id);

CREATE INDEX IF NOT EXISTS innovation_conference_attachments_application_kind_idx
  ON innovation_conference_attachments (application_id, kind);

-- ---------------------------------------------------------------------------
-- 5) سجل الحالات
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS innovation_conference_status_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by_admin_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT innovation_conference_status_logs_pkey PRIMARY KEY (id),
  CONSTRAINT innovation_conference_status_logs_to_status_check
    CHECK (to_status IN (
      'SUBMITTED',
      'UNDER_REVIEW',
      'NEEDS_INFO',
      'SCIENTIFIC_REVIEW',
      'ACCEPTED',
      'REJECTED',
      'FINALIST',
      'WINNER',
      'WITHDRAWN'
    )),
  CONSTRAINT innovation_conference_status_logs_from_status_check
    CHECK (
      from_status IS NULL OR from_status IN (
        'SUBMITTED',
        'UNDER_REVIEW',
        'NEEDS_INFO',
        'SCIENTIFIC_REVIEW',
        'ACCEPTED',
        'REJECTED',
        'FINALIST',
        'WINNER',
        'WITHDRAWN'
      )
    )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_status_logs_application_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_status_logs
      ADD CONSTRAINT innovation_conference_status_logs_application_id_fkey
      FOREIGN KEY (application_id) REFERENCES innovation_conference_applications(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- ربط اختياري بـ admin_users إن وُجد الجدول (متوافق مع البنية الحالية)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'admin_users'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'innovation_conference_status_logs_changed_by_admin_id_fkey'
  ) THEN
    ALTER TABLE innovation_conference_status_logs
      ADD CONSTRAINT innovation_conference_status_logs_changed_by_admin_id_fkey
      FOREIGN KEY (changed_by_admin_id) REFERENCES admin_users(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS innovation_conference_status_logs_application_id_idx
  ON innovation_conference_status_logs (application_id);

CREATE INDEX IF NOT EXISTS innovation_conference_status_logs_created_at_idx
  ON innovation_conference_status_logs (created_at DESC);
