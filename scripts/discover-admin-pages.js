/**
 * اكتشاف صفحات الإدارة تلقائياً من بنية المجلدات
 */
const fs = require("fs");
const path = require("path");

const adminPagesDir = path.join(__dirname, "..", "app", "admin", "(protected)");

/**
 * استخراج page code و parent code من مسار المجلد
 * @param {string} dirPath - المسار الكامل للمجلد
 * @param {string} basePath - المسار الأساسي (app/admin/(protected))
 * @returns {{code: string, parentCode: string | null} | null} - page code و parent code أو null
 */
function extractPageCode(dirPath, basePath) {
  const relativePath = path.relative(basePath, dirPath);
  const parts = relativePath.split(path.sep).filter(p => p && p !== "page.tsx" && !p.startsWith("[") && !p.startsWith("("));
  
  if (parts.length === 0) {
    return { code: "admin", parentCode: null }; // الصفحة الرئيسية
  }
  
  // إذا كان المجلد يحتوي على page.tsx مباشرة
  const pagePath = path.join(dirPath, "page.tsx");
  if (fs.existsSync(pagePath)) {
    const lastPart = parts[parts.length - 1];
    
    // إذا كان المجلد الفرعي (مثل required-documents تحت registration-affairs)
    if (parts.length > 1) {
      // صفحة فرعية: نستخدم آخر جزء كـ code
      // مثل: registration-affairs/required-documents -> required-documents
      // والصفحة الأساسية هي registration
      const parentPart = parts[0];
      let parentCode = parentPart;
      
      // تحويل parent code
      if (parentPart === "registration-affairs") {
        parentCode = "registration";
      } else if (parentPart === "social-media") {
        parentCode = "social";
      } else if (parentPart === "tuition-fees") {
        parentCode = "tuition";
      }
      
      return { code: lastPart, parentCode: parentCode };
    }
    
    // صفحة رئيسية: نستخدم الاسم مباشرة
    // لكن نحول بعض الأسماء المعروفة
    let code = lastPart;
    if (lastPart === "registration-affairs") {
      code = "registration";
    } else if (lastPart === "social-media") {
      code = "social";
    } else if (lastPart === "tuition-fees") {
      code = "tuition";
    } else if (lastPart === "tuition-pdf") {
      code = "tuition-pdf";
    }
    
    return { code: code, parentCode: null };
  }
  
  return null;
}

/**
 * التحقق من أن الصفحة مستقلة (ليست صفحة فرعية تابعة)
 * @param {string} dirPath - مسار المجلد
 * @param {string} basePath - المسار الأساسي
 * @returns {boolean} - true إذا كانت الصفحة مستقلة
 */
function isIndependentPage(dirPath, basePath) {
  const relativePath = path.relative(basePath, dirPath);
  const parts = relativePath.split(path.sep);
  
  // تخطي الصفحات التي تحتوي على [id] أو new أو edit أو create
  // ما لم تكن صفحات مستقلة (مثل required-documents)
  for (const part of parts) {
    if (part.startsWith("[") || 
        part === "new" || 
        part === "edit" || 
        part === "create") {
      // استثناء: required-documents هي صفحة مستقلة
      if (parts.includes("required-documents")) {
        return true;
      }
      return false;
    }
  }
  
  return true;
}

/**
 * اكتشاف جميع صفحات الإدارة
 * @param {string} dir - المجلد الحالي
 * @param {string} basePath - المسار الأساسي
 * @param {Array} pages - قائمة الصفحات المكتشفة
 */
function discoverPages(dir, basePath, pages = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // تخطي ملفات معينة
    if (entry.name.startsWith(".") || 
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "layout.tsx" ||
        entry.name === "loading.tsx" ||
        entry.name === "error.tsx") {
      continue;
    }
    
    if (entry.isDirectory()) {
      // فحص إذا كان المجلد يحتوي على page.tsx
      const pagePath = path.join(fullPath, "page.tsx");
      if (fs.existsSync(pagePath)) {
        // التحقق من أن الصفحة مستقلة
        if (isIndependentPage(fullPath, basePath)) {
          const pageInfo = extractPageCode(fullPath, basePath);
          if (pageInfo && !pages.find(p => p.code === pageInfo.code)) {
            // استخراج الاسم العربي من اسم المجلد أو استخدام code كاسم
            const nameAr = getPageNameAr(pageInfo.code, entry.name);
            pages.push({
              code: pageInfo.code,
              nameAr: nameAr,
              nameEn: getPageNameEn(pageInfo.code),
              parentCode: pageInfo.parentCode || null,
              path: path.relative(basePath, fullPath)
            });
          }
        }
      }
      
      // استمرار البحث في المجلدات الفرعية
      discoverPages(fullPath, basePath, pages);
    }
  }
  
  return pages;
}

