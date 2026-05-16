-- طلبات هوية الموظف (بكالوريوس فما دون)
CREATE TABLE IF NOT EXISTS employee_identity_requests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    address VARCHAR(300) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    blood_type VARCHAR(10) NOT NULL,
    workplace VARCHAR(200) NOT NULL,
    job_category VARCHAR(20) NOT NULL,
    position VARCHAR(120),
    official_email VARCHAR(120),
    photo_media_id UUID,
    locale VARCHAR(10),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_identity_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS employee_identity_requests_created_at_idx ON employee_identity_requests (created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'employee_identity_requests_photo_media_id_fkey'
    ) THEN
        ALTER TABLE employee_identity_requests
        ADD CONSTRAINT employee_identity_requests_photo_media_id_fkey
        FOREIGN KEY (photo_media_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

INSERT INTO admin_pages (code, name_ar, name_en, created_at, updated_at)
VALUES ('employee-identity', 'هويات الموظفين', 'Employee identity requests', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  updated_at = NOW();
