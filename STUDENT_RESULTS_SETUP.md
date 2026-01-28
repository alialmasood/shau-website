# نظام إدارة نتائج الطلاب - دليل الإعداد

## الخطوات المطلوبة

### 1. تثبيت الحزم المطلوبة

```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

### 2. تشغيل Migration

```bash
npm run db:migrate-student-results
```

أو يدوياً:
```bash
psql -U your_user -d your_database -f prisma/migrations/20260128000000_add_student_results/migration.sql
```

### 3. إضافة صفحات RBAC (اختياري)

إذا كنت تريد إضافة صفحات `results` و `accounts` إلى نظام RBAC:

```bash
npm run db:seed-rbac
```

ثم في قاعدة البيانات:
```sql
-- إضافة صفحة results
INSERT INTO admin_pages (code, name_ar, name_en) 
VALUES ('results', 'إدارة النتائج', 'Results Management')
ON CONFLICT (code) DO NOTHING;

-- إضافة صفحة accounts
INSERT INTO admin_pages (code, name_ar, name_en) 
VALUES ('accounts', 'الحسابات', 'Accounts')
ON CONFLICT (code) DO NOTHING;
```

### 4. إنشاء مستخدمين للاختبار

#### مستخدم Exam Committee:
```sql
-- في قاعدة البيانات، قم بتحديث role مستخدم موجود:
UPDATE admin_users SET role = 'EXAM_COMMITTEE' WHERE email = 'exam@shau.edu.iq';
```

#### مستخدم Accounts:
```sql
UPDATE admin_users SET role = 'ACCOUNTS' WHERE email = 'accounts@shau.edu.iq';
```

### 5. إنشاء مستخدم طالب للاختبار

```sql
-- إنشاء طالب
INSERT INTO students (student_id, full_name, department_code, stage, academic_year, semester, financial_clearance)
VALUES ('2024001', 'أحمد محمد علي', 'DENTAL_TECH', 'المرحلة الأولى', '2025-2026', 'الفصل الأول', false)
ON CONFLICT (student_id) DO NOTHING;

-- إنشاء حساب طالب
-- كلمة المرور: password123 (سيتم تشفيرها)
INSERT INTO student_users (username, password_hash, student_id)
VALUES ('student1', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', '2024001')
ON CONFLICT (username) DO NOTHING;
```

**ملاحظة:** يجب تشفير كلمة المرور باستخدام bcrypt. استخدم script منفصل أو:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password123', 10);
console.log(hash);
```

## الصفحات المتاحة

1. **`/admin/results`** - استيراد النتائج من Excel
   - يحتاج صلاحية: `EXAM_COMMITTEE` أو `ADMIN`

2. **`/admin/accounts`** - إدارة الحسابات المالية
   - يحتاج صلاحية: `ACCOUNTS` أو `ADMIN`

3. **`/ar/student-portal/login`** - تسجيل دخول الطلاب
4. **`/ar/student-portal`** - عرض نتائج الطالب

## تنسيق ملف Excel

الملف يجب أن يحتوي على:
- عمود `student_id` (مطلوب، فريد)
- عمود `full_name` (مطلوب)
- أي أعمدة أخرى للدرجات (سيتم حفظها في `payload_json`)

مثال:
| student_id | full_name | subject1 | subject2 | total |
|------------|-----------|----------|----------|-------|
| 2024001    | أحمد محمد | 85       | 90       | 175   |

## المتغيرات البيئية

تأكد من وجود:
```env
DATABASE_URL=postgresql://...
STUDENT_SESSION_SECRET=your-secret-key-here
# أو يمكن استخدام ADMIN_SESSION_SECRET
```

## الأمان

- `/admin/results` محمي بـ role check (EXAM_COMMITTEE أو ADMIN)
- `/admin/accounts` محمي بـ role check (ACCOUNTS أو ADMIN)
- `/ar/student-portal` يتحقق من `student_id` في الجلسة
- الطلاب يمكنهم فقط رؤية نتائجهم الخاصة
