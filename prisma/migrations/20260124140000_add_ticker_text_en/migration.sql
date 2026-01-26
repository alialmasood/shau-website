-- AlterTable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticker_items' 
        AND column_name = 'text_en'
    ) THEN
        ALTER TABLE "ticker_items" ADD COLUMN "text_en" VARCHAR(400);
    END IF;
END $$;
