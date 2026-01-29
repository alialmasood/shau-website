# إصلاح مشكلة Playwright في الإنتاج - دليل سريع

## المشكلة الحالية
```
{"error":"فشل تشغيل المتصفح - تأكد من تثبيت متصفحات Playwright (npx playwright install chromium)"}
```

## ✅ الحل السريع (3 خطوات)

### على السيرفر (Linux):

```bash
# 1. تثبيت system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# 2. تثبيت Playwright browsers
cd /path/to/your/project
npx playwright install chromium

# 3. إعادة تشغيل التطبيق
pm2 restart your-app-name
# أو
sudo systemctl restart your-nextjs-service
```

---

## 🔧 استخدام السكريبت المساعد

إذا كان لديك ملف `scripts/install-playwright.sh`:

```bash
cd /path/to/your/project
bash scripts/install-playwright.sh
```

---

## 📋 التحقق من التثبيت

```bash
# اختبار Playwright
node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});console.log('✅ يعمل!');await b.close();})()"
```

إذا ظهر `✅ يعمل!` يعني التثبيت نجح.

---

## ✅ متغيرات البيئة (صحيحة)

ملف `.env` الخاص بك صحيح:

```bash
DB_SSL=false
DATABASE_URL=postgresql://shau_admin:SHsh321321@localhost:5432/shau_website_db
PORT=3020
NODE_ENV=production
ADMIN_SESSION_SECRET="c7c7d8c3a8b24a6db3f9f2d1d8e0f7a1c9b3e8a6d2f0a4b9c1d7e3a5f8b2c6d1"
STUDENT_SESSION_SECRET="c7c7d8c3a8b24a6db3f9f2d1d8e0f7a1c9b3e8a6d2f0a4b9c1d7e3a5f8b2c6d1"
RESULT_QR_SECRET="5ca4d0cb535ab12fd93e5a03ec06adb5870c1e066192902430290f0e83f6a3160a3663b4572e26d05d1f77963d35625e490d12f0e8ed8d34be1b64bb296b43f2"
NEXT_PUBLIC_SITE_URL="https://shau.edu.iq"
BASE_URL="https://shau.edu.iq"
```

**كل شيء صحيح!** المشكلة فقط في تثبيت Playwright browsers.

---

## 🚨 إذا فشل التثبيت

### 1. تثبيت يدوي:

```bash
# إزالة التثبيت القديم
rm -rf node_modules/.cache/playwright

# إعادة التثبيت
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium --force
```

### 2. التحقق من الصلاحيات:

```bash
# إعطاء صلاحيات
chmod +x node_modules/.cache/playwright/chromium-*/chrome-linux/chrome
```

### 3. التحقق من الذاكرة:

```bash
# عرض استخدام الذاكرة
free -h

# إذا كانت الذاكرة منخفضة، أضف swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📝 ملخص الخطوات الكاملة

```bash
# 1. الاتصال بالسيرفر
ssh user@your-server

# 2. الانتقال إلى مجلد المشروع
cd /path/to/your/project

# 3. تثبيت dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# 4. تثبيت Playwright browsers
npx playwright install chromium

# 5. التحقق من التثبيت
node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});console.log('✅ يعمل!');await b.close();})()"

# 6. إعادة تشغيل التطبيق
pm2 restart your-app-name

# 7. اختبار تصدير PDF
# انتقل إلى: https://shau.edu.iq/ar/student/dashboard
# واضغط على "تصدير PDF"
```

---

## ✅ بعد التثبيت

1. **سجل دخول كطالب** في `https://shau.edu.iq/ar/student-portal/login`
2. **انتقل إلى صفحة النتائج** في `https://shau.edu.iq/ar/student/dashboard`
3. **اضغط على زر "تصدير PDF"**
4. **يجب أن يتم تحميل PDF بنجاح** ✅

---

## 📞 إذا استمرت المشكلة

1. تحقق من السجلات:
   ```bash
   pm2 logs your-app-name
   ```

2. تحقق من وجود Chromium:
   ```bash
   find node_modules -name "chrome" -type f 2>/dev/null
   ```

3. جرب إعادة تثبيت Playwright بالكامل:
   ```bash
   npm uninstall playwright
   npm install playwright
   npx playwright install chromium
   ```
