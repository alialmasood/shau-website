-- Seed آمن لنسخة المؤتمر IC-2026
-- لا تنفّذ على Production إلا بأمر صريح.
-- الاستخدام المحلي (بعد تطبيق الهجرة فقط):
--   psql "$DATABASE_URL" -f scripts/seed-innovation-conference-edition.sql
-- أو عبر سكربت التشغيل عند الطلب.

INSERT INTO innovation_conference_editions (
  code,
  title_ar,
  title_en,
  event_date,
  is_registration_open,
  registration_opens_at,
  registration_closes_at
) VALUES (
  'IC-2026',
  'مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026',
  'Alsharq International Conference on Innovation and Creativity 2026',
  '2026-10-25',
  false,
  NULL,
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  event_date = EXCLUDED.event_date,
  updated_at = NOW();
