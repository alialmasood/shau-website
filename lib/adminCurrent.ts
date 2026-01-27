import { getAdminSession } from "./adminSession";
import { getAdminUserById } from "./adminUsersRepo";
import type { AdminUserRow } from "./adminUsersRepo";

/**
 * الحصول على المستخدم الحالي المسجل دخوله
 * @returns بيانات المستخدم الكاملة أو null إذا لم يكن مسجل دخول أو غير نشط
 */
export async function getCurrentAdminUser(): Promise<AdminUserRow | null> {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  const user = await getAdminUserById(session.sub);
  if (!user || !user.is_active) {
    return null;
  }

  return user;
}
