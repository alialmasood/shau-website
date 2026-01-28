-- إضافة study_type وclearance fields إلى students
ALTER TABLE "students" 
ADD COLUMN IF NOT EXISTS "study_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "clearance_updated_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "clearance_updated_by" UUID;

-- إضافة foreign key لـ clearance_updated_by
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_clearance_updated_by_fkey') THEN
        ALTER TABLE "students" 
        ADD CONSTRAINT "students_clearance_updated_by_fkey" 
        FOREIGN KEY ("clearance_updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- إضافة index لـ study_type
CREATE INDEX IF NOT EXISTS "students_department_stage_study_type_year_semester_idx" 
ON "students"("department_code", "stage", "study_type", "academic_year", "semester");

-- إضافة study_type وmeta_subjects_json إلى results_batches
ALTER TABLE "results_batches"
ADD COLUMN IF NOT EXISTS "study_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "meta_subjects_json" JSONB;

-- تحديث index لـ results_batches
DROP INDEX IF EXISTS "results_batches_department_year_semester_stage_attempt_idx";
CREATE INDEX IF NOT EXISTS "results_batches_department_year_semester_stage_study_type_attempt_idx" 
ON "results_batches"("department_code", "academic_year", "semester", "stage", "study_type", "attempt");

-- إضافة study_type وتغيير بنية JSON في results
ALTER TABLE "results"
ADD COLUMN IF NOT EXISTS "study_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "summary_json" JSONB,
ADD COLUMN IF NOT EXISTS "subjects_json" JSONB,
ADD COLUMN IF NOT EXISTS "raw_row_json" JSONB;

-- نسخ البيانات من payload_json إلى summary_json وsubjects_json إذا كانت موجودة
-- (سنترك payload_json للتوافق مع البيانات القديمة)
UPDATE "results" 
SET "summary_json" = "payload_json",
    "subjects_json" = '[]'::jsonb
WHERE "summary_json" IS NULL AND "payload_json" IS NOT NULL;

-- حذف unique constraint القديم وإضافة واحد جديد يتضمن study_type
ALTER TABLE "results" DROP CONSTRAINT IF EXISTS "results_student_id_department_code_academic_year_semester_stage_attempt_key";
CREATE UNIQUE INDEX IF NOT EXISTS "results_unique_idx" 
ON "results"("student_id", "department_code", "stage", "study_type", "academic_year", "semester", "attempt");

-- تحديث indexes
DROP INDEX IF EXISTS "results_department_year_semester_stage_attempt_idx";
CREATE INDEX IF NOT EXISTS "results_department_year_semester_stage_study_type_attempt_idx" 
ON "results"("department_code", "academic_year", "semester", "stage", "study_type", "attempt");
