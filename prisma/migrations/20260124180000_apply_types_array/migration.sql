-- تحويل نوع التقديم من قيمة واحدة إلى مصفوفة + حقول ربط منفصلة (داخلي، خارجي، واتساب)

-- 1) إضافة الأعمدة الجديدة
ALTER TABLE "department_fees" ADD COLUMN IF NOT EXISTS "apply_types" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "department_fees" ADD COLUMN IF NOT EXISTS "apply_url_external" VARCHAR(500);
ALTER TABLE "department_fees" ADD COLUMN IF NOT EXISTS "apply_url_whatsapp" VARCHAR(500);

-- 2) نقل القيم: apply_types من apply_type، وتوزيع apply_url حسب النوع
UPDATE "department_fees" SET
  "apply_types" = to_jsonb(ARRAY[apply_type::text]),
  "apply_url_external" = CASE WHEN apply_type = 'external_link' THEN apply_url ELSE NULL END,
  "apply_url_whatsapp" = CASE WHEN apply_type = 'whatsapp' THEN apply_url ELSE NULL END,
  "apply_url" = CASE WHEN apply_type = 'internal_page' THEN apply_url ELSE NULL END
WHERE apply_type IS NOT NULL;

-- 3) حذف العمود القديم
ALTER TABLE "department_fees" DROP COLUMN IF EXISTS "apply_type";

-- 4) حذف النوع
DROP TYPE IF EXISTS "ApplyType";
