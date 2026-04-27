-- Events (bilingual) + optional gallery images; brochure/media via media table

CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title_ar" VARCHAR(300) NOT NULL,
    "title_en" VARCHAR(300),
    "excerpt_ar" TEXT,
    "excerpt_en" TEXT,
    "details_ar" TEXT NOT NULL DEFAULT '',
    "details_en" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "registration_label_ar" VARCHAR(120),
    "registration_label_en" VARCHAR(120),
    "registration_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "cover_image_id" UUID,
    "brochure_media_id" UUID,
    "video_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_gallery" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "event_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_gallery_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_gallery_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_gallery_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "event_gallery_event_id_media_id_key" ON "event_gallery"("event_id", "media_id");

CREATE INDEX "events_published_starts_at_idx" ON "events"("is_published", "starts_at");
CREATE INDEX "event_gallery_event_id_idx" ON "event_gallery"("event_id");

ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_brochure_media_id_fkey" FOREIGN KEY ("brochure_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