/**
 * الحصول على الاسم العربي للصفحة
 */
function getPageNameAr(code, folderName) {
  const nameMap = {
    "admin": "لوحة التحكم",
    "news": "الأخبار",
    "programs": "البرامج",
    "departments": "الأقسام",
    "users": "المستخدمين",
    "content": "المحتوى",
    "applications": "طلبات التقديم",
    "registration": "شؤون التسجيل",
    "required-documents": "المستمسكات المطلوبة",
    "ticker": "الشريط الإخباري",
    "social": "السوشيال ميديا",
    "tuition": "الرسوم الدراسية",
    "tuition-pdf": "تحميل الرسوم PDF",
    "results": "إدارة النتائج",
    "accounts": "الحسابات",
    "student-accounts": "حسابات الطلاب",
  };
  
  // إذا لم يكن في القائمة، استخدم اسم المجلد أو code
  if (!nameMap[code]) {
    // محاولة استخراج اسم من folderName
    if (folderName) {
      const folderNameMap = {
        "tuition-pdf": "تحميل الرسوم PDF",
        "registration-affairs": "شؤون التسجيل",
        "social-media": "السوشيال ميديا",
        "tuition-fees": "الرسوم الدراسية",
      };
      if (folderNameMap[folderName]) {
        return folderNameMap[folderName];
      }
    }
    // استخدام code مع تحويل kebab-case إلى نص عربي
    return code.split("-").map(w => {
      const wordMap = {
        "required": "المطلوبة",
        "documents": "المستمسكات",
        "tuition": "الرسوم",
        "pdf": "PDF",
      };
      return wordMap[w] || w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }
  
  return nameMap[code];
}

/**
 * الحصول على الاسم الإنجليزي للصفحة
 */
function getPageNameEn(code) {
  const nameMap = {
    "admin": "Admin Dashboard",
    "news": "News",
    "programs": "Programs",
    "departments": "Departments",
    "users": "Users",
    "content": "Content",
    "applications": "Applications",
    "registration": "Registration",
    "required-documents": "Required Documents",
    "ticker": "Ticker",
    "social": "Social Media",
    "tuition": "Tuition Fees",
    "tuition-pdf": "Tuition PDF",
    "results": "Results Management",
    "accounts": "Accounts",
    "student-accounts": "Student Accounts",
  };
  
  return nameMap[code] || code.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * اكتشاف جميع الصفحات
 */
function discoverAllPages() {
  if (!fs.existsSync(adminPagesDir)) {
    console.error(`❌ المجلد غير موجود: ${adminPagesDir}`);
    return [];
  }
  
  const pages = discoverPages(adminPagesDir, adminPagesDir);
  
  // إضافة الصفحة الرئيسية admin إذا لم تكن موجودة
  if (!pages.find(p => p.code === "admin")) {
    pages.unshift({
      code: "admin",
      nameAr: "لوحة التحكم",
      nameEn: "Admin Dashboard",
      path: "."
    });
  }
  
  // ترتيب الصفحات حسب code
  pages.sort((a, b) => a.code.localeCompare(b.code));
  
  return pages;
}

// إذا تم استدعاء السكريبت مباشرة
if (require.main === module) {
  const pages = discoverAllPages();
  console.log(`✅ تم اكتشاف ${pages.length} صفحة:\n`);
  pages.forEach((page, index) => {
    console.log(`${index + 1}. ${page.code} - ${page.nameAr} (${page.path})`);
  });
  console.log("\n📋 JSON Format:");
  console.log(JSON.stringify(pages, null, 2));
}

module.exports = { discoverAllPages, getPageNameAr, getPageNameEn };
