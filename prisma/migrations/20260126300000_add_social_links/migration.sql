-- CreateTable
CREATE TABLE "social_links" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "platform" VARCHAR(50) NOT NULL,
    "url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");
