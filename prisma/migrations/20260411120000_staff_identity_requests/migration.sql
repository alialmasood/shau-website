-- طلبات هوية الكادر الأكاديمي
CREATE TABLE IF NOT EXISTS staff_identity_requests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    academic_title VARCHAR(120),
    workplace VARCHAR(200) NOT NULL,
    position VARCHAR(120),
    phone VARCHAR(30) NOT NULL,
    university_email VARCHAR(120) NOT NULL,
    photo_media_id UUID,
    locale VARCHAR(10),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staff_identity_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS staff_identity_requests_created_at_idx ON staff_identity_requests (created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'staff_identity_requests_photo_media_id_fkey'
    ) THEN
        ALTER TABLE staff_identity_requests
        ADD CONSTRAINT staff_identity_requests_photo_media_id_fkey
        FOREIGN KEY (photo_media_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- صفحة الإدارة (صلاحيات RBAC)
INSERT INTO admin_pages (code, name_ar, name_en, created_at, updated_at)
VALUES ('staff-identity', 'هويات الكادر', 'Staff identity requests', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  updated_at = NOW();
