-- تحويل التصنيف من قيمة واحدة (enum) إلى مصفوفة (JSONB) لدعم أكثر من تصنيف لكل قسم

-- 1) إضافة العمود الجديد
ALTER TABLE "department_fees" ADD COLUMN IF NOT EXISTS "categories" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) نقل القيم من category إلى categories (قيمة واحدة تُحوّل لمصفوفة من عنصر واحد)
UPDATE "department_fees" SET "categories" = to_jsonb(ARRAY[category::text]) WHERE "category" IS NOT NULL;

-- 3) حذف العمود القديم
ALTER TABLE "department_fees" DROP COLUMN IF EXISTS "category";

-- 4) حذف النوع القديم (إن وُجد ولم يُستخدم في جداول أخرى)
DROP TYPE IF EXISTS "DeptFeeCategory";
