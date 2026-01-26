-- إضافة الأعمدة الجديدة لجدول admin_users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'full_name') THEN
        ALTER TABLE "admin_users" ADD COLUMN "full_name" VARCHAR(200);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'custom_url') THEN
        ALTER TABLE "admin_users" ADD COLUMN "custom_url" VARCHAR(200);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE "admin_users" ADD COLUMN "is_active" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- تحديث enum AdminRole
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN
        CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'MANAGER', 'EDITOR', 'VIEWER');
    ELSE
        -- إضافة القيم الجديدة إذا لم تكن موجودة
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MANAGER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
            ALTER TYPE "AdminRole" ADD VALUE 'MANAGER';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EDITOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
            ALTER TYPE "AdminRole" ADD VALUE 'EDITOR';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VIEWER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
            ALTER TYPE "AdminRole" ADD VALUE 'VIEWER';
        END IF;
    END IF;
END $$;

-- إنشاء جدول admin_permissions
CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" VARCHAR(500),
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- إنشاء جدول admin_user_permissions
CREATE TABLE IF NOT EXISTS "admin_user_permissions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "admin_user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    UNIQUE ("admin_user_id", "permission_id")
);

-- إضافة Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_user_permissions_admin_user_id_fkey'
    ) THEN
        ALTER TABLE "admin_user_permissions" 
        ADD CONSTRAINT "admin_user_permissions_admin_user_id_fkey" 
        FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'admin_user_permissions_permission_id_fkey'
    ) THEN
        ALTER TABLE "admin_user_permissions" 
        ADD CONSTRAINT "admin_user_permissions_permission_id_fkey" 
        FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- إضافة Indexes
CREATE INDEX IF NOT EXISTS "admin_permissions_resource_idx" ON "admin_permissions"("resource");
CREATE INDEX IF NOT EXISTS "admin_permissions_action_idx" ON "admin_permissions"("action");
CREATE INDEX IF NOT EXISTS "admin_user_permissions_admin_user_id_idx" ON "admin_user_permissions"("admin_user_id");
CREATE INDEX IF NOT EXISTS "admin_user_permissions_permission_id_idx" ON "admin_user_permissions"("permission_id");

-- إضافة الصلاحيات الأساسية
INSERT INTO "admin_permissions" ("name", "description", "resource", "action") VALUES
    ('news.create', 'إنشاء أخبار جديدة', 'news', 'create'),
    ('news.read', 'قراءة الأخبار', 'news', 'read'),
    ('news.update', 'تعديل الأخبار', 'news', 'update'),
    ('news.delete', 'حذف الأخبار', 'news', 'delete'),
    ('news.manage', 'إدارة كاملة للأخبار', 'news', 'manage'),
    
    ('programs.create', 'إنشاء برامج جديدة', 'programs', 'create'),
    ('programs.read', 'قراءة البرامج', 'programs', 'read'),
    ('programs.update', 'تعديل البرامج', 'programs', 'update'),
    ('programs.delete', 'حذف البرامج', 'programs', 'delete'),
    ('programs.manage', 'إدارة كاملة للبرامج', 'programs', 'manage'),
    
    ('applications.read', 'قراءة طلبات التقديم', 'applications', 'read'),
    ('applications.update', 'تعديل طلبات التقديم', 'applications', 'update'),
    ('applications.delete', 'حذف طلبات التقديم', 'applications', 'delete'),
    ('applications.manage', 'إدارة كاملة لطلبات التقديم', 'applications', 'manage'),
    
    ('registration.read', 'قراءة بيانات التسجيل', 'registration', 'read'),
    ('registration.update', 'تعديل بيانات التسجيل', 'registration', 'update'),
    ('registration.delete', 'حذف بيانات التسجيل', 'registration', 'delete'),
    ('registration.manage', 'إدارة كاملة لبيانات التسجيل', 'registration', 'manage'),
    
    ('users.create', 'إنشاء مستخدمين جدد', 'users', 'create'),
    ('users.read', 'قراءة بيانات المستخدمين', 'users', 'read'),
    ('users.update', 'تعديل بيانات المستخدمين', 'users', 'update'),
    ('users.delete', 'حذف المستخدمين', 'users', 'delete'),
    ('users.manage', 'إدارة كاملة للمستخدمين', 'users', 'manage'),
    
    ('settings.read', 'قراءة الإعدادات', 'settings', 'read'),
    ('settings.update', 'تعديل الإعدادات', 'settings', 'update'),
    ('settings.manage', 'إدارة كاملة للإعدادات', 'settings', 'manage')
ON CONFLICT ("name") DO NOTHING;
