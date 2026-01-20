-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('ADMINISTRATIVE', 'SCIENTIFIC', 'ACTIVITIES', 'ANNOUNCEMENTS');

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "category" "NewsCategory",
ADD COLUMN     "cover_image_id" UUID,
ADD COLUMN     "excerpt" VARCHAR(500),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" VARCHAR(250),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "visitor_count" ALTER COLUMN "count" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(120) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticker_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "text" VARCHAR(400) NOT NULL,
    "link" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticker_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "ticker_items_is_active_sort_order_idx" ON "ticker_items"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_is_published_publish_date_idx" ON "news"("is_published", "publish_date");

-- CreateIndex
CREATE INDEX "news_category_idx" ON "news"("category");

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
