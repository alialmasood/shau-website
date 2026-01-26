-- Script لإصلاح migrations الفاشلة
-- قم بتشغيل هذا الـ script في قاعدة البيانات PostgreSQL

-- أولاً: التحقق من وجود migrations فاشلة
SELECT migration_name, finished_at, applied_steps_count, started_at
FROM "_prisma_migrations"
WHERE finished_at IS NULL
ORDER BY started_at DESC;

-- حذف جميع migrations الفاشلة
DELETE FROM "_prisma_migrations"
WHERE finished_at IS NULL;

-- التحقق من أن جميع السجلات الفاشلة تم حذفها
SELECT migration_name, finished_at, applied_steps_count
FROM "_prisma_migrations"
WHERE finished_at IS NULL;
