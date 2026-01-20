-- AlterTable
ALTER TABLE "news" ADD COLUMN     "secondary_image2_id" UUID;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_secondary_image2_id_fkey" FOREIGN KEY ("secondary_image2_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
