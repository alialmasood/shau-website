-- CreateTable
CREATE TABLE IF NOT EXISTS "visitor_count" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "count" BIGINT NOT NULL DEFAULT 1680,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_count_pkey" PRIMARY KEY ("id")
);

-- Insert initial record
INSERT INTO "visitor_count" (count, updated_at) VALUES (1680, NOW()) ON CONFLICT DO NOTHING;
