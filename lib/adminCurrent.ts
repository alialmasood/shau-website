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
      console.error("[getCurrentAdminUser] No session found - cookie may be missing, expired, or invalid");
      return null;
    }

    console.log(`[getCurrentAdminUser] Session found for user ID: ${session.sub}, exp: ${session.exp}`);

    const user = await getAdminUserById(session.sub);
    if (!user) {
      console.error(`[getCurrentAdminUser] User not found for session.sub: ${session.sub}`);
      return null;
    }

    console.log(`[getCurrentAdminUser] User found: ${user.email}, role: ${user.role}, is_active: ${user.is_active}`);

    if (!user.is_active) {
      console.error(`[getCurrentAdminUser] User ${user.email} is not active`);
      return null;
    }

    console.log(`[getCurrentAdminUser] Returning user: ${user.email}`);
    return user;
  } catch (error) {
    console.error("[getCurrentAdminUser] Fatal error:", error);
    if (error instanceof Error) {
      console.error("[getCurrentAdminUser] Error message:", error.message);
      console.error("[getCurrentAdminUser] Error stack:", error.stack);
    }
    return null;
  }
}
