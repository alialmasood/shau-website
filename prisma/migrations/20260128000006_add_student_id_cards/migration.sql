-- CreateTable
CREATE TABLE IF NOT EXISTS "student_id_cards" (
  "serial" VARCHAR(50) PRIMARY KEY,
  "name_ar" VARCHAR(200) NOT NULL,
  "name_en" VARCHAR(200) NOT NULL,
  "dob" DATE NOT NULL,
  "address" VARCHAR(300) NOT NULL,
  "blood_type" VARCHAR(10) NOT NULL,
  "department" VARCHAR(200) NOT NULL,
  "stage" VARCHAR(50) NOT NULL,
  "expiry_date" DATE NOT NULL,
  "photo_media_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- AddForeignKey
ALTER TABLE "student_id_cards"
  ADD CONSTRAINT "student_id_cards_photo_media_id_fkey"
  FOREIGN KEY ("photo_media_id") REFERENCES "media"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- Indexes
CREATE INDEX IF NOT EXISTS "student_id_cards_department_idx" ON "student_id_cards" ("department");
CREATE INDEX IF NOT EXISTS "student_id_cards_stage_idx" ON "student_id_cards" ("stage");
