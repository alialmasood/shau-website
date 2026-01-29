#!/bin/bash

# سكريبت تثبيت Playwright في الإنتاج
# الاستخدام: bash scripts/install-playwright.sh

set -e

echo "🚀 بدء تثبيت Playwright..."

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيته أولاً."
    exit 1
fi

echo "✅ Node.js موجود: $(node --version)"

# التحقق من وجود npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت. يرجى تثبيته أولاً."
    exit 1
fi

echo "✅ npm موجود: $(npm --version)"

# التحقق من نظام التشغيل
OS="$(uname -s)"
echo "📦 نظام التشغيل: $OS"

# تثبيت system dependencies حسب نظام التشغيل
if [[ "$OS" == "Linux" ]]; then
    echo "📥 تثبيت system dependencies..."
    
    # التحقق من نوع التوزيعة
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        echo "🔧 تثبيت dependencies لـ Ubuntu/Debian..."
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
            libcups2 || echo "⚠️  بعض الحزم فشلت، لكن سنتابع..."
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        echo "🔧 تثبيت dependencies لـ CentOS/RHEL..."
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
            cups-libs || echo "⚠️  بعض الحزم فشلت، لكن سنتابع..."
    else
        echo "⚠️  لم يتم التعرف على مدير الحزم. قد تحتاج إلى تثبيت dependencies يدوياً."
    fi
else
    echo "⚠️  نظام التشغيل غير Linux. قد تحتاج إلى تثبيت dependencies يدوياً."
fi

# التحقق من وجود Playwright في package.json
if ! grep -q "playwright" package.json; then
    echo "❌ Playwright غير موجود في package.json. يرجى تثبيته أولاً:"
    echo "   npm install playwright"
    exit 1
fi

echo "✅ Playwright موجود في package.json"

# تثبيت Playwright browsers
echo "📦 تثبيت Chromium..."
npx playwright install chromium

# التحقق من التثبيت
echo "🔍 التحقق من التثبيت..."
if npx playwright install --dry-run chromium 2>&1 | grep -q "chromium"; then
    echo "✅ Chromium مثبت بنجاح!"
else
    echo "⚠️  قد يكون هناك مشكلة في التثبيت. جرب:"
    echo "   npx playwright install --force chromium"
fi

# اختبار Playwright
echo "🧪 اختبار Playwright..."
cat > /tmp/test-playwright.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Playwright يعمل بشكل صحيح!');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
})();
EOF

if node /tmp/test-playwright.js; then
    echo "✅ الاختبار نجح!"
    rm /tmp/test-playwright.js
else
    echo "❌ الاختبار فشل. تحقق من الأخطاء أعلاه."
    rm /tmp/test-playwright.js
    exit 1
fi

echo ""
echo "🎉 تم التثبيت بنجاح!"
echo ""
echo "📝 الخطوات التالية:"
echo "   1. أعد تشغيل التطبيق:"
echo "      pm2 restart your-app-name"
echo "      # أو"
echo "      sudo systemctl restart your-nextjs-service"
echo ""
echo "   2. اختبر تصدير PDF من:"
echo "      https://shau.edu.iq/ar/student/dashboard"
echo ""
