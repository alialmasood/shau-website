# تثبيت Playwright في الإنتاج - دليل شامل

## المشكلة
عند محاولة تصدير PDF، يظهر الخطأ:
```json
{"error":"فشل تشغيل المتصفح - تأكد من تثبيت متصفحات Playwright (npx playwright install chromium)"}
```

## الحل السريع

### على السيرفر (Linux):

```bash
# 1. الاتصال بالسيرفر
ssh user@your-server

# 2. الانتقال إلى مجلد المشروع
cd /path/to/your/project

# 3. تثبيت Playwright browsers
npx playwright install chromium

# 4. إعادة تشغيل التطبيق
pm2 restart your-app-name
# أو
sudo systemctl restart your-nextjs-service
```

---

## تثبيت Dependencies المطلوبة (Linux)

### Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libatspi2.0-0 \
  libcups2
```

### CentOS/RHEL:

```bash
sudo yum install -y \
  nss \
  atk \
  at-spi2-atk \
  libdrm \
  libxkbcommon \
  libXcomposite \
  libXdamage \
  libXfixes \
  libXrandr \
  mesa-libgbm \
  alsa-lib \
  cups-libs
```

### بعد تثبيت Dependencies:

```bash
# تثبيت Playwright browsers
npx playwright install chromium

# التحقق من التثبيت
npx playwright --version
```

---

## التحقق من التثبيت

### 1. التحقق من وجود Chromium:

```bash
# في مجلد المشروع
ls -la node_modules/.cache/playwright/chromium-*/chrome-linux/chrome

# أو
npx playwright install --dry-run chromium
```

### 2. اختبار Playwright:

```bash
# إنشاء ملف اختبار بسيط
cat > test-playwright.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    console.log('✅ Playwright يعمل بشكل صحيح!');
    await browser.close();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
})();
EOF

# تشغيل الاختبار
node test-playwright.js

# حذف ملف الاختبار
rm test-playwright.js
```

---

## حلول للمشاكل الشائعة

### المشكلة 1: "Executable doesn't exist"

**الحل:**
```bash
# إعادة تثبيت Playwright browsers
npx playwright install --force chromium
```

### المشكلة 2: "Permission denied"

**الحل:**
```bash
# إعطاء صلاحيات للملفات
chmod +x node_modules/.cache/playwright/chromium-*/chrome-linux/chrome
```

### المشكلة 3: "Missing dependencies"

**الحل:**
```bash
# Ubuntu/Debian
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# ثم إعادة تثبيت
npx playwright install chromium
```

### المشكلة 4: "Out of memory" أو "Killed"

**الحل:**
- زيادة swap space على السيرفر
- أو تقليل استخدام الذاكرة في Playwright:
  ```javascript
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  ```

---

## إعدادات إضافية للإنتاج

### 1. إضافة متغير بيئة (اختياري):

```bash
# في .env
PLAYWRIGHT_BROWSERS_PATH=0  # استخدام المتصفحات المثبتة محلياً
```

### 2. استخدام Playwright في Docker:

إذا كنت تستخدم Docker، أضف إلى Dockerfile:

```dockerfile
# تثبيت dependencies
RUN apt-get update && apt-get install -y \
  libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2

# تثبيت Playwright browsers
RUN npx playwright install chromium
```

---

## خطوات الإصلاح الكاملة (للإنتاج)

```bash
# 1. الاتصال بالسيرفر
ssh user@your-server

# 2. الانتقال إلى مجلد المشروع
cd /path/to/your/project

# 3. تثبيت system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# 4. تثبيت Playwright browsers
npx playwright install chromium

# 5. التحقق من التثبيت
npx playwright install --dry-run chromium

# 6. إعادة تشغيل التطبيق
pm2 restart your-app-name
# أو
sudo systemctl restart your-nextjs-service

# 7. اختبار تصدير PDF
# انتقل إلى: https://shau.edu.iq/ar/student/dashboard
# واضغط على "تصدير PDF"
```

---

## ملاحظات مهمة

1. **تثبيت Playwright browsers ضروري** - لا يكفي تثبيت المكتبة فقط
2. **System dependencies مهمة** - بدونها قد يفشل تشغيل المتصفح
3. **الذاكرة** - تأكد من وجود RAM كافية (2GB على الأقل)
4. **الصلاحيات** - تأكد من أن المستخدم لديه صلاحيات كتابة في مجلد المشروع

---

## إذا استمرت المشكلة

1. **تحقق من السجلات:**
   ```bash
   pm2 logs your-app-name
   # أو
   journalctl -u your-nextjs-service -f
   ```

2. **تحقق من وجود Chromium:**
   ```bash
   find node_modules -name "chrome" -type f 2>/dev/null
   ```

3. **جرب تثبيت يدوي:**
   ```bash
   PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
   ```

4. **تحقق من المتغيرات البيئية:**
   ```bash
   echo $NODE_ENV
   echo $NEXT_PUBLIC_SITE_URL
   ```

---

## دعم إضافي

إذا استمرت المشكلة بعد تطبيق جميع الخطوات:

1. تحقق من إصدار Node.js (يجب أن يكون 18+)
2. تحقق من إصدار Playwright: `npm list playwright`
3. جرب إعادة تثبيت Playwright بالكامل:
   ```bash
   npm uninstall playwright
   npm install playwright
   npx playwright install chromium
   ```
