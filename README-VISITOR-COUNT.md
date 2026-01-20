# نظام عداد الزوار - دليل التشغيل والاختبار

## 📋 نظرة عامة

تم تنفيذ نظام عداد زوار ديناميكي يعمل تلقائياً عند تحميل الموقع.

## 🗄️ قاعدة البيانات

### الجدول: `visitor_count`
- `id`: UUID (Primary Key)
- `count`: BIGINT (عدد الزوار)
- `updated_at`: TIMESTAMP (تاريخ آخر تحديث)

## 🚀 خطوات التشغيل

### 1. تشغيل Migration

```bash
# في بيئة التطوير
npx prisma migrate dev

# في بيئة الانتاج
npx prisma migrate deploy
```

أو تنفيذ SQL يدوياً:

```sql
CREATE TABLE IF NOT EXISTS "visitor_count" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "count" BIGINT NOT NULL DEFAULT 1680,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visitor_count_pkey" PRIMARY KEY ("id")
);

INSERT INTO "visitor_count" (count, updated_at) 
VALUES (1680, NOW()) 
ON CONFLICT DO NOTHING;
```

### 2. اختبار النظام

```bash
npm run test:visitors
```

أو يدوياً:

```bash
node scripts/test-visitor-count.js
```

### 3. اختبار API يدوياً

#### جلب عدد الزوار الحالي:
```bash
curl http://localhost:3020/api/visitors
```

#### زيادة عدد الزوار:
```bash
curl -X POST http://localhost:3020/api/visitors
```

## 🔍 التحقق من العمل

### في بيئة التطوير:

1. **افتح المتصفح:**
   - افتح `http://localhost:3020`
   - افتح Developer Tools (F12)
   - اذهب إلى Network tab

2. **راقب الطلبات:**
   - عند تحميل الصفحة، يجب أن ترى طلب `GET /api/visitors`
   - إذا كانت أول زيارة اليوم، سترى أيضاً `POST /api/visitors`

3. **تحقق من Console:**
   - يجب أن ترى رسائل log مثل:
     - `✅ Created new visitor_count record`
     - `📊 Current visitor count: 1,680`
     - `✅ Visitor count incremented to: 1,681`

### في بيئة الانتاج:

1. **تحقق من Logs:**
   - راجع server logs للتحقق من رسائل الـ API
   - تأكد من عدم وجود أخطاء

2. **اختبار API مباشرة:**
   ```bash
   curl https://your-domain.com/api/visitors
   ```

3. **مراقبة قاعدة البيانات:**
   ```sql
   SELECT count, updated_at FROM visitor_count ORDER BY updated_at DESC LIMIT 1;
   ```

## 🐛 استكشاف الأخطاء

### المشكلة: عدد الزوار لا يتحدث

**الحلول:**
1. تحقق من وجود الجدول:
   ```sql
   SELECT * FROM visitor_count;
   ```

2. تحقق من اتصال قاعدة البيانات:
   - تأكد من صحة متغيرات البيئة (DB_HOST, DB_PORT, etc.)

3. تحقق من Console في المتصفح:
   - ابحث عن أخطاء JavaScript
   - تحقق من Network requests

### المشكلة: خطأ في API

**الحلول:**
1. تحقق من server logs
2. تأكد من أن `lib/db.ts` متصل بقاعدة البيانات
3. تحقق من أن الجدول موجود

## 📊 منطق العمل

1. **عند تحميل الصفحة:**
   - يتم التحقق من `localStorage` للتحقق من زيارة اليوم
   - إذا كانت أول زيارة اليوم: يتم زيادة العدد
   - إذا لم تكن: يتم جلب العدد الحالي فقط

2. **تجنب العد المتكرر:**
   - يستخدم `localStorage` لتتبع الزيارات اليومية
   - كل زائر يُحسب مرة واحدة في اليوم

3. **القيمة الابتدائية:**
   - تبدأ من 1680
   - تزيد بمقدار 1 عند كل زيارة جديدة

## ✅ قائمة التحقق

- [ ] تم تشغيل migration
- [ ] الجدول موجود في قاعدة البيانات
- [ ] API route يعمل (`/api/visitors`)
- [ ] عدد الزوار يظهر في Footer
- [ ] العدد يزيد عند زيارة جديدة
- [ ] لا يوجد عد متكرر في نفس اليوم
