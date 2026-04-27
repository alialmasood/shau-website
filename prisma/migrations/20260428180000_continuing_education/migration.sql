-- شعبة التعليم المستمر: أنشطة (إعلان + تقرير بعد التنفيذ)، معرض صور، شهادات مشاركة، أرشيف ZIP

CREATE TABLE "ce_activities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title_ar" VARCHAR(300) NOT NULL,
    "title_en" VARCHAR(300),
    "excerpt_ar" TEXT,
    "excerpt_en" TEXT,
    "announcement_details_ar" TEXT NOT NULL DEFAULT '',
    "announcement_details_en" TEXT,
    "recap_details_ar" TEXT,
    "recap_details_en" TEXT,
    "event_starts_at" TIMESTAMPTZ(6) NOT NULL,
    "event_ends_at" TIMESTAMPTZ(6),
    "show_announcement" BOOLEAN NOT NULL DEFAULT true,
    "show_recap" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "cover_image_id" UUID,
    "certificates_zip_media_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ce_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ce_activity_gallery" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "activity_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'announcement',
    CONSTRAINT "ce_activity_gallery_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ce_activity_gallery_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "ce_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ce_activity_gallery_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ce_activity_gallery_kind_check" CHECK ("kind" IN ('announcement', 'recap'))
);

CREATE UNIQUE INDEX "ce_activity_gallery_activity_media_key" ON "ce_activity_gallery"("activity_id", "media_id");

CREATE TABLE "ce_certificates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "activity_id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "participant_name_ar" VARCHAR(200) NOT NULL,
    "participant_name_en" VARCHAR(200),
    "pdf_media_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ce_certificates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ce_certificates_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "ce_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ce_certificates_pdf_media_id_fkey" FOREIGN KEY ("pdf_media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ce_certificates_code_key" ON "ce_certificates"("code");
CREATE INDEX "ce_certificates_activity_id_idx" ON "ce_certificates"("activity_id");

CREATE INDEX "ce_activities_published_event_idx" ON "ce_activities"("is_published", "event_starts_at");
CREATE INDEX "ce_activity_gallery_activity_idx" ON "ce_activity_gallery"("activity_id");

ALTER TABLE "ce_activities" ADD CONSTRAINT "ce_activities_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ce_activities" ADD CONSTRAINT "ce_activities_certificates_zip_media_id_fkey" FOREIGN KEY ("certificates_zip_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
