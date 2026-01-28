# تعليمات النشر على سيرفر الإنتاج

## الخطوات المطلوبة بعد دفع التغييرات

### 1️⃣ تثبيت المكتبات الجديدة

```bash
# الاتصال بالسيرفر
ssh user@your-server

# الانتقال إلى مجلد المشروع
cd /path/to/your/project

# سحب آخر التغييرات
git pull origin main

# تثبيت المكتبات الجديدة
npm install

# أو إذا كنت تستخدم yarn
yarn install
```

**المكتبات المضافة:**
- `qrcode` - لتوليد QR Code
- `@types/qrcode` - ملفات تعريف TypeScript

### 2️⃣ إضافة متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env` أو `.env.production` على السيرفر:

```bash
# QR Code Secret for Result Verification (HMAC SHA-256 secret for signing result verification URLs)
# IMPORTANT: استبدل هذا بمفتاح سري قوي عشوائي في الإنتاج!
RESULT_QR_SECRET="YOUR_STRONG_RANDOM_SECRET_HERE_CHANGE_THIS"

# تأكد من وجود هذه المتغيرات أيضاً:
NEXT_PUBLIC_SITE_URL="https://shau.edu.iq"
BASE_URL="https://shau.edu.iq"
```

**ملاحظة مهمة:**
- استبدل `RESULT_QR_SECRET` بمفتاح سري قوي عشوائي (128 حرف على الأقل)
- لا تستخدم نفس المفتاح المستخدم في التطوير المحلي
- يمكنك توليد مفتاح سري باستخدام:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 3️⃣ بناء المشروع

```bash
# بناء المشروع للإنتاج
npm run build

# أو إذا كنت تستخدم yarn
yarn build
```

### 4️⃣ إعادة تشغيل الخادم

```bash
# إذا كنت تستخدم PM2
pm2 restart your-app-name

# أو إذا كنت تستخدم systemd
sudo systemctl restart your-nextjs-service

# أو إذا كنت تستخدم Docker
docker-compose restart

# أو إذا كنت تستخدم Next.js standalone
# فقط أعد تشغيل العملية
```

### 5️⃣ التحقق من النشر

1. **تحقق من صفحة الطالب:**
   - افتح `https://shau.edu.iq/ar/student/dashboard`
   - تأكد من أن الصفحة تعمل بدون Footer الموقع

2. **تحقق من QR Code:**
   - تصدير PDF من صفحة الطالب
   - تأكد من ظهور QR Code في أسفل النتيجة

3. **تحقق من صفحة التحقق:**
   - افتح رابط التحقق من QR Code
   - تأكد من أن الصفحة تعمل بشكل صحيح

### 6️⃣ التحقق من الأخطاء

```bash
# عرض logs إذا كنت تستخدم PM2
pm2 logs your-app-name

# أو عرض logs النظام
sudo journalctl -u your-nextjs-service -f

# أو إذا كنت تستخدم Docker
docker-compose logs -f
```

## ملخص التغييرات المضافة

### ملفات جديدة:
- `app/ar/(student)/layout.tsx` - Layout خاص للطالب بدون Footer
- `app/ar/(student)/student/dashboard/page.tsx` - صفحة الطالب
- `app/ar/(student)/student-portal/*` - صفحات تسجيل الدخول
- `app/ar/(print)/student/print-result/page.tsx` - صفحة الطباعة مع QR Code
- `app/ar/verify-result/page.tsx` - صفحة التحقق من النتيجة

### مكتبات جديدة:
- `qrcode` - لتوليد QR Code
- `@types/qrcode` - ملفات تعريف TypeScript

### متغيرات بيئة جديدة:
- `RESULT_QR_SECRET` - مفتاح سري للتوقيع الرقمي

## استكشاف الأخطاء

### إذا فشل البناء:
```bash
# تأكد من تثبيت جميع المكتبات
npm install

# تأكد من وجود متغيرات البيئة
cat .env | grep RESULT_QR_SECRET
```

### إذا لم يظهر QR Code:
- تأكد من وجود `RESULT_QR_SECRET` في `.env`
- تأكد من أن `NEXT_PUBLIC_SITE_URL` يشير إلى رابط الإنتاج الصحيح
- تحقق من logs السيرفر

### إذا فشل التحقق من QR Code:
- تأكد من أن `RESULT_QR_SECRET` هو نفسه في `.env`
- تأكد من أن رابط التحقق يستخدم نفس النطاق (`shau.edu.iq`)

## ملاحظات أمنية

1. **لا تشارك `RESULT_QR_SECRET`** مع أي شخص
2. **استخدم مفتاح سري مختلف** في الإنتاج عن التطوير
3. **احتفظ بنسخة احتياطية** من `.env` في مكان آمن
4. **لا ترفع `.env`** إلى Git
