-- دعم رفع صورة لجدول المحاضرات وجدول الامتحانات في برامج الكلية
ALTER TABLE "programs" ADD COLUMN "lectures_image_id" UUID;
ALTER TABLE "programs" ADD COLUMN "exams_image_id" UUID;

ALTER TABLE "programs" ADD CONSTRAINT "programs_lectures_image_id_fkey"
  FOREIGN KEY ("lectures_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "programs" ADD CONSTRAINT "programs_exams_image_id_fkey"
  FOREIGN KEY ("exams_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
