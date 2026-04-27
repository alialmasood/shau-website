import { query } from "./db";

export type AdminPageRow = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  parentCode: string | null; // كود الصفحة الأساسية (للصفحات الفرعية)
  created_at: string;
  updated_at: string;
};

export type AdminPagePermissionRow = {
  id: string;
  admin_user_id: string;
  page_id: string;
  can_access: boolean;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_upload: boolean;
  can_export: boolean;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
};

// ترتيب الصفحات الرئيسية (للعرض)
const PAGE_ORDER: Record<string, number> = {
  "admin": 1,
  "news": 2,
  "programs": 3,
  "departments": 4,
  "registration": 5,
  "applications": 6,
  "users": 7,
  "content": 8,
  "ticker": 9,
  "social": 10,
  "tuition": 11,
  "tuition-pdf": 12,
  "events": 13,
  "continuing-education": 14,
};

// خريطة الصفحات الفرعية -> الصفحات الأساسية
const CHILD_TO_PARENT: Record<string, string> = {
  "required-documents": "registration",
  // يمكن إضافة صفحات فرعية أخرى هنا
};

const REQUIRED_PAGES: Array<{
  code: string;
  nameAr: string;
  nameEn?: string | null;
  parentCode?: string | null;
}> = [
  { code: "admin", nameAr: "لوحة التحكم", nameEn: "Admin", parentCode: null },
  { code: "news", nameAr: "الأخبار", nameEn: "News", parentCode: null },
  { code: "events", nameAr: "الأحداث", nameEn: "Events", parentCode: null },
  { code: "programs", nameAr: "برامج الكلية", nameEn: "Programs", parentCode: null },
  { code: "ticker", nameAr: "الشريط الإخباري", nameEn: "Ticker", parentCode: null },
  { code: "social", nameAr: "السوشيال ميديا", nameEn: "Social", parentCode: null },
  { code: "tuition", nameAr: "إدارة الرسوم", nameEn: "Tuition", parentCode: null },
  { code: "tuition-pdf", nameAr: "تحميل الرسوم PDF", nameEn: "Tuition PDF", parentCode: null },
  { code: "applications", nameAr: "طلبات التقديم", nameEn: "Applications", parentCode: null },
  { code: "registration", nameAr: "شؤون التسجيل", nameEn: "Registration", parentCode: null },
  { code: "required-documents", nameAr: "الوثائق المطلوبة", nameEn: "Required Documents", parentCode: "registration" },
  { code: "users", nameAr: "إدارة المستخدمين", nameEn: "Users", parentCode: null },
  { code: "results", nameAr: "إدارة النتائج", nameEn: "Results", parentCode: null },
  { code: "grades", nameAr: "إدارة الدرجات", nameEn: "Grades", parentCode: null },
  { code: "accounts", nameAr: "الحسابات", nameEn: "Accounts", parentCode: null },
  { code: "student-accounts", nameAr: "حسابات الطلاب", nameEn: "Student Accounts", parentCode: null },
  { code: "student-id", nameAr: "هويات الطلبة", nameEn: "Student ID", parentCode: null },
  { code: "staff-identity", nameAr: "هويات الكادر", nameEn: "Staff identity requests", parentCode: null },
  {
    code: "continuing-education",
    nameAr: "التعليم المستمر",
    nameEn: "Continuing Education",
    parentCode: null,
  },
];

async function hasParentCodeColumn(): Promise<boolean> {
  const colRes = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = 'admin_pages' AND column_name = 'parent_code'
     LIMIT 1`
  );
  return colRes.rows.length > 0;
}

async function ensureRequiredAdminPages(existingCodes: Set<string>) {
  const missing = REQUIRED_PAGES.filter((p) => !existingCodes.has(p.code));
  if (missing.length === 0) return;

  const hasParentCode = await hasParentCodeColumn();

  for (const page of missing) {
    if (hasParentCode) {
      await query(
        `INSERT INTO admin_pages (code, name_ar, name_en, parent_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO NOTHING`,
        [page.code, page.nameAr, page.nameEn ?? null, page.parentCode ?? null]
      );
    } else {
      await query(
        `INSERT INTO admin_pages (code, name_ar, name_en)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [page.code, page.nameAr, page.nameEn ?? null]
      );
    }
  }
}

/**
 * يضمن وجود كل الصفحات المعرفة في REQUIRED_PAGES داخل admin_pages (للتنقل و RBAC).
 * آمن للاستدعاء المتكرر — INSERT ... ON CONFLICT DO NOTHING.
 */
