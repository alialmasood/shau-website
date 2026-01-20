-- AlterTable
ALTER TABLE "news" ADD COLUMN     "secondary_image_id" UUID;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_secondary_image_id_fkey" FOREIGN KEY ("secondary_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
