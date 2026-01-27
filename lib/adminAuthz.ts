import { getCurrentAdminUser } from "./adminCurrent";
import { query } from "./db";

type Action = "access" | "view" | "create" | "edit" | "delete" | "upload" | "export" | "publish";

/**
 * التحقق من صلاحية المستخدم الحالي على صفحة معينة
 * @param pageCode كود الصفحة (مثل: "news", "users", "programs")
 * @param action الإجراء المطلوب (access, view, create, edit, delete, upload, export, publish)
 * @returns true إذا كان لديه الصلاحية، false إذا لم يكن
 */
export async function canAdmin(pageCode: string, action: Action = "access"): Promise<boolean> {
  const user = await getCurrentAdminUser();
  if (!user) {
    console.error(`[canAdmin] No current user for pageCode: ${pageCode}, action: ${action}`);
    return false;
  }

  // إذا كان دور المستخدم ADMIN => صلاحيات كاملة
  // التحقق من role بحساسية للحالة (uppercase)
  if (user.role.toUpperCase() === "ADMIN") {
    console.log(`[canAdmin] User ${user.email} is ADMIN, granting full access to ${pageCode}`);
    return true;
  }

  // جلب صلاحيات الصفحة للمستخدم
  const res = await query(
    `SELECT can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish
     FROM admin_page_permissions app
     INNER JOIN admin_pages ap ON app.page_id = ap.id
     WHERE app.admin_user_id = $1 AND ap.code = $2
     LIMIT 1`,
    [user.id, pageCode]
  );

  if (res.rows.length === 0) {
    console.warn(`[canAdmin] No permissions found for user ${user.email} (${user.id}) on page ${pageCode}`);
    return false;
  }

  const perm = res.rows[0];

  // التحقق من can_access أولاً
  if (!perm.can_access) {
    return false;
  }

  // التحقق من الإجراء المحدد
  switch (action) {
    case "access":
      return perm.can_access === true;
    case "view":
      return perm.can_view === true;
    case "create":
      return perm.can_create === true;
    case "edit":
      return perm.can_edit === true;
    case "delete":
      return perm.can_delete === true;
    case "upload":
      return perm.can_upload === true;
    case "export":
      return perm.can_export === true;
    case "publish":
      return perm.can_publish === true;
    default:
      return false;
  }
}

/**
 * الحصول على جميع الصفحات التي يمكن للمستخدم الوصول إليها
 * @returns قائمة بأكواد الصفحات التي can_access = true
 */
export async function getAccessiblePages(): Promise<string[]> {
  const user = await getCurrentAdminUser();
  if (!user) {
    return [];
  }

  // إذا كان ADMIN => كل الصفحات
  if (user.role.toUpperCase() === "ADMIN") {
    const res = await query(`SELECT code FROM admin_pages ORDER BY code`);
    return res.rows.map((r) => String(r.code));
  }

  // غير ذلك: جلب الصفحات التي can_access = true
  const res = await query(
    `SELECT ap.code
     FROM admin_page_permissions app
     INNER JOIN admin_pages ap ON app.page_id = ap.id
     WHERE app.admin_user_id = $1 AND app.can_access = true
     ORDER BY ap.code`,
    [user.id]
  );

  return res.rows.map((r) => String(r.code));
}