export async function ensureAdminCatalogPages(): Promise<void> {
  const rows = await fetchAdminPages();
  const existingCodes = new Set(rows.map((r) => String(r.code)));
  await ensureRequiredAdminPages(existingCodes);
}

async function fetchAdminPages() {
  const hasParentCode = await hasParentCodeColumn();
  if (hasParentCode) {
    const res = await query(
      `SELECT id, code, name_ar, name_en, parent_code, created_at, updated_at
       FROM admin_pages
       ORDER BY 
         CASE WHEN parent_code IS NULL THEN 0 ELSE 1 END,
         COALESCE(parent_code, code),
         name_ar`
    );
    return res.rows;
  }
  const res = await query(
    `SELECT id, code, name_ar, name_en, created_at, updated_at
     FROM admin_pages
     ORDER BY name_ar`
  );
  return res.rows.map((r) => ({ ...r, parent_code: null }));
}

export async function getAllAdminPages(): Promise<AdminPageRow[]> {
  let rows = await fetchAdminPages();
  const existingCodes = new Set(rows.map((r) => String(r.code)));
  await ensureRequiredAdminPages(existingCodes);
  rows = await fetchAdminPages();

  const pages = rows.map((r) => {
    // قراءة parentCode من قاعدة البيانات (ديناميكي)
    // Fallback إلى CHILD_TO_PARENT للتوافق مع البيانات القديمة
    const parentCode = r.parent_code ? String(r.parent_code) : (CHILD_TO_PARENT[r.code] || null);
    
    return {
      id: String(r.id),
      code: String(r.code),
      nameAr: String(r.name_ar),
      nameEn: r.name_en ? String(r.name_en) : null,
      parentCode: parentCode,
      created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
      updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
    };
  });
  
  // ترتيب الصفحات: الأساسية أولاً (حسب PAGE_ORDER إن وجد، وإلا حسب الاسم)، ثم الفرعية
  // النظام الآن ديناميكي: الصفحات الجديدة تظهر تلقائياً حتى لو لم تكن في PAGE_ORDER
  const sortedPages = pages.sort((a, b) => {
    // إذا كانت الصفحة فرعية، نضعها بعد الصفحة الأساسية
    if (a.parentCode && !b.parentCode) {
      // a فرعية، b أساسية
      const parentOrder = PAGE_ORDER[a.parentCode] ?? 999;
      const bOrder = PAGE_ORDER[b.code] ?? 999;
      if (parentOrder === bOrder) return 1; // الفرعية بعد الأساسية
      if (parentOrder !== 999 && bOrder !== 999) return parentOrder - bOrder;
      if (parentOrder !== 999) return -1; // الصفحة الأساسية لها ترتيب محدد
      if (bOrder !== 999) return 1; // الصفحة الأساسية لها ترتيب محدد
      // كلاهما بدون ترتيب محدد، نرتب حسب الاسم
      return a.nameAr.localeCompare(b.nameAr, "ar");
    }
    if (!a.parentCode && b.parentCode) {
      // a أساسية، b فرعية
      const aOrder = PAGE_ORDER[a.code] ?? 999;
      const parentOrder = PAGE_ORDER[b.parentCode] ?? 999;
      if (aOrder === parentOrder) return -1; // الأساسية قبل الفرعية
      if (aOrder !== 999 && parentOrder !== 999) return aOrder - parentOrder;
      if (aOrder !== 999) return -1;
      if (parentOrder !== 999) return 1;
      return a.nameAr.localeCompare(b.nameAr, "ar");
    }
    if (a.parentCode && b.parentCode) {
      // كلاهما فرعية
      const aParentOrder = PAGE_ORDER[a.parentCode] ?? 999;
      const bParentOrder = PAGE_ORDER[b.parentCode] ?? 999;
      if (aParentOrder !== bParentOrder && aParentOrder !== 999 && bParentOrder !== 999) {
        return aParentOrder - bParentOrder;
      }
      // نفس الصفحة الأساسية أو كلاهما بدون ترتيب محدد، نرتب حسب الاسم
      if (a.parentCode === b.parentCode) {
        return a.nameAr.localeCompare(b.nameAr, "ar");
      }
      return a.parentCode.localeCompare(b.parentCode);
    }
    // كلاهما أساسية
    const aOrder = PAGE_ORDER[a.code] ?? 999;
    const bOrder = PAGE_ORDER[b.code] ?? 999;
    if (aOrder !== bOrder && aOrder !== 999 && bOrder !== 999) {
      return aOrder - bOrder;
    }
    // كلاهما بدون ترتيب محدد أو نفس الترتيب، نرتب حسب الاسم
    return a.nameAr.localeCompare(b.nameAr, "ar");
  });
  
  // تسجيل للتشخيص
  console.log(`[getAllAdminPages] Fetched ${sortedPages.length} pages from database`);
  const withParent = sortedPages.filter(p => p.parentCode);
  if (withParent.length > 0) {
    console.log(`[getAllAdminPages] Pages with parentCode:`, withParent.map(p => `${p.code} -> ${p.parentCode}`));
  } else {
    console.log(`[getAllAdminPages] No pages with parentCode found. Make sure required-documents exists in database.`);
  }
  
  return sortedPages;
}

