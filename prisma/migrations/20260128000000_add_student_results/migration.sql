-- إضافة قيم جديدة لـ AdminRole enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXAM_COMMITTEE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE 'EXAM_COMMITTEE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ACCOUNTS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE 'ACCOUNTS';
    END IF;
END $$;

-- إنشاء جدول students
CREATE TABLE IF NOT EXISTS "students" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "student_id" VARCHAR(50) NOT NULL UNIQUE,
    "full_name" VARCHAR(200) NOT NULL,
    "department_code" VARCHAR(50) NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(50) NOT NULL,
    "financial_clearance" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_by" UUID
);

-- إنشاء جدول results_batches
CREATE TABLE IF NOT EXISTS "results_batches" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "department_code" VARCHAR(50) NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(50) NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "attempt" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "rows_count" INTEGER NOT NULL,
    "errors_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "created_by" UUID
);

-- إنشاء جدول results
CREATE TABLE IF NOT EXISTS "results" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "student_id" VARCHAR(50) NOT NULL,
    "department_code" VARCHAR(50) NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester" VARCHAR(50) NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "attempt" VARCHAR(50) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "uploaded_batch_id" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "uploaded_by" UUID,
    UNIQUE ("student_id", "department_code", "academic_year", "semester", "stage", "attempt")
);

-- إنشاء جدول student_users
CREATE TABLE IF NOT EXISTS "student_users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100) NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "student_id" VARCHAR(50) NOT NULL UNIQUE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- إضافة Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_updated_by_fkey') THEN
        ALTER TABLE "students" 
        ADD CONSTRAINT "students_updated_by_fkey" 
        FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_batches_created_by_fkey') THEN
        ALTER TABLE "results_batches" 
        ADD CONSTRAINT "results_batches_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_student_id_fkey') THEN
        ALTER TABLE "results" 
        ADD CONSTRAINT "results_student_id_fkey" 
        FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_uploaded_batch_id_fkey') THEN
        ALTER TABLE "results" 
        ADD CONSTRAINT "results_uploaded_batch_id_fkey" 
        FOREIGN KEY ("uploaded_batch_id") REFERENCES "results_batches"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_uploaded_by_fkey') THEN
        ALTER TABLE "results" 
        ADD CONSTRAINT "results_uploaded_by_fkey" 
        FOREIGN KEY ("uploaded_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_users_student_id_fkey') THEN
        ALTER TABLE "student_users" 
        ADD CONSTRAINT "student_users_student_id_fkey" 
        FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE;
    END IF;
END $$;

-- إضافة Indexes
CREATE INDEX IF NOT EXISTS "students_student_id_idx" ON "students"("student_id");
CREATE INDEX IF NOT EXISTS "students_department_stage_year_semester_idx" ON "students"("department_code", "stage", "academic_year", "semester");
CREATE INDEX IF NOT EXISTS "students_financial_clearance_idx" ON "students"("financial_clearance");

CREATE INDEX IF NOT EXISTS "results_student_id_idx" ON "results"("student_id");
CREATE INDEX IF NOT EXISTS "results_department_year_semester_stage_attempt_idx" ON "results"("department_code", "academic_year", "semester", "stage", "attempt");
CREATE INDEX IF NOT EXISTS "results_uploaded_batch_id_idx" ON "results"("uploaded_batch_id");

CREATE INDEX IF NOT EXISTS "results_batches_department_year_semester_stage_attempt_idx" ON "results_batches"("department_code", "academic_year", "semester", "stage", "attempt");
CREATE INDEX IF NOT EXISTS "results_batches_created_at_idx" ON "results_batches"("created_at");

CREATE INDEX IF NOT EXISTS "student_users_student_id_idx" ON "student_users"("student_id");
CREATE INDEX IF NOT EXISTS "student_users_username_idx" ON "student_users"("username");
