import Link from "next/link";
import { getAllAdminUsers, type AdminUserRow } from "@/lib/adminUsersRepo";
import { getAdminSession } from "@/lib/adminSession";
import DeleteUserButton from "./DeleteUserButton";
// @ts-ignore - TypeScript cache issue
import CopyUrlButton from "./CopyUrlButton";

// منع cache هذه الصفحة بشكل كامل
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - يرجى تسجيل الدخول</p>
        </div>
      </div>
    );
  }

  let users: Awaited<ReturnType<typeof getAllAdminUsers>> = [];
  try {
    users = await getAllAdminUsers();
    // تسجيل للتحقق من النتائج
    console.log(`[AdminUsersPage] Fetched ${users.length} users`);
    if (users.length > 0) {
      console.log(`[AdminUsersPage] First user:`, {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        is_active: users[0].is_active,
      });
    }
  } catch (error) {
    console.error("[AdminUsersPage] Error fetching users:", error);
    if (error instanceof Error) {
      console.error("[AdminUsersPage] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    users = [];
  }

  // إحصائيات سريعة
  const activeUsers = users.filter((u: { is_active: boolean }) => u.is_active).length;
  const inactiveUsers = users.filter((u: { is_active: boolean }) => !u.is_active).length;
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

  // معلومات Debug - دائماً تظهر
  const debugInfo = {
    sessionExists: !!session,
    sessionId: session?.sub?.substring(0, 8) || "N/A",
    usersCount: users.length,
    firstUserEmail: users.length > 0 ? users[0].email : "N/A",
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* معلومات Debug - دائماً تظهر */}
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-lg text-sm">
          <p className="font-bold text-red-900 mb-2 text-lg">🔍 معلومات Debug (دائماً تظهر):</p>
          <div className="space-y-1 text-red-800 font-mono text-xs">
            <p>✅ الجلسة: {debugInfo.sessionExists ? `موجودة (ID: ${debugInfo.sessionId}...)` : "❌ غير موجودة"}</p>
            <p>📊 عدد المستخدمين: <strong className="text-lg">{debugInfo.usersCount}</strong></p>
            <p>📧 البريد الأول: {debugInfo.firstUserEmail}</p>
            <p>⏰ الوقت: {debugInfo.timestamp}</p>
            {users.length > 0 ? (
              <div className="mt-2 p-2 bg-white rounded border border-red-300">
                <p className="font-bold">المستخدم الأول:</p>
                <p>• البريد: {users[0].email}</p>
                <p>• الدور: {users[0].role}</p>
                <p>• الحالة: {users[0].is_active ? "✅ نشط" : "❌ معطل"}</p>
                <p>• الاسم: {users[0].full_name || "—"}</p>
                <p>• ID: {users[0].id.substring(0, 8)}...</p>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <p className="text-red-600 font-bold">⚠️ لا يوجد مستخدمين في المصفوفة!</p>
                <p className="text-xs mt-1">تحقق من سجلات السيرفر للخطأ</p>
              </div>
            )}
          </div>
        </div>
        
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
            <Link
              href="/admin/users/roles"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              تكوين دور
            </Link>
            <Link
              href="/admin"
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
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-bold mb-2">💡 ملاحظة:</p>
              <p className="mb-2">إذا كنت متأكداً من وجود مستخدمين في قاعدة البيانات، تحقق من:</p>
              <ul className="list-disc list-inside text-right space-y-1">
                <li>سجلات السيرفر (console logs) للتحقق من أي أخطاء</li>
                <li>تشغيل: <code className="bg-yellow-100 px-2 py-1 rounded">npm run admin:check-users</code> للتحقق من قاعدة البيانات</li>
                <li>الاتصال بقاعدة البيانات على السيرفر</li>
              </ul>
            </div>
            <Link
              href="/admin/users/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إنشاء مستخدم جديد
            </Link>
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
                      الرابط المخصص
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
                  {users.map((user: AdminUserRow) => (
                    <tr key={user.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-900">
                          {user.full_name || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {user.custom_url ? (
                            <CopyUrlButton url={user.custom_url} />
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="text-[#31BD9C] hover:text-[#2aa88a] font-bold"
                          >
                            تعديل
                          </Link>
                          <DeleteUserButton
                            userId={user.id}
                            userName={user.full_name || user.email}
                            currentUserId={session.sub}
                          />
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
