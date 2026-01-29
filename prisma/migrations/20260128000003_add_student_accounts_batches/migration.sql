-- إنشاء جدول student_accounts_batches لتتبع استيرادات حسابات الطلاب
CREATE TABLE IF NOT EXISTS "student_accounts_batches" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "department_code" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_hash" VARCHAR(64), -- SHA-256 hash
    "rows_count" INTEGER NOT NULL,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "errors_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "created_by" UUID
);

-- إضافة Foreign Key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_accounts_batches_created_by_fkey') THEN
        ALTER TABLE "student_accounts_batches" 
        ADD CONSTRAINT "student_accounts_batches_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- إضافة indexes
CREATE INDEX IF NOT EXISTS "student_accounts_batches_department_code_idx" ON "student_accounts_batches"("department_code");
CREATE INDEX IF NOT EXISTS "student_accounts_batches_created_at_idx" ON "student_accounts_batches"("created_at");
CREATE INDEX IF NOT EXISTS "student_accounts_batches_file_hash_idx" ON "student_accounts_batches"("file_hash");

-- إضافة عمود uploaded_batch_id إلى student_users (اختياري - لتتبع من أي batch تم إنشاء الحساب)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_users' AND column_name = 'uploaded_batch_id') THEN
        ALTER TABLE "student_users" ADD COLUMN "uploaded_batch_id" UUID;
        ALTER TABLE "student_users" 
        ADD CONSTRAINT "student_users_uploaded_batch_id_fkey" 
        FOREIGN KEY ("uploaded_batch_id") REFERENCES "student_accounts_batches"("id") ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS "student_users_uploaded_batch_id_idx" ON "student_users"("uploaded_batch_id");
    END IF;
END $$;
