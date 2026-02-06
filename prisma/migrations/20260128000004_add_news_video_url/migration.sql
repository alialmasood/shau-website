-- إضافة رابط فيديو (يوتيوب) للأخبار
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'news' AND column_name = 'video_url'
    ) THEN
        ALTER TABLE "news" ADD COLUMN "video_url" VARCHAR(500);
    END IF;
END $$;
