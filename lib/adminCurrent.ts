import { getAdminSession } from "./adminSession";
import { getAdminUserById } from "./adminUsersRepo";
import type { AdminUserRow } from "./adminUsersRepo";

/**
 * الحصول على المستخدم الحالي المسجل دخوله
 * @returns بيانات المستخدم الكاملة أو null إذا لم يكن مسجل دخول أو غير نشط
 */
export async function getCurrentAdminUser(): Promise<AdminUserRow | null> {
  try {
    const session = await getAdminSession();
    if (!session) {
      console.error("[getCurrentAdminUser] No session found");
      return null;
    }

    const user = await getAdminUserById(session.sub);
    if (!user) {
      console.error(`[getCurrentAdminUser] User not found for session.sub: ${session.sub}`);
      return null;
    }

    if (!user.is_active) {
      console.error(`[getCurrentAdminUser] User ${user.email} is not active`);
      return null;
    }

    return user;
  } catch (error) {
    console.error("[getCurrentAdminUser] Fatal error:", error);
    return null;
  }
}
