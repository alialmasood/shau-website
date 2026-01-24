-- AlterTable: إضافة أعمدة الترجمة الإنكليزية للخبر (اختيارية)
-- عند تركها فارغة، يُستخدم النص العربي في الواجهة الإنجليزية كاحتياطي.
ALTER TABLE "news" ADD COLUMN "title_en" VARCHAR(250),
ADD COLUMN "excerpt_en" VARCHAR(500),
ADD COLUMN "content_en" TEXT;
