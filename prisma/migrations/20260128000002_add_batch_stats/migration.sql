-- إضافة file_hash, imported_count, skipped_count إلى results_batches
ALTER TABLE "results_batches"
ADD COLUMN IF NOT EXISTS "file_hash" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "imported_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "skipped_count" INTEGER DEFAULT 0;

-- إضافة index لـ file_hash للبحث السريع
CREATE INDEX IF NOT EXISTS "results_batches_file_hash_idx" ON "results_batches"("file_hash");

-- تحديث القيم الموجودة
UPDATE "results_batches"
SET "imported_count" = "rows_count", "skipped_count" = 0
WHERE "imported_count" IS NULL OR "imported_count" = 0;
