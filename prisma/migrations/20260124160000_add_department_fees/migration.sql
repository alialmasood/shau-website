-- CreateEnum
CREATE TYPE "DeptFeeCategory" AS ENUM ('biological', 'applied', 'scientific', 'industry', 'admin');

-- CreateEnum
CREATE TYPE "ApplyType" AS ENUM ('external_link', 'internal_page', 'whatsapp');

-- CreateTable
CREATE TABLE "department_fees" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "department_slug" VARCHAR(120) NOT NULL,
    "display_name" VARCHAR(250),
    "display_name_en" VARCHAR(250),
    "category" "DeptFeeCategory" NOT NULL,
    "card_image_id" UUID,
    "brief" VARCHAR(500),
    "brief_en" VARCHAR(500),
    "morning_price" DECIMAL(14,0) NOT NULL,
    "evening_price" DECIMAL(14,0) NOT NULL,
    "currency" VARCHAR(20) NOT NULL DEFAULT 'د.ع',
    "registration_fee" DECIMAL(14,0),
    "extra_fees" VARCHAR(400),
    "extra_fees_en" VARCHAR(400),
    "fees_notes" VARCHAR(500),
    "fees_notes_en" VARCHAR(500),
    "morning_min_gpa" DECIMAL(5,2) NOT NULL,
    "evening_min_gpa" DECIMAL(5,2) NOT NULL,
    "admission_notes" VARCHAR(500),
    "admission_notes_en" VARCHAR(500),
    "show_apply_button" BOOLEAN NOT NULL DEFAULT true,
    "apply_type" "ApplyType" NOT NULL,
    "apply_url" VARCHAR(500),
    "apply_button_text" VARCHAR(120),
    "apply_button_text_en" VARCHAR(120),
    "required_docs" JSONB,
    "application_start" DATE,
    "application_end" DATE,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_fees_department_slug_key" ON "department_fees"("department_slug");

-- CreateIndex
CREATE INDEX "department_fees_is_active_featured_sort_order_idx" ON "department_fees"("is_active", "featured", "sort_order");

-- AddForeignKey
ALTER TABLE "department_fees" ADD CONSTRAINT "department_fees_card_image_id_fkey" FOREIGN KEY ("card_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
