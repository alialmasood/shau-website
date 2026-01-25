-- جدول طلبات التقديم (استمارة /apply)
CREATE TABLE IF NOT EXISTS "applications" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "full_name" VARCHAR(200) NOT NULL,
  "graduation_year" INTEGER NOT NULL,
  "school_name" VARCHAR(250) NOT NULL,
  "phone" VARCHAR(30) NOT NULL,
  "email" VARCHAR(200),
  "address" VARCHAR(500) NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "department_id" UUID NOT NULL,
  "study_type" VARCHAR(20) NOT NULL,
  "average" DECIMAL(5,2) NOT NULL,
  "total" DECIMAL(10,2),
  "notes" TEXT,
  "status" VARCHAR(30) NOT NULL DEFAULT 'new',
  "ip" VARCHAR(45),
  "user_agent" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- FK إلى department_fees (الأقسام النشطة)
ALTER TABLE "applications" ADD CONSTRAINT "applications_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "department_fees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "applications_department_id_idx" ON "applications"("department_id");
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "applications_created_at_idx" ON "applications"("created_at" DESC);
