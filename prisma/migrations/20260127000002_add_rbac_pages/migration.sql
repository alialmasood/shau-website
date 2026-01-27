-- إنشاء جدول admin_pages
CREATE TABLE IF NOT EXISTS admin_pages (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_pages_pkey PRIMARY KEY (id)
);

-- إنشاء جدول admin_page_permissions
CREATE TABLE IF NOT EXISTS admin_page_permissions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL,
    page_id UUID NOT NULL,
    can_access BOOLEAN NOT NULL DEFAULT false,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_upload BOOLEAN NOT NULL DEFAULT false,
    can_export BOOLEAN NOT NULL DEFAULT false,
    can_publish BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_page_permissions_pkey PRIMARY KEY (id)
);

-- إضافة unique constraint على code في admin_pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_pages_code_key'
    ) THEN
        ALTER TABLE admin_pages ADD CONSTRAINT admin_pages_code_key UNIQUE (code);
    END IF;
END $$;

-- إضافة unique constraint على admin_user_id + page_id في admin_page_permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_page_permissions_admin_user_id_page_id_key'
    ) THEN
        ALTER TABLE admin_page_permissions ADD CONSTRAINT admin_page_permissions_admin_user_id_page_id_key UNIQUE (admin_user_id, page_id);
    END IF;
END $$;

-- إضافة foreign key من admin_page_permissions إلى admin_users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_page_permissions_admin_user_id_fkey'
    ) THEN
        ALTER TABLE admin_page_permissions ADD CONSTRAINT admin_page_permissions_admin_user_id_fkey 
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة foreign key من admin_page_permissions إلى admin_pages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_page_permissions_page_id_fkey'
    ) THEN
        ALTER TABLE admin_page_permissions ADD CONSTRAINT admin_page_permissions_page_id_fkey 
        FOREIGN KEY (page_id) REFERENCES admin_pages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة indexes
CREATE INDEX IF NOT EXISTS admin_pages_code_idx ON admin_pages(code);
CREATE INDEX IF NOT EXISTS admin_page_permissions_admin_user_id_idx ON admin_page_permissions(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_page_permissions_page_id_idx ON admin_page_permissions(page_id);
