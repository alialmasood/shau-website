-- CreateTable
CREATE TABLE IF NOT EXISTS "registration_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(200) NOT NULL,
    "department" VARCHAR(200) NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "personal_photo_id" UUID,
    "student_id_front_id" UUID,
    "student_id_back_id" UUID,
    "father_id_front_id" UUID,
    "father_id_back_id" UUID,
    "mother_id_front_id" UUID,
    "mother_id_back_id" UUID,
    "residence_card_front_id" UUID,
    "residence_card_back_id" UUID,
    "high_school_certificate_id" UUID,
    "barcode_document_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "registration_documents_created_at_idx" ON "registration_documents"("created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_personal_photo_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_personal_photo_id_fkey" FOREIGN KEY ("personal_photo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_student_id_front_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_student_id_front_id_fkey" FOREIGN KEY ("student_id_front_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_student_id_back_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_student_id_back_id_fkey" FOREIGN KEY ("student_id_back_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_father_id_front_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_father_id_front_id_fkey" FOREIGN KEY ("father_id_front_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_father_id_back_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_father_id_back_id_fkey" FOREIGN KEY ("father_id_back_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_mother_id_front_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_mother_id_front_id_fkey" FOREIGN KEY ("mother_id_front_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_mother_id_back_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_mother_id_back_id_fkey" FOREIGN KEY ("mother_id_back_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_residence_card_front_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_residence_card_front_id_fkey" FOREIGN KEY ("residence_card_front_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_residence_card_back_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_residence_card_back_id_fkey" FOREIGN KEY ("residence_card_back_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_high_school_certificate_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_high_school_certificate_id_fkey" FOREIGN KEY ("high_school_certificate_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_documents_barcode_document_id_fkey'
    ) THEN
        ALTER TABLE "registration_documents" ADD CONSTRAINT "registration_documents_barcode_document_id_fkey" FOREIGN KEY ("barcode_document_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