export async function getAdminPageByCode(code: string): Promise<AdminPageRow | null> {
  const hasParentCode = await hasParentCodeColumn();
  const res = await query(
    hasParentCode
      ? `SELECT id, code, name_ar, name_en, parent_code, created_at, updated_at
         FROM admin_pages
         WHERE code = $1
         LIMIT 1`
      : `SELECT id, code, name_ar, name_en, created_at, updated_at
         FROM admin_pages
         WHERE code = $1
         LIMIT 1`,
    [code]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  
  // قراءة parentCode من قاعدة البيانات (ديناميكي)
  // Fallback إلى CHILD_TO_PARENT للتوافق مع البيانات القديمة
  const parentCode = r.parent_code ? String(r.parent_code) : (CHILD_TO_PARENT[r.code] || null);
  
  return {
    id: String(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
    nameEn: r.name_en ? String(r.name_en) : null,
    parentCode: parentCode,
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function getUserPagePermissions(userId: string): Promise<AdminPagePermissionRow[]> {
  const res = await query(
    `SELECT id, admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at
     FROM admin_page_permissions
     WHERE admin_user_id = $1
     ORDER BY page_id`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    admin_user_id: String(r.admin_user_id),
    page_id: String(r.page_id),
    can_access: Boolean(r.can_access),
    can_view: Boolean(r.can_view),
    can_create: Boolean(r.can_create),
    can_edit: Boolean(r.can_edit),
    can_delete: Boolean(r.can_delete),
    can_upload: Boolean(r.can_upload),
    can_export: Boolean(r.can_export),
    can_publish: Boolean(r.can_publish),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  }));
}

export async function getUserPagePermissionByCode(
  userId: string,
  pageCode: string
): Promise<AdminPagePermissionRow | null> {
  const res = await query(
    `SELECT app.id, app.admin_user_id, app.page_id, app.can_access, app.can_view, app.can_create, app.can_edit, app.can_delete, app.can_upload, app.can_export, app.can_publish, app.created_at, app.updated_at
     FROM admin_page_permissions app
     INNER JOIN admin_pages ap ON app.page_id = ap.id
     WHERE app.admin_user_id = $1 AND ap.code = $2
     LIMIT 1`,
    [userId, pageCode]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: String(r.id),
    admin_user_id: String(r.admin_user_id),
    page_id: String(r.page_id),
    can_access: Boolean(r.can_access),
    can_view: Boolean(r.can_view),
    can_create: Boolean(r.can_create),
    can_edit: Boolean(r.can_edit),
    can_delete: Boolean(r.can_delete),
    can_upload: Boolean(r.can_upload),
    can_export: Boolean(r.can_export),
    can_publish: Boolean(r.can_publish),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function setUserPagePermissions(
  userId: string,
  pageId: string,
  permissions: {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_upload: boolean;
    can_export: boolean;
    can_publish: boolean;
  }
): Promise<void> {
  await query(
    `INSERT INTO admin_page_permissions (admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     ON CONFLICT (admin_user_id, page_id)
     DO UPDATE SET
       can_access = EXCLUDED.can_access,
       can_view = EXCLUDED.can_view,
       can_create = EXCLUDED.can_create,
       can_edit = EXCLUDED.can_edit,
       can_delete = EXCLUDED.can_delete,
       can_upload = EXCLUDED.can_upload,
       can_export = EXCLUDED.can_export,
       can_publish = EXCLUDED.can_publish,
       updated_at = NOW()`,
    [
      userId,
      pageId,
      permissions.can_access,
      permissions.can_view,
      permissions.can_create,
      permissions.can_edit,
      permissions.can_delete,
      permissions.can_upload,
      permissions.can_export,
      permissions.can_publish,
    ]
  );
}

export async function deleteUserPagePermissions(userId: string): Promise<void> {
  await query(`DELETE FROM admin_page_permissions WHERE admin_user_id = $1`, [userId]);
}
