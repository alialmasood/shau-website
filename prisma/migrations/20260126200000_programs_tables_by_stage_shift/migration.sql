-- جداول المحاضرات والامتحانات حسب المرحلة (1-4) ونوع الدراسة (صباحي/مسائي)
-- كل عنصر: { "stage": 1|2|3|4, "shift": "morning"|"evening", "image_id": "uuid"|null, "html_ar": "..."|null, "html_en": "..."|null }

ALTER TABLE "programs" ADD COLUMN "lectures_tables" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "programs" ADD COLUMN "exams_tables" JSONB NOT NULL DEFAULT '[]';

-- ترحيل بيانات القديمة إن وُجدت: عمود واحد → عنصر واحد (المرحلة 1، صباحي)
UPDATE "programs" SET
  "lectures_tables" = jsonb_build_array(
    jsonb_build_object(
      'stage', 1,
      'shift', 'morning',
      'image_id', "lectures_image_id",
      'html_ar', "lectures_table_ar",
      'html_en', "lectures_table_en"
    )
  )
WHERE ("lectures_image_id" IS NOT NULL OR "lectures_table_ar" IS NOT NULL OR "lectures_table_en" IS NOT NULL)
  AND (COALESCE("lectures_tables", '[]'::jsonb) = '[]'::jsonb);

UPDATE "programs" SET
  "exams_tables" = jsonb_build_array(
    jsonb_build_object(
      'stage', 1,
      'shift', 'morning',
      'image_id', "exams_image_id",
      'html_ar', "exams_table_ar",
      'html_en', "exams_table_en"
    )
  )
WHERE ("exams_image_id" IS NOT NULL OR "exams_table_ar" IS NOT NULL OR "exams_table_en" IS NOT NULL)
  AND (COALESCE("exams_tables", '[]'::jsonb) = '[]'::jsonb);

-- إسقاط القيود المرجعية ثم الأعمدة القديمة
ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_lectures_image_id_fkey";
ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "programs_exams_image_id_fkey";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "lectures_image_id";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "lectures_table_ar";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "lectures_table_en";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "exams_image_id";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "exams_table_ar";
ALTER TABLE "programs" DROP COLUMN IF EXISTS "exams_table_en";
