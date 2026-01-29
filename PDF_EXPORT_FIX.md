# إصلاح مشكلة تصدير PDF في الإنتاج

## المشكلة
عند محاولة تصدير PDF من صفحة الطالب، يظهر الخطأ:
```json
{"error":"حدث خطأ أثناء توليد PDF"}
```

## الأسباب المحتملة والحلول

### 1️⃣ مشكلة في `RESULT_QR_SECRET`

**المشكلة:** في ملف `.env` في الإنتاج، المتغير `RESULT_QR_SECRET` لا يزال يحتوي على القيمة الافتراضية:
```
RESULT_QR_SECRET="YOUR_STRONG_RANDOM_SECRET_HERE"
```

**الحل:**
1. توليد مفتاح سري قوي:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. تحديث ملف `.env` في الإنتاج:
```bash
RESULT_QR_SECRET="<المفتاح_الذي_تم_توليده>"
```

**ملاحظة:** تم إضافة fallback في الكود، لكن يجب تحديث القيمة في الإنتاج.

---

### 2️⃣ Playwright غير مثبت في الإنتاج

**المشكلة:** Playwright يحتاج إلى تثبيت المتصفحات (Chromium) بشكل منفصل.

**الحل:**
```bash
# في مجلد المشروع على السيرفر
npx playwright install chromium

# أو تثبيت جميع المتصفحات
npx playwright install
```

**ملاحظة:** قد تحتاج إلى تثبيت dependencies إضافية على Linux:
```bash
# Ubuntu/Debian
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# CentOS/RHEL
sudo yum install -y nss atk at-spi2-atk libdrm libxkbcommon libXcomposite libXdamage libXfixes libXrandr mesa-libgbm alsa-lib
```

---

### 3️⃣ مشكلة في متغيرات البيئة

**تأكد من وجود هذه المتغيرات في `.env`:**

```bash
# URL السيرفر (مهم جداً!)
NEXT_PUBLIC_SITE_URL="https://shau.edu.iq"
BASE_URL="https://shau.edu.iq"

# لا تستخدم localhost في الإنتاج!
# ❌ خطأ: NEXT_PUBLIC_SITE_URL="http://localhost:3020"
# ✅ صحيح: NEXT_PUBLIC_SITE_URL="https://shau.edu.iq"
```

---

### 4️⃣ فحص السجلات (Logs)

**للتحقق من الخطأ الدقيق:**

1. **في Next.js:**
   - تحقق من console logs في السيرفر
   - أو استخدم `pm2 logs` إذا كنت تستخدم PM2

2. **الخطوات:**
```bash
# عرض السجلات
pm2 logs your-app-name

# أو إذا كنت تستخدم systemd
journalctl -u your-nextjs-service -f
```

---

### 5️⃣ خطوات الإصلاح الكاملة

```bash
# 1. الاتصال بالسيرفر
ssh user@your-server

# 2. الانتقال إلى مجلد المشروع
cd /path/to/your/project

# 3. تحديث ملف .env
nano .env
# أو
vi .env

# أضف/حدث:
RESULT_QR_SECRET="<مفتاح_سري_قوي_عشوائي>"
NEXT_PUBLIC_SITE_URL="https://shau.edu.iq"
BASE_URL="https://shau.edu.iq"

# 4. تثبيت Playwright browsers
npx playwright install chromium

# 5. إعادة بناء المشروع
npm run build

# 6. إعادة تشغيل السيرفر
pm2 restart your-app-name
# أو
sudo systemctl restart your-nextjs-service
```

---

### 6️⃣ التحقق من الإصلاح

بعد تطبيق الإصلاحات:

1. **سجل دخول كطالب** في `https://shau.edu.iq/ar/student-portal/login`
2. **انتقل إلى صفحة النتائج** في `https://shau.edu.iq/ar/student/dashboard`
3. **اضغط على زر "تصدير PDF"**
4. **يجب أن يتم تحميل PDF بنجاح**

---

### 7️⃣ مشاكل إضافية محتملة

#### أ) مشكلة في الكوكيز (Cookies)
- تأكد من أن الكوكيز يتم إرسالها بشكل صحيح
- في الإنتاج، يجب أن يكون `secure: true` للكوكيز

#### ب) مشكلة في الشبكة
- تأكد من أن السيرفر يمكنه الوصول إلى نفسه عبر `https://shau.edu.iq`
- قد تحتاج إلى إضافة استثناء في firewall

#### ج) مشكلة في الذاكرة
- Playwright يحتاج إلى ذاكرة كافية
- تأكد من أن السيرفر لديه RAM كافية (2GB على الأقل)

---

## ملاحظات مهمة

1. **لا تستخدم `localhost` في الإنتاج** - استخدم دومين الإنتاج دائماً
2. **تأكد من تحديث `RESULT_QR_SECRET`** - لا تترك القيمة الافتراضية
3. **ثبت Playwright browsers** - هذا ضروري لتوليد PDF
4. **راقب السجلات** - ستساعدك في تحديد المشكلة بدقة

---

## إذا استمرت المشكلة

1. تحقق من السجلات (logs) للحصول على رسالة الخطأ الدقيقة
2. تأكد من أن جميع المتغيرات في `.env` صحيحة
3. تأكد من تثبيت Playwright browsers
4. جرب الوصول إلى صفحة الطباعة مباشرة: `https://shau.edu.iq/ar/student/print-result?attempt=1`
5. تأكد من أن الطالب لديه `financial_clearance = true` في قاعدة البيانات
