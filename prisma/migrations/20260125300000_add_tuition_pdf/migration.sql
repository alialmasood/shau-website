-- CreateTable
CREATE TABLE "tuition_pdf" (
    "id" SERIAL NOT NULL,
    "media_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tuition_pdf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tuition_pdf" ADD CONSTRAINT "tuition_pdf_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
