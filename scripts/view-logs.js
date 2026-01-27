/**
 * سكريبت لعرض logs من Next.js
 * استخدم: node scripts/view-logs.js
 */

const fs = require('fs');
const path = require('path');

console.log('📋 طرق عرض Logs:\n');

console.log('1️⃣  إذا كان التطبيق يعمل في Terminal:');
console.log('   - افتح Terminal في مجلد المشروع');
console.log('   - ستظهر الـ logs مباشرة في Terminal\n');

console.log('2️⃣  إذا كان يستخدم PM2:');
console.log('   pm2 logs');
console.log('   pm2 logs --lines 100');
console.log('   pm2 logs --follow\n');

console.log('3️⃣  عرض logs من المتصفح:');
console.log('   - افتح المتصفح (Chrome/Firefox)');
console.log('   - اضغط F12 لفتح Developer Tools');
console.log('   - اذهب إلى تبويب Console');
console.log('   - ستجد رسائل console.log هناك\n');

console.log('4️⃣  إذا كان التطبيق يعمل كـ Windows Service:');
console.log('   - ابحث عن ملف log في مجلد المشروع');
console.log('   - أو في: C:\\Program Files\\nodejs\\logs\\\n');

console.log('💡 نصيحة:');
console.log('   بعد رفع التغييرات، افتح المتصفح واضغط F12');
console.log('   ثم اضغط على زر "إدارة المستخدمين"');
console.log('   وستجد رسائل console.log في تبويب Console\n');

console.log('🔍 البحث عن رسائل محددة:');
console.log('   في Console المتصفح، ابحث عن:');
console.log('   - [getAdminSession]');
console.log('   - [getCurrentAdminUser]');
console.log('   - [AdminProtectedLayout]');
console.log('   - [AdminUsersPage]');
