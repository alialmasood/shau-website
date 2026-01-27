# كيفية عرض Logs في الإنتاج

## الطريقة 1: إذا كان يستخدم PM2

```bash
# عرض جميع logs
pm2 logs

# عرض logs لـ app معين
pm2 logs shua

# عرض آخر 100 سطر
pm2 logs --lines 100

# متابعة logs مباشرة (real-time)
pm2 logs --follow
```

## الطريقة 2: إذا كان يعمل في Terminal/CMD

افتح Terminal في مجلد المشروع:
```bash
cd D:\Sites\shau.edu.iq
npm start
```

ستظهر الـ logs مباشرة في Terminal.

## الطريقة 3: إذا كان يستخدم Windows Service

ابحث عن ملف log في:
- `C:\Program Files\nodejs\logs\`
- أو في مجلد المشروع: `D:\Sites\shau.edu.iq\logs\`

## الطريقة 4: Logs في Next.js

Next.js يطبع logs في:
- **Console output** (stdout/stderr)
- **Browser Console** (في المتصفح، اضغط F12)

## الطريقة 5: إنشاء ملف log مخصص

يمكنك توجيه logs إلى ملف:
```bash
npm start > app.log 2>&1
```

ثم افتح الملف:
```bash
notepad app.log
```

## الطريقة 6: استخدام PowerShell

```powershell
# عرض آخر 50 سطر من logs
Get-Content app.log -Tail 50

# متابعة logs مباشرة
Get-Content app.log -Wait -Tail 20
```
