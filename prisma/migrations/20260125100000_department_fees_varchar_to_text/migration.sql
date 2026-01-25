-- توسيع حقول النص في department_fees لتجنب خطأ "value too long for type character varying(500)"
-- تحويل VARCHAR(500) و VARCHAR(400) إلى TEXT (بدون حد عملي للطول)

ALTER TABLE "department_fees" ALTER COLUMN "brief" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "brief_en" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "extra_fees" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "extra_fees_en" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "fees_notes" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "fees_notes_en" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "admission_notes" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "admission_notes_en" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "apply_url" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "apply_url_external" TYPE TEXT;
ALTER TABLE "department_fees" ALTER COLUMN "apply_url_whatsapp" TYPE TEXT;
