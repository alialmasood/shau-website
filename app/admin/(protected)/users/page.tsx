import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAllAdminUsers, type AdminUserRow } from "@/lib/adminUsersRepo";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminUsersPage() {
  // التحقق من تسجيل الدخول
  console.log("[AdminUsersPage] Checking current user...");
  const user = await getCurrentAdminUser();
  if (!user) {
    console.error("[AdminUsersPage] No current user found, redirecting to login");
    redirect("/admin/login");
  }

  console.log(`[AdminUsersPage] User authenticated: ${user.email}, role: ${user.role}`);

  // إذا كان ADMIN، صلاحيات كاملة - لا حاجة للتحقق من canAdmin
  const isAdmin = user.role.toUpperCase() === "ADMIN";
  
  // التحقق من الصلاحية فقط إذا لم يكن ADMIN
  let hasAccess = isAdmin;
  if (!isAdmin) {
    try {
      hasAccess = await canAdmin("users", "access");
    } catch (error) {
      console.error("[AdminUsersPage] Error checking permissions:", error);
      // في حالة خطأ، نعطي ADMIN صلاحيات كاملة كـ fallback
      hasAccess = isAdmin;
    }
  }
  
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
            <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
              العودة إلى لوحة التحكم
            </Link>
        </div>
      </div>
    );
  }

  let users: AdminUserRow[] = [];
  try {
    users = await getAllAdminUsers();
  } catch (error) {
    console.error("[AdminUsersPage] Error fetching users:", error);
    users = [];
  }

  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;
  const totalUsers = users.length;

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "EDITOR":
        return "bg-green-100 text-green-800";
      case "VIEWER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  }

  function getRoleLabel(role: string): string {
    switch (role) {
      case "ADMIN":
        return "مدير";
      case "MANAGER":
        return "مدير فرعي";
      case "EDITOR":
        return "محرر";
      case "VIEWER":
        return "مشاهد";
      default:
        return role;
    }
  }

  // إذا كان ADMIN، صلاحيات كاملة
  const userIsAdmin = user.role.toUpperCase() === "ADMIN";
  let canCreate = userIsAdmin;
  let canEdit = userIsAdmin;
  let canDelete = userIsAdmin;
  
  // التحقق من الصلاحيات فقط إذا لم يكن ADMIN
  if (!userIsAdmin) {
    try {
      canCreate = await canAdmin("users", "create");
      canEdit = await canAdmin("users", "edit");
      canDelete = await canAdmin("users", "delete");
    } catch (error) {
      console.error("[AdminUsersPage] Error checking permissions:", error);
      // في حالة خطأ، نعطي false
      canCreate = false;
      canEdit = false;
      canDelete = false;
    }
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              إدارة المستخدمين
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              إدارة المستخدمين والصلاحيات
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {canCreate && (
              <Link
                href="/admin/users/new"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                إنشاء مستخدم جديد
              </Link>
            )}
            <Link
              href="/admin"
              prefetch={false}
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              رجوع
            </Link>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">إجمالي المستخدمين</p>
                  <p className="text-2xl font-extrabold text-neutral-900">{totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#31BD9C]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#31BD9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">المستخدمون النشطون</p>
                  <p className="text-2xl font-extrabold text-green-600">{activeUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-1">المستخدمون المعطلون</p>
                  <p className="text-2xl font-extrabold text-red-600">{inactiveUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-neutral-500 mb-4">لا يوجد مستخدمين بعد</p>
            {canCreate && (
              <Link
                href="/admin/users/new"
                prefetch={false}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إنشاء مستخدم جديد
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {users.map((userRow: AdminUserRow) => (
                    <tr key={userRow.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-900">
                          {userRow.full_name || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{userRow.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            userRow.role
                          )}`}
                        >
                          {getRoleLabel(userRow.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userRow.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {userRow.is_active ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <Link
                              href={`/admin/users/${userRow.id}/edit`}
                              prefetch={false}
                              className="text-[#31BD9C] hover:text-[#2aa88a] font-bold"
                            >
                              تعديل
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
