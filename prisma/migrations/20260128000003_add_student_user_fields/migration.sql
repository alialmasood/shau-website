-- إضافة must_change_password و last_login_at إلى student_users
ALTER TABLE "student_users"
ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ(6);
