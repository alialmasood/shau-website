-- جدول برامج الكلية (اسم القسم، نبذة، جدول محاضرات، جدول امتحانات، توفر الدراسة، 4 صور)
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" VARCHAR(120) NOT NULL,
    "name_ar" VARCHAR(250),
    "name_en" VARCHAR(250),
    "brief_ar" TEXT,
    "brief_en" TEXT,
    "lectures_table_ar" TEXT,
    "lectures_table_en" TEXT,
    "exams_table_ar" TEXT,
    "exams_table_en" TEXT,
    "study_shift" VARCHAR(20) NOT NULL DEFAULT 'both',
    "image_1_id" UUID,
    "image_2_id" UUID,
    "image_3_id" UUID,
    "image_4_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");
CREATE INDEX "programs_is_active_sort_order_idx" ON "programs"("is_active", "sort_order");

ALTER TABLE "programs" ADD CONSTRAINT "programs_image_1_id_fkey" FOREIGN KEY ("image_1_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "programs" ADD CONSTRAINT "programs_image_2_id_fkey" FOREIGN KEY ("image_2_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "programs" ADD CONSTRAINT "programs_image_3_id_fkey" FOREIGN KEY ("image_3_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "programs" ADD CONSTRAINT "programs_image_4_id_fkey" FOREIGN KEY ("image_4_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
