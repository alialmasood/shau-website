import { getAdminSession } from "./adminSession";
import { hasPermission, getUserPermissions } from "./adminUsersRepo";

/**
 * التحقق من صلاحية محددة للمستخدم الحالي
 */
export async function checkPermission(resource: string, action: string): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;

  // المستخدمون من نوع ADMIN لديهم جميع الصلاحيات
  // يمكنك إضافة منطق إضافي هنا للتحقق من الدور
  return await hasPermission(session.sub, resource, action);
}

/**
 * الحصول على جميع صلاحيات المستخدم الحالي
 */
export async function getCurrentUserPermissions() {
  const session = await getAdminSession();
  if (!session) return [];

  return await getUserPermissions(session.sub);
}

/**
 * التحقق من أن المستخدم لديه صلاحية محددة، وإرجاع خطأ إذا لم يكن لديه
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<{ hasPermission: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { hasPermission: false, error: "غير مصرح - يرجى تسجيل الدخول" };
  }

  const has = await hasPermission(session.sub, resource, action);
  if (!has) {
    return {
      hasPermission: false,
      error: "ليس لديك صلاحية للوصول إلى هذا المورد",
    };
  }

  return { hasPermission: true };
}

/**
 * التحقق من أن المستخدم لديه أي من الصلاحيات المحددة
 */
export async function checkAnyPermission(
  permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;

  for (const perm of permissions) {
    if (await hasPermission(session.sub, perm.resource, perm.action)) {
      return true;
    }
  }

  return false;
}

/**
 * التحقق من أن المستخدم لديه جميع الصلاحيات المحددة
 */
export async function checkAllPermissions(
  permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;

  for (const perm of permissions) {
    if (!(await hasPermission(session.sub, perm.resource, perm.action))) {
      return false;
    }
  }

  return true;
}
